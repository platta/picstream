/**
 * Instagram controller
 */

var instagramLib = require('../lib/instagram'); 
var instagramNodeLib = require('instagram-node-lib');
var https = require('https');
module.exports.callback = function(req, res) {
  instagramNodeLib.subscriptions.handshake(req, res);
};

var latest_id = 0;
var ids = {};
module.exports.incoming = function(req, res) {
  var subscriptionId = req.body[0].subscription_id;

  req.body.forEach(function(item) {
    var subscription = instagramLib.subscriptions[item.subscription_id];
    if (subscription && !subscription.working) {
      subscription.working = true;
      
      instagramNodeLib.tags.recent({
        min_tag_id: subscription.min_tag_id,
        name: subscription.tag,
        access_token: subscription.socket.handshake.user.instagramAccessToken,
        complete: function(data, pagination) {

          if (pagination.min_tag_id) {
            subscription.min_tag_id = pagination.min_tag_id;
          }

          data.forEach(function(item) {
            if (item.type === 'image') {
              if (ids[item.id]) {
                console.log('duplicate: ' + item.id);
              } else {
                ids[item.id] = true;
                subscription.socket.emit('list', {text: item.images.thumbnail.url});
              }
            }
          });
          subscription.working = false;
        }
      });
    }
  });
  
  res.send("");
};