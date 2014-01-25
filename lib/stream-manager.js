module.exports = StreamManager;

var events = require('events');
var uuid = require('node-uuid');
var utils = require('express/node_modules/connect/lib/utils');
var MediaAggregator = require('./media-aggregator');

var TwitterService = require('./twitter-service');
var InstagramService = require('./instagram-service');

function StreamManager(user, settings) {
  console.log('StreamManager created');
  this.user = user;
  
  this.listeners = {};
  this.active = false;
  this.uuid = uuid(); // TODO: Maybe change this in the future to be the RowKey of the stream settings obj.
  this.timeoutHandle = null;
  this.media = new Array();
  
  this.settings = utils.merge(StreamManager.defaultSettings, settings);
  
  // Initialize as event emitter
  events.EventEmitter.call(this);
  
  // Create the MediaAggregator and populate its services.
  this.mediaAggregator = new MediaAggregator(this.settings);
  
  // Attach events to MediaAggregator
  var self = this;
  this.detachListener = function(listenerId) {
    console.log('Detaching listener ' + listenerId);
    var listener = self.listeners[listenerId];
  
    if (listener) {

      // Detach media events
      self.removeListener('initial-media', listener.initialMedia);
      self.removeListener('new-media', listener.newMedia);
  
      // Detach detach handler (yo dawg)
      listener.removeListener('detach', self.detachListener);
  
      // Remove listener from listener hash
      delete self.listeners[listenerId];
  
      if (Object.keys(self.listeners).length === 0 && self.active && !self.timeoutHandle) {
        // If there are no listeners left, start the countdown to deactivation.
        console.log('StreamManager starting countdown to shutdown (' + self.settings.idleTimeoutSeconds + ')');
        self.timeoutHandle = setTimeout(function() {
          self.stop();
        }, self.settings.idleTimeoutSeconds * 1000);
      }
    }
  };
  
  
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

// Stream manager also has to know what services to instantiate and add to the aggregator.

StreamManager.prototype.attachListener = function(listener) {
  var self = this;
  
  if (!self.listeners[listener.id]) {
    console.log('Attaching listener ' + listener.id);
    listener.attached = true;
    if (self.active) {
      listener.initialMedia(self.media);
    }
    
    // Attach media events
    self.on('initial-media', listener.initialMedia);
    self.on('new-media', listener.newMedia);
    
    // Attach detach handler
    listener.on('detach', self.detachListener);
    
    // Add to list of listeners
    self.listeners[listener.id] = listener;
    
    // If the timer is running for deactivation, turn it off.
    if (self.timeoutHandle) {
      console.log('Clearing shutdown timeout');
      clearTimeout(self.timeoutHandle);
      self.timeoutHandle = null;
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
  
  self.media.push(media);
  
  if (self.media.length > self.settings.maxMedia) {
    self.media = self.media.slice(1);
  }
  
  self.emit('new-media', media);
};

StreamManager.prototype.start = function() {
  if (!this.active) {
    this.active = true;
    this.mediaAggregator.start();
    StreamManager.streams[this.uuid] = this;
    
    if (Object.keys(this.listeners).length === 0 && !this.timeoutHandle) {
      var self = this;
      this.timeoutHandle = setTimeout(function() {
          self.stop();
        }, this.settings.idleTimeoutSeconds * 1000);
    }
  }
};

StreamManager.prototype.stop = function() {
  var self = this;
  console.log('StreamManager shutting down');
  
  if (this.active) {
    // Do this first so that when we detach the last listener we don't trigger the
    // countdown timer for deactivation.
    this.active = false;
    
    // Detach all listeners.
    for(var listenerId in self.listeners) {
      self.detachListener(listenerId);
    }
    
    delete StreamManager.streams[this.uuid];
    this.mediaAggregator.stop();
  }
}

// Global hash of stream references.
StreamManager.streams = {};