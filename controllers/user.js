/**
 * User controller
 * Governs all user operations.
 */

var User = require('../models/user');
var libPassport = require('../lib/passport');
var crypto = require('crypto');

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
  if (req.user) {
    // First make sure they typed in their current password correctly
    libPassport.verifyPassword(req.body.current_password.toString(), req.user.passwordSalt, req.user.password, function(err, result) {
      if (!err) {
        if (result) {
          // Current password is correct.  Now let's make sure that the two new passwords
          // match.
          if (req.body.new_password && req.body.new_password === req.body.new_password_repeat) {
            // Assign new salt
            req.user.passwordSalt = crypto.randomBytes(128).toString('base64');
            
            // Create new hash
            libPassport.hashPassword(req.body.new_password, req.user.passwordSalt, function(err, hash) {
              if (err) {
                // TODO: handle this better
                throw err;
              } else {
                req.user.password = hash;
                
                User.updateItem(req.user, function(err) {
                  if (err) {
                    throw err;
                  }
                });
              }
            });
          } else {
            // TODO: Build a way to send feedback to the user.
          }
        } else {
        }
      }
    });
  }
  
  res.redirect('/user/settings');
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