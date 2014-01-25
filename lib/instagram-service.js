module.exports = InstagramService;

/**
 * Module dependencies
 */
var MediaService = require('./media-service');
var instagram = require('instagram-node-lib');
var config = require('./config');
var utils = require('express/node_modules/connect/lib/utils');


function InstagramService(user, settings) {
  // Instagram specific variables
  this.subscriptions = {};
  
  // Merge settings and initialize up the chain
  settings = utils.merge(InstagramService.defaultSettings, settings);
  MediaService.call(this, user, settings);
  
  // Wire event handlers  
  this.on('_start', InstagramService.startHandler);
  this.on('_did-start', MediaService.defaultDidStartHandler);
  this.on('_get-initial', InstagramService.getInitialHandler);
  this.on('_stream', InstagramService.streamHandler);
  this.on('_stop', InstagramService.stopHandler);
}
InstagramService.prototype = Object.create(MediaService.prototype);


InstagramService.defaultSettings = {};


InstagramService.prototype.addMedia = function(data) {
  var self = this;
  self.emit('new-media', self.createMediaObject(data));
};


InstagramService.prototype.createMediaObject = function(data) {
  var caption;
  if (data.caption) {
    caption = data.caption.text;
  } else {
    caption = "";
  }
  
  return {
    service: 'instagram',
    url: data.images.standard_resolution.url,
    created: new Date(data.created_time * 1000),
    text: caption,
    user: {
      username: data.user.username,
      name: data.user.full_name,
      image: data.user.profile_picture
    }
  }
};



// Class level functions and data
InstagramService.subscriptions = {};


InstagramService.queryMedia = function(subscription) {
  subscription.working = true;
  
  // TODO: Worry about rate limiting.
  instagram.tags.recent({
    min_tag_id: subscription.min_tag_id,
    count: subscription.service.settings.maxMedia,
    name: subscription.keyword,
    access_token: subscription.user.instagramAccessToken,
    complete: function(data, pagination) {
      subscription.working = false;
      
      // Take note of the next min_tag_id
      if (pagination.min_tag_id) {
        subscription.min_tag_id = pagination.min_tag_id;
      }

      // Output all new media
      data.reverse().forEach(function(item) {
        if (item.type === 'image') {
          subscription.service.addMedia(item);
        }
      });
    }
  });
};


InstagramService.startHandler = function() {
  var self = this;
  self.subscriptions = {};
  
  instagram.tags.subscribe({object_id: self.settings.keyword,
    callback_url: config.instagram_callback + '/subscriptions/instagram',
    access_token: self.user.instagramAccessToken,
    complete: function(data) {
      var subscriptionId = data.id;
  
      var subscription = {
        service: self,
        user: self.user,
        min_tag_id: 0, 
        working: false,
        keyword: self.settings.keyword,
      };

      self.subscriptions[subscriptionId] = subscription;
      self.emit('_did-start');
    }
  });
}


InstagramService.getInitialHandler = function() {
  var self = this;
  
  // Initialize a hash to help us track which subscriptions have finished getting their
  // initial media.
  var subscriptionsDone = {};
  for (var subscriptionId in self.subscriptions) {
    subscriptionsDone[subscriptionId] = false;
  }
  
  // Sub-function here just to help us synchronize all subscriptions' initial media.  We
  // can't emit the _did-get-initial signal until they have all come back with data.
  function subscriptionFinished(subscriptionId) {
    subscriptionsDone[subscriptionId] = true;
    
    var complete = true;
    for(var subscriptionId in subscriptionsDone) {
      if (!subscriptionsDone[subscriptionId]) {
        complete = false;
        break;
      }
    }
    
    if (complete) {
      self.emit('_did-get-initial', self);
    }
  }
  // End Sub-function
  
  for (var subscriptionId in self.subscriptions) {
    var subscription = self.subscriptions[subscriptionId];
    
    subscription.working = true;
    
    instagram.tags.recent({
      count: subscription.service.settings.maxMedia,
      name: subscription.keyword,
      access_token: self.user.instagramAccessToken,
      complete: function(data, pagination) {

        // Take note of the next min_tag_id
        if (pagination.min_tag_id) {
          subscription.min_tag_id = pagination.min_tag_id;
        }
        
        var initial = new Array();
        data.forEach(function(item) {
          if (item.type === 'image') {
            initial.push(self.createMediaObject(item));
          }
        });
        self.emit('initial-media', initial);

        subscription.working = false;
        subscriptionFinished(subscriptionId);
      }
    });
  }
};


InstagramService.streamHandler = function() {
  var self = this;
  
  for (var subscriptionId in self.subscriptions) {
    InstagramService.subscriptions[subscriptionId] = self.subscriptions[subscriptionId];
  }  
};


InstagramService.stopHandler = function() {
  var self = this;
  
  for (var subscriptionId in self.subscriptions) {
    InstagramService.subscriptions[subscriptionId] = null;
      
    instagram.tags.unsubscribe({
      id: subscriptionId,
      complete: function() {}
    });
  }
};