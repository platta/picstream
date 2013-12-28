/**
 * Instagram library
 * Handles integration with the Instagram API and their authentication strategy.
 */

var instagram = require('instagram-node-lib');

module.exports.subscriptions = {};

module.exports.createItem = function(data) {
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
}

module.exports.queryMedia = function(subscription, callback) {
  subscription.working = true;
  
  instagram.tags.recent({
    min_tag_id: subscription.min_tag_id,
    count: subscription.maxSlides,
    name: subscription.keyword,
    access_token: subscription.socket.handshake.user.instagramAccessToken,
    complete: function(data, pagination) {

      // Take note of the next min_tag_id
      if (pagination.min_tag_id) {
        subscription.min_tag_id = pagination.min_tag_id;
      }

      // TODO: Find a way to make this more elegant.  The callback param is really only
      // necessary because of the initial media push we do at startup.
      if (callback) {
        callback(data);
      } else {
        // Output all new media
        data.reverse().forEach(function(item) {
          if (item.type === 'image') {
            subscription.socket.emit('new-image', module.exports.createItem(item));
          }
        });
      }
  
      subscription.working = false;
    }
  });
};

module.exports.socketHandler = function(data) {
  var subscriptions = {};
  data.forEach(function(item) {
    var id = item.subscription_id;
    if (!subscriptions[id] && module.exports.subscriptions[id]) {
      subscriptions[id] = module.exports.subscriptions[id];
    }
  });
  
  for (var id in subscriptions) {
    var subscription = subscriptions[id];
    
    if (!subscription.working) {
      subscription.working = true;
      
      // When the user leaves the page, we may encounter a bit of a concurrency issue,
      // so we need to double check to make sure all of these still exist.
      var token;
      if (subscription.socket && subscription.socket.handshake && subscription.socket.handshake.user) {
        token = subscription.socket.handshake.user.instagramAccessToken;
      }
      
      if (token) {
        module.exports.queryMedia(subscription);
      } else {
        subscription.working = false;
      }
    }
  }
};