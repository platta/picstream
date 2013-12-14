module.exports.index = function(req, res) {
  res.render('user/index', {user: req.user}); 
}

module.exports.forgetTwitter = function(req, res) {
  if (req.user) {
    req.user.twitterToken = null;
    req.user.twitterTokenSecret = null;
    console.log(User);
    res.redirect('/user');
  }
}