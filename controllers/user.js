module.exports.index = function(req, res) {
  res.render('user/index', {user: req.user}); 
}

module.exports.removeTwitter = function(req, res) {
  if (req.user) {
    req.user.twitterToken = null;
    req.user.twitterTokenSecret = null;
    req.app.locals.entities.User.updateItem(req.user, function(err) {
      if (err) {
        throw err;
      }
    });
    res.redirect('/user');
  }
}

module.exports.removeInstagram = function(req, res) {
  if (req.user) {
    req.user.instagramAccessToken = null;
    req.app.locals.entities.User.updateItem(req.user, function(err) {
      if (err) {
        throw err;
      }
    });
    res.redirect('/user');
  }
}