/**
 * Instagram library
 * Handles integration with the Instagram API and their authentication strategy.
 */

var instagram = require('instagram-node-lib');

module.exports.subscriptions = {};

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
        instagram.tags.recent({
          min_tag_id: subscription.min_tag_id,
          name: subscription.keyword,
          access_token: token,
          complete: function(data, pagination) {

            // Take note of the next min_tag_id
            if (pagination.min_tag_id) {
              subscription.min_tag_id = pagination.min_tag_id;
            }

            // TODO: The order of this list needs to be reversed so that we output the
            // images in chronological order (newest last)
            // Output all new media
            data.forEach(function(item) {
              if (item.type === 'image') {
                subscription.socket.emit('new-image', {
                  service: 'instagram',
                  url: item.images.standard_resolution.url
                });
              }
            });
          
            subscription.working = false;
          }
        });
      } else {
        subscription.working = false;
      }
    }
  }
};