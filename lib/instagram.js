/**
 * Instagram library
 * Handles integration with the Instagram API and their authentication strategy.
 */
 
var passport = require('passport'),
  InstagramStrategy = require('passport-instagram').Strategy;
var instagramNodeLib = require('instagram-node-lib');

module.exports.subscriptions = {};

module.exports.apiObject = function(clientId, clientSecret) {
  instagramNodeLib.set('client_id', clientId);
  instagramNodeLib.set('client_secret', clientSecret);
  
  return instagramNodeLib;
}
