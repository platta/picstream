/**
 * Home controller
 * Landing page, login page, and miscellaneous pages.
 */
module.exports.index = function(req, res) {
	res.render('home/index', {user: req.user});
}

module.exports.login = function(req, res) {
  res.render('home/login', {user: req.user, hideHeaderLogin: true});
}