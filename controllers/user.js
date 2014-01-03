/**
 * User controller
 * Governs all user operations.
 */

var User = require('../models/user');

module.exports.index = function(req, res) {
  res.render('user/index', {user: req.user}); 
}

module.exports.settings = function(req, res) {
  res.render('user/settings', {user: req.user});
}

module.exports.changePassword = function(req, res) {
  // TODO: Write this function...
}

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