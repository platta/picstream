/**
 * Passport related functions
 */
var crypto = require('crypto');
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  TwitterStrategy = require('passport-twitter').Strategy,
  InstagramStrategy = require('passport-instagram').Strategy;
var User = require('../models/user');
var config = require('../lib/config');


// Local Strategy for user login.
module.exports.localStrategy = new LocalStrategy(function(username, password, callback) {
  User.findByUsername(username, function(err, user) {
    if (err) {
      return callback(err);
    } else {
      if (user.length > 0) {
        user = user[0];
        crypto.pbkdf2(password, user.passwordSalt, 10000, 512, function(err, derivedKey) {
          if (err) {
            callback(err);
          } else {
            if (user.password === derivedKey.toString('base64')) {
              return callback(null, user);
            } else {
              return callback(null, false, {message: 'Invalid username or password.'});
            }
          }
        });
      } else {
        return callback(null, false, {message: 'Invalid username or password.'});
      }
    }
  });
});


// Twitter authentication strategy needed to perform OAuth authentication with Twitter.
module.exports.twitterStrategy =  new TwitterStrategy({
  consumerKey: config.twitterConsumerKey,
  consumerSecret: config.twitterConsumerSecret,
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


// Instagram authentication strategy needed to perform OAuth authentication with Instagram.
module.exports.instagramStrategy = new InstagramStrategy({
  clientID: config.instagramClientId,
  clientSecret: config.instagramClientSecret,
  callbackURL: config.root_url + '/connect/instagram/callback',
  passReqToCallback: true
}, function(req, accessToken, refreshToken, profile, done) {
  req.user.instagramAccessToken = accessToken;
  User.updateItem(req.user, function(err) {
    if (err) {
      done(err);
    } else {
      done(null, false);
    }
  });
});


// Helper function to pass in the request chain to restrict to authenticated users.
module.exports.mustBeLoggedIn = function (req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Use a hash to store user details to prevent constant hits to azure storage.
// Not sure how big a problem it would be to let the actual requests go through
// every time, but this works on a small scale.
// TODO: Look into making this actually go look up the user info.  First have to make sure it doesn't get called too often.
var userHash = {};

module.exports.serializeUser = function(user, callback) {
  userHash[user.RowKey] = user;
  callback(null, user.RowKey);
};

// TODO: Store this function so that I can call it myself when authorizing socket.io connections.
module.exports.deserializeUser = function(id, callback) {
  if (userHash[id]) {
    callback(null, userHash[id]);
  } else {
    done(null, false);
  }
};