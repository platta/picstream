// Main export of this module
module.exports = MediaService;

/**
 * Module dependencies
 */
var events = require('events');
var uuid = require('node-uuid');
var utils = require('express/node_modules/connect/lib/utils');

function MediaService(user, settings) {
  this.user = user;
  this.settings = utils.merge(MediaService.defaultSettings, settings);
  this.active = false;
  this.uuid = uuid();
  
  // Initialize as event emitter
  events.EventEmitter.call(this);
}
MediaService.prototype.__proto__ = events.EventEmitter.prototype;


MediaService.defaultSettings = {
  maxMedia: 10
};


MediaService.prototype.start = function() {
  if (!this.active) {
    this.active = true;
    this.emit('_start', this);
  }
};


// TODO: Need a way to handle if stop is called right after start to make sure that no
// orphaned resources or connections remain.
MediaService.prototype.stop = function() {
  if (this.active) {
    this.emit('_stop', this);
    this.active = false;
  }
};


// After calling the start function, the service will retrieve initial media.  From there
// it waits until this method is called.  This is because the MediaAggregator will wait
// for all MediaService instances to return their initial media before telling them all
// to start streaming.
MediaService.prototype.stream = function() {
  if (this.active) {
    this.emit('_stream', this); 
  }
};



// Default handler functions for events.  Each subclass has to wire these up, and will
// need to define its own implementation of some of them.
MediaService.defaultStartHandler = function() {
  this.emit('_did-start', this);
};


MediaService.defaultDidStartHandler = function() {
  this.emit('_get-initial', this);
};


MediaService.defaultGetInitialHandler = function() {
  this.emit('_did-get-initial', this);
};


MediaService.defaultDidGetInitialHandler = function() {
  this.emit('_stream', this);
};


MediaService.defaultStopHandler = function() {
  this.emit('_stopped', this);
}