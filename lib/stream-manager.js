/**
 * StreamManager
 * A class that encapsulates the concept of a single stream of media.  Uses a 
 * MediaAggregator to get media, and also handles attach/detach logic in conjunction with
 * StreamListeners and their sockets.
 */
module.exports = StreamManager;

var events = require('events');
var uuid = require('node-uuid');
var utils = require('express/node_modules/connect/lib/utils');

var MediaAggregator = require('./media-aggregator');

var TwitterService = require('./twitter-service');
var InstagramService = require('./instagram-service');

function StreamManager(user, settings) {
  this.user = user;
  
  this.listeners = {};
  this.active = false;
  this.uuid = 'SM' + uuid(); // TODO: Maybe change this in the future to be the RowKey of the stream settings obj.
  this.timeoutHandle = null;
  this.media = new Array();
  this.waitingForInitialConnection = false;
  
  console.log(this.uuid + ' created');
  
  this.settings = utils.merge(StreamManager.defaultSettings, settings);
  
  // Initialize as event emitter
  events.EventEmitter.call(this);
  
  // Create the MediaAggregator and populate its services.
  this.mediaAggregator = new MediaAggregator(this.settings);
  
  
  // These functions are defined within the main class function so that we can call them
  // from an EventEmitter without having to worry about what the "this" keyword points to.
  // Instead, we can just reference this self variable.
  var self = this;
  
  // This function gets called in 2 scenarios.
  // 1: The stream just started, and nobody has connected within the first X seconds.
  // 2: Someone dropped connection X seconds ago.
  // The function checks to see if there are currently any listeners.  If so, it will
  // do nothing.  If there are no listeners, it will shut the stream down.
  this.timeoutHandler = function() {
    self.timeoutHandle = null;
    if (Object.keys(self.listeners).length === 0) {
      // Our timer ran out and there are still no listeners.  Shut down now.
      console.log(self.uuid + ' Idle timeout expired, no listeners');
      self.stop();
    } else {
      console.log(self.uuid + ' Idle timeout expired, but found listeners');
    }
  };
  
  this.detachListener = function(data) {
    if (data.intentional) {
      console.log(self.uuid + ' Detaching listener ' + data.id + ' - intentional disconnect');
    } else {
      console.log(self.uuid + ' Detaching listener ' + data.id + ' - unintentional disconnect');
    }
    
    var listener = self.listeners[data.id];
  
    if (listener) {
      // Detach media events
      self.removeListener('initial-media', listener.initialMedia);
      self.removeListener('new-media', listener.newMedia);
  
      // Detach detach handler (yo dawg)
      listener.removeListener('detach', self.detachListener);
  
      // Remove listener from listener hash
      delete self.listeners[data.id];

      console.log(self.uuid + ' ' + Object.keys(self.listeners).length + ' listeners remaining');

      // If this was not an intentional disconnect, we need to make sure we don't shut
      // down until we have waited for this client to reconnect.
      if (!data.intentional) {
        // If we were already waiting on another person to reconnect, clear that timer
        // and restart.  It won't affect the other person, since they're just going
        // to get more time to reconnect before a potential shutdown.
        if (self.timeoutHandle) {          
          clearTimeout(self.timeoutHandle);
        }
        
        // Wait for a set period of time and then check to see if we have any listeners.
        self.timeoutHandle = setTimeout(self.timeoutHandler, self.settings.idleTimeoutSeconds * 1000);
      } else {
        // This is an intentional disconnect.  If there is no active timeout and there are
        // no other listeners, shut down.
        if (!self.timeoutHandle && Object.keys(self.listeners).length === 0) {
          self.stop();
        }
      }      
    }
  };
  
  this.start = function() {
    if (!self.active) {
      console.log(self.uuid + ' Starting');
      self.active = true;
      self.mediaAggregator.start();
      StreamManager.streams[self.uuid] = self;
    
      // If there are no listeners, immediately start the countdown to stopping again.  This
      // may seem a little weird, but there should be a listener connecting soon!
      if (Object.keys(self.listeners).length === 0 && !self.timeoutHandle) {
        self.waitingForInitialConnection = true;
        self.timeoutHandle = setTimeout(self.timeoutHandler, this.settings.idleTimeoutSeconds * 1000);
      }
    }
  };
  
  
  // Wire media events to pass from the MediaAggregator through this StreamManager
  this.mediaAggregator.on('initial-media', function(data) {
    self.initialMedia(data)
  });
  
  this.mediaAggregator.on('new-media', function(media) {
    self.newMedia(media);
  });
  
  
  // Read settings and create required service objects
  if (this.settings.streamTwitter) {
    var twitterService = new TwitterService(this.user, this.settings);
    this.mediaAggregator.addService(twitterService);
  }
  
  if (this.settings.streamInstagram) {
    var instagramService = new InstagramService(this.user, this.settings);
    this.mediaAggregator.addService(instagramService);
  }
}
StreamManager.prototype.__proto__ = events.EventEmitter.prototype;

StreamManager.defaultSettings = {
  maxMedia: 10,
  idleTimeoutSeconds: 60
};


StreamManager.prototype.attachListener = function(data) {
  var self = this;
  var listener = data.listener
  if (!self.listeners[listener.id]) {
    console.log(self.uuid + ' Attaching listener ' + listener.id);
    listener.attached = true;
    
    // Send all current media unless this is a reconnect
    if (self.active && !data.reconnect) {
      listener.initialMedia(self.media);
    }
    
    // Attach media events
    self.on('initial-media', listener.initialMedia);
    self.on('new-media', listener.newMedia);
    
    // Attach detach handler
    listener.on('detach', self.detachListener);
    
    // Add to list of listeners
    self.listeners[listener.id] = listener;    
    
    // If we just started up, the countdown timer is running because we are waiting for
    // the initial connection.  If this is that initial connection, kill the timer.
    if (self.waitingForInitialConnection) {
      self.waitingForInitialConnection = false;
      if (self.timeoutHandle) {
        clearTimeout(self.timeoutHandle);
        self.timeoutHandle = null;
      }
    }
  }
};


StreamManager.prototype.initialMedia = function(data) {
  var self = this;
  data.forEach(function(item) {
    self.newMedia(item);
  });
};


StreamManager.prototype.newMedia = function(media) {
  var self = this;
  
  var duplicate = false;
  self.media.forEach(function(item) {
    if (item.url === media.url) {
      duplicate = true;
    }
  });
  
  if (!duplicate) {
    self.media.push(media);
  
    if (self.media.length > self.settings.maxMedia) {
      self.media = self.media.slice(1);
    }
  
    self.emit('new-media', media);
  }
};


StreamManager.prototype.stop = function() {
  var self = this;
  
  if (self.active) {
    console.log(self.uuid + ' Stopping');
    
    // Remove from global hash immediately so no additional connections can come in.
    delete StreamManager.streams[self.uuid];
    self.mediaAggregator.stop();
    
    // Detach all listeners.
    for(var listenerId in self.listeners) {
      self.detachListener({id: listenerId, intentional: true});
    }
    
    self.active = false;
  }
}

// Global hash of stream references.
StreamManager.streams = {};