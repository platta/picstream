var passport = require('passport'),
  TwitterStrategy = require('passport-twitter').Strategy;

// Load Twitter consumer key and secret and set up the Passport Twitter strategy
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