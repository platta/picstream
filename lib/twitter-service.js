module.exports = TwitterService;

/**
 * Module Dependencies
 */
var MediaService = require('./media-service');
var ntwitter = require('ntwitter');
var config = require('./config');
var utils = require('express/node_modules/connect/lib/utils');


function TwitterService(user, settings) { 
  // Twitter specific variables 
  this.twitter = new ntwitter ({
    consumer_key: config.twitterConsumerKey,
    consumer_secret: config.twitterConsumerSecret,
    access_token_key: user.twitterToken,
    access_token_secret: user.twitterTokenSecret
  });
  this.twitterStream = null;
  
  // Merge settings and initialize up the chain
  settings = utils.merge(TwitterService.defaultSettings, settings);    
  MediaService.call(this, user, settings);
  
  // Wire up event handlers
  this.on('_start', MediaService.defaultStartHandler);
  this.on('_did-start', MediaService.defaultDidStartHandler);
  this.on('_get-initial', TwitterService.getInitialHandler);
  this.on('_stream', TwitterService.streamHandler);
  this.on('_stop', TwitterService.stopHandler);
}
TwitterService.prototype = Object.create(MediaService.prototype);


TwitterService.defaultSettings = {};


TwitterService.prototype.createMediaObject = function(data, media) {
  return {
    service: 'twitter',
    url: media.media_url,
    created: new Date(data.created_at),
    text: data.text,
    user: {
      username: data.user.screen_name,
      name: data.user.name,
      image: data.user.profile_image_url
    }
  };
};



// Event handlers
TwitterService.getInitialHandler = function() {
  var self = this;
  
  self.twitter.get('/search/tweets.json', {q: '#' + self.settings.keyword, count: self.settings.maxMedia}, function(err, data) {
    var initial = new Array();
    if (!err) {
      data.statuses.forEach(function(status) {
        if (status.entities.media) {
          status.entities.media.forEach(function(media) {
            initial.push(self.createMediaObject(status, media));
          });
        }
      });
    }
    
    self.emit('initial-media', initial);
    self.emit('_did-get-initial', self);
  });
};


TwitterService.streamHandler = function() {
  var self = this;
  self.twitter.stream('statuses/filter', {track: '#' + self.settings.keyword}, function(stream) {
    self.twitterStream = stream;
    stream.on('data', function(data) {
      if (data && data.entities && data.entities.media) {
        data.entities.media.forEach(function(item) {
          self.emit('new-media', self.createMediaObject(data, item));
        });
      }
    });
  });
};


TwitterService.stopHandler = function() {
  var self = this;
  if (this.twitterStream) {
    this.twitterStream.destroy();
  }
  
  self.emit('_stopped', self);
};