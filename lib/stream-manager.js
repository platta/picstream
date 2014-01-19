module.exports = StreamManager;

var events = require('events');
var utils = require('express/node_modules/connect/lib/utils');

function StreamManager(mediaService, settings) {
  this.mediaService = mediaService;
  this.listeners = 0;
  
  this.settings = utils.merge(StreamManager.defaultSettings, settings);
  
  // Initialize as event emitter
  events.EventEmitter.call(this);
}
StreamManager.prototype.__proto__ = events.EventEmitter.prototype;

StreamManager.defaultSettings = {
  maxMedia: 10
};

StreamManager.prototype.attachListener = function(listener) {
  var self = this;

  // Send all current media
  self.mediaService.media.forEach(function(item) {
    listener.newMedia(item);
  });

  // Attach media events
  self.mediaService.on('new-media', listener.newMedia);
  
  // Attach detach handler
  listener.on('detach', self.detachListener);
  
  self.listeners++;
};

StreamManager.prototype.detachListener = function(listener) {
  var self = this;
  
  // Detach media events
  self.mediaService.removeListener('new-media', listener.newMedia);
  
  // Detach detach handler (yo dawg)
  listener.removeListener('detach', self.detachListener);
  
  self.listener--;
};


StreamManager.streams = {};