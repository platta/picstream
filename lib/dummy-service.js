module.exports = DummyService;

/**
 * Module Dependencies
 */
var MediaService = require('./media-service');
var utils = require('express/node_modules/connect/lib/utils');


function DummyService(user, settings) {
  // Dummy specific variables
  this.intervalHandle = null;
  
  // Merge settings, then initialize up the chain
  settings = utils.merge(DummyService.defaultSettings, settings);
  MediaService.call(this, user, settings);
  
  // Wire event handlers
  this.on('_start', MediaService.defaultStartHandler);
  this.on('_did-start', MediaService.defaultDidStartHandler);
  this.on('_get-initial', DummyService.getInitialHandler);
  this.on('_stream', DummyService.streamHandler);
  this.on('_stop', DummyService.stopHandler);
}
DummyService.prototype = Object.create(MediaService.prototype);


DummyService.defaultSettings = {
  interval : 5000,
  color : 'ccc'
};


DummyService.prototype.createMediaObject = function(text) {
  var date = new Date();
  text = text || date.getTime().toString();
  return {
    service: 'dummy',
    url: 'http://placehold.it/640x640/' + this.settings.color + '&text=' + text,
    created: date,
    text: date.toString(),
    user: {
      username: 'dummy',
      name: 'Dummy',
      image: 'http://placehold.it/64x64&text=D'
    }
  };
}



// Event handlers
DummyService.getInitialHandler = function() {
  var self = this;
  var initialArray = new Array();
  for(var i = 0; i < 3; i++) {
    initialArray.push(self.createMediaObject('Initial ' + i));
  }
  
  setTimeout(function() {
    self.emit('initial-media', initialArray);

    self.emit('_did-get-initial', self);
  }, self.settings.interval);
};


DummyService.streamHandler = function() {
  var self = this;
  self.intervalHandle = setInterval(function() {
    var date = new Date();
    self.emit('new-media', self.createMediaObject());
  }, self.settings.interval);
};


DummyService.stopHandler = function() {
  var self = this;
  if (self.intervalHandle) {
    clearInterval(self.intervalHandle);
    self.intervalHandle = null;
  }
  self.emit('_stopped', self);
};