module.exports = MediaAggregator;

var events = require('events');
var utils = require('express/node_modules/connect/lib/utils');

function MediaAggregator(settings) {
  this.active = false;
  this.initialMedia = new Array();
  this.services = new Array();
  this.servicesInitialized = {};
  this.settings = utils.merge(MediaAggregator.defaultSettings, settings);
  
  events.EventEmitter.call(this);
}

MediaAggregator.prototype.__proto__ = events.EventEmitter.prototype;

MediaAggregator.defaultSettings = {
  maxMedia: 10
};

MediaAggregator.prototype.start = function() {
  if (!this.active) {
    this.active = true;
    
    this.initialMedia = new Array();
    this.servicesInitialized = {};
    
    var self = this;
    this.services.forEach(function(item) {
      self.servicesInitialized[item.uuid] = false;
      item.start();
    });
  }
};

MediaAggregator.prototype.stop = function() {
  if (this.active) {
    this.services.forEach(function(item) {
      item.stop();
    });
    this.active = false;
  }
};

MediaAggregator.prototype.addMedia = function(media) {
  this.emit('new-media', media);
};

MediaAggregator.prototype.addInitialMedia = function(data) {
  var self = this;
  
  // We will sort these later.
  data.forEach(function(item) {
    self.initialMedia.push(item);
  });
};

MediaAggregator.prototype.serviceInitialized = function(service) {
  var self = this;
  
  self.servicesInitialized[service.uuid] = true;

  // Determine if all services have completed getting initial media
  var ready = true;
  for(var s in self.servicesInitialized) {
    if (!self.servicesInitialized[s]) {
      ready = false;
      break;
    }
  }
  
  // If all initial media has been gathered then send it out.
  if (ready) {
    // Sort by date ascending and slice to max size
    var outputArray = self.initialMedia.sort(function(a, b) {
      if (a.created > b.created) return 1;
      if (a.created < b.created) return -1;
      return 0;
    }).slice(-self.settings.maxMedia);
    
    self.emit('initial-media', outputArray);
    
    // Tell all services they can start streaming now.
    self.services.forEach(function(item) {
      item.stream();
    });
  }
}

MediaAggregator.prototype.addService = function(service) {
  if (!this.active) {
    this.services.push(service);
  
    var self = this;
  
    service.on('new-media', function(media) {
      self.addMedia(media);
    });
  
    service.on('initial-media', function(data) {
      self.addInitialMedia(data);
    });
  
    service.on('_did-get-initial', function(service) {
      self.serviceInitialized(service);
    });
  }
};