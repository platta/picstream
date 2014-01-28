/**
 * User controller
 * Governs all user operations.
 */

var User = require('../models/user');

// User index page, this is where you go once you're logged in.
module.exports.index = function(req, res) {
  res.render('user/index', {user: req.user}); 
}

// User settings page.
module.exports.settings = function(req, res) {
  res.render('user/settings', {user: req.user});
}

// Change password code.
module.exports.changePassword = function(req, res) {
  // TODO: Write this function...
}

// Remove the link to a Twitter account
module.exports.removeTwitter = function(req, res) {
  if (req.user) {
    req.user.twitterToken = null;
    req.user.twitterTokenSecret = null;
    User.updateItem(req.user, function(err) {
      if (err) {
        throw err;
      }
    });
    res.redirect('/user/settings');
  }
}

// Remove the link to an Instagram account
module.exports.removeInstagram = function(req, res) {
  if (req.user) {
    req.user.instagramAccessToken = null;
    User.updateItem(req.user, function(err) {
      if (err) {
        throw err;
      }
    });
    res.redirect('/user/settings');
  }
}