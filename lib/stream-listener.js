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
  
  // When socket drops connection, start a timeout timer.  If not reconnected when the timer
  // is up, disconnect from all streams.

  var self = this;  
  this.attach = function(streamId) {
    if (StreamManager.streams[streamId]) {
      StreamManager.streams[streamId].attachListener(self);
      self.socket.emit('attach-succeeded');
    } else {
      self.socket.emit('attach-failed');
    }
  };
  
  this.detach = function() {
    self.attached = false;
    self.emit('detach', self.id);
  };

  this.initialMedia = function(data) {
    data.forEach(function(media) {
      self.newMedia(media);
    });
  };

  this.newMedia = function(media) {
    self.socket.emit('new-image', media);
  };

  // When socket issues command to disconnect from stream, disconnect it immediately.

  this.socket.on('attach', this.attach);
  this.socket.on('detach', this.detach);
  
  this.socket.on('disconnect', function() {
    console.log('Socket(' + self.id + ') disconnected');
    if (self.attached && !self.timeoutHandle) {
      console.log('Setting detach timeout for ' + self.settings.disconnectTimeoutSeconds + ' seconds');
      self.timeoutHandle = setTimeout(function() {
        self.detach();
      }, self.settings.disconnectTimeoutSeconds * 1000);
    }
  });
  
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