/**
 * Instagram library
 * Handles integration with the Instagram API and their authentication strategy.
 */
 
var passport = require('passport'),
  InstagramStrategy = require('passport-instagram').Strategy;

module.exports.apiObject = function() {
}

// Retrieves the Client ID and Client Secret from the settings table.
module.exports.getKeys = function(Setting, callback) {
  Setting.getByKey('InstagramClientId', function(err, setting) {
    if (err) {
      callback(err);
    } else {
      var clientId = setting.value;
    
      Setting.getByKey('InstagramClientSecret', function(err, setting) {
        if (err) {
          callback(err);
        } else {
          var clientSecret = setting.value;
          callback(null, {clientId: clientId, clientSecret: clientSecret});
        }
      });
    }
  });
};

// Builds the Instagram authentication strategy needed to perform OAuth authentication
// with Instagram.
module.exports.PassportStrategy = function(User, config) {
  return new InstagramStrategy({
    clientID: config.instagram.clientId,
    clientSecret: config.instagram.clientSecret,
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
};