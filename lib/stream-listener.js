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
  this.id = socket.id;
  this.active = false;
  this.timeoutHandle = null;
  
  this.settings = utils.merge(StreamListener.defaultSettings, settings);

  // These functions are defined inside of the main class function so that we can
  // reference our "self" object without relying on the this keyword.  Since these
  // functions will be getting fired by EventEmitters, we can't count on "this" pointing
  // to the right thing.
  var self = this;  
  
  
  // Attach this listener to a StreamManager.
  this.attach = function(streamId) {
    if (StreamManager.streams[streamId]) {
      StreamManager.streams[streamId].attachListener(self);
      self.socket.emit('attach-succeeded');
    } else {
      self.socket.emit('attach-failed');
    }
  };
  
  
  // Detach this listener from all StreamManagers it may be attached to.  We do this by
  // emitting an event, which all attached StreamManagers will be set to respond to.
  this.detach = function() {
    self.attached = false;
    self.emit('detach', self.id);
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
    self.socket.emit('new-image', media);
  };


  // Now wire up some event handlers
  this.socket.on('attach', this.attach);
  this.socket.on('detach', this.detach);
  
  // If the socket drops connection while attached, wait for a little while but then
  // detach from the stream manager.  The socket may reconnect in time, and we will just
  // resume delivering media.
  this.socket.on('disconnect', function() {
    console.log('Socket(' + self.id + ') disconnected');
    
    if (self.attached && !self.timeoutHandle) {
      console.log('Setting detach timeout for ' + self.settings.disconnectTimeoutSeconds + ' seconds');
      self.timeoutHandle = setTimeout(function() {
        self.detach();
      }, self.settings.disconnectTimeoutSeconds * 1000);
    }
  });
  
  // If the socket reconnects, the client side will need to issue this event, because
  // it's not automatically fired on the server side.  If we haven't detached yet, clear
  // the timer so that we remain attached to our StreamManager
  this.socket.on('reconnect', function() {
    console.log('Socket(' + self.id + ') reconnected');
    if (self.timeoutHandle) {
      console.log('Clearing detach timeout');
      clearTimeout(self.timeoutHandle);
      self.timeoutHandle = null;
    }
  });
  
  // Initialize as event emitter
  events.EventEmitter.call(this);
}
StreamListener.prototype.__proto__ = events.EventEmitter.prototype;

StreamListener.defaultSettings = {
  disconnectTimeoutSeconds: 60
};