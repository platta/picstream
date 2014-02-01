/**
 * StreamListener
 * A class that manages a single socket connection.  Since we are dealing with event
 * handlers that can't be anonymous functions (because we need to detach them), and there
 * is additional logic like disconnect/reconnect handling with timeouts, I decided to
 * make this a full class.
 */
module.exports = StreamListener;

var events = require('events');
var StreamManager = require('./stream-manager.js');
var utils = require('express/node_modules/connect/lib/utils');

function StreamListener(socket, settings) {
  this.socket = socket;
  this.attached = false;
  this.id = 'SL' + socket.id;
  
  this.settings = utils.merge(StreamListener.defaultSettings, settings);

  // These functions are defined inside of the main class function so that we can
  // reference our "self" object without relying on the this keyword.  Since these
  // functions will be getting fired by EventEmitters, we can't count on "this" pointing
  // to the right thing.
  var self = this;  
  
  
  // Attach this listener to a StreamManager.
  this.attach = function(data, callback) {
    if (StreamManager.streams[data.streamId]) {
      StreamManager.streams[data.streamId].attachListener({listener: self, reconnect: data.reconnect});
      callback(null, {attached: true});
    } else {
      callback(null, {attached: false});
    }
  };
  
  
  // Detach this listener from all StreamManagers it may be attached to.  We do this by
  // emitting an event, which all attached StreamManagers will be set to respond to.
  this.detach = function(data) {
    self.attached = false;
    self.emit('detach', {id: self.id, intentional: data.intentional});
  };


  // Called by the attached StreamManager when its MediaAggregator has finished getting
  // initial media
  this.initialMedia = function(data) {
    data.forEach(function(media) {
      self.newMedia(media);
    });
  };


  // Called by the attached StreamManager whenever new media arrives
  this.newMedia = function(media) {
    self.socket.emit('new-media', media);
  };


  // Now wire up some event handlers
  this.socket.on('attach', this.attach);
  this.socket.on('detach', this.detach);
  
  // If the socket drops connection while attached, detach with a flag telling the
  // StreamManager that this is an unintentional detach and it should wait for a while
  // in case the client reconnects.
  this.socket.on('disconnect', function() {
    console.log(self.id + ' Socket disconnected');
    self.detach({intentional: false});    
  });
  
  // Initialize as event emitter
  events.EventEmitter.call(this);
}
StreamListener.prototype.__proto__ = events.EventEmitter.prototype;

StreamListener.defaultSettings = {};