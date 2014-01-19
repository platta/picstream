module.exports = StreamListener;

var events = require('events');
var StreamManager = require('./stream-manager.js');

function StreamListener(socket) {
  this.socket = socket;
  
  this.active = false;
  this.timeoutHandle = null;
  
  // When socket drops connection, start a timeout timer.  If not reconnected when the timer
  // is up, disconnect from all streams.
  
  // When socket issues command to disconnect from stream, disconnect it immediately.
  var self = this;
  this.socket.on('attach', self.attach);
  
  // Initialize as event emitter
  events.EventEmitter.call(this);
}

StreamListener.prototype.__proto__ = events.EventEmitter.prototype;

StreamListener.prototype.detach = function() {
  var self = this;
  self.emit('detach', self);
}

StreamListener.prototype.newMedia = function(media) {
  this.socket.emit('new-image', media);
};

StreamListener.prototype.attach = function(streamId) {
  var self = this;
  if (StreamManager.streams[streamId]) {
    StreamManager.streams[streamId].attachListener(self);
    self.socket.emit('attach-succeeded');
  } else {
    self.socket.emit('attach-failed');
  }
};