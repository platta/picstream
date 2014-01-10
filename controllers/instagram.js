/**
 * Instagram controller
 */
var InstagramService = require('../lib/instagram-service');

var instagram = require('instagram-node-lib');
var https = require('https');

module.exports.callback = function(req, res) {
  instagram.subscriptions.handshake(req, res);
};



module.exports.incoming = function(req, res) {
  // There may be multiple notifications in the body.  We don't care if there are multiple
  // notifications for a single subscription, because we only need to execute one query
  // to get all new media for that keyword.
  var subscriptions = {};
  req.body.forEach(function(item) {
    var subscriptionId = item.subscription_id;
    if (!subscriptions[subscriptionId] && InstagramService.subscriptions[subscriptionId]) {
      subscriptions[subscriptionId] = InstagramService.subscriptions[subscriptionId];
    }
  });
  
  // Now that we've identified the affected subscriptions, loop through each one and
  // query Instagram for new media.
  for (var subscriptionId in subscriptions) {
    var subscription = InstagramService.subscriptions[subscriptionId];
    
    if (subscription && !subscription.working) {
      InstagramService.queryMedia(subscription);
    }
  }
  
  res.send("");
};