/**
 * Twitter library
 * Handles integration with the Twitter API and their authentication strategy.
 */

var passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy;
var ntwitter = require('ntwitter');

module.exports.apiObject = function(consumerKey, consumerSecret, accessTokenKey, accessTokenSecret) {
  return new ntwitter ({
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    access_token_key: accessTokenKey,
    access_token_secret: accessTokenSecret
  });
}

// Retrieve the Consumer Key and Consumer Secret from the Settings table.
module.exports.getKeys = function(Setting, callback) {
  Setting.getByKey('TwitterConsumerKey', function(err, setting) {
    if (err) {
      callback(err);
    } else {
      var consumerKey = setting.value;
    
      Setting.getByKey('TwitterConsumerSecret', function(err, setting) {
        if (err) {
          callback(err);
        } else {
          var consumerSecret = setting.value;
          callback(null, {consumerKey: consumerKey, consumerSecret: consumerSecret});
        }
      });
    }
  });
}

// Builds the Twitter authentication strategy needed to perform OAuth authentication with
// Twitter.
module.exports.PassportStrategy = function(User, config) {
  return new TwitterStrategy({
    consumerKey: config.twitter.consumerKey,
    consumerSecret: config.twitter.consumerSecret,
    callbackURL: config.root_url + '/connect/twitter/callback',
    passReqToCallback: true
  }, function(req, token, tokenSecret, profile, done) {
    req.user.twitterToken = token;
    req.user.twitterTokenSecret = tokenSecret;
    User.updateItem(req.user, function(err) {
      if (err) {
        done(err);
      } else {
        done(null, false);
      }
    });
  });
};