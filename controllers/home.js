/**
 * Home controller
 * Landing page, login page, and miscellaneous pages.
 */
 
// Home page
module.exports.index = function(req, res) {
	res.render('home/index', {user: req.user});
}

// Login page
module.exports.login = function(req, res) {
  res.render('home/login', {user: req.user, hideHeaderLogin: true});
}

// Logout handler
module.exports.logout = function(req, res) {
  req.logout();
  req.user = null;
  res.redirect('/');
};