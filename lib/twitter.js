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

