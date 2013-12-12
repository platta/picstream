module.exports.index = function(req, res) {
	res.render('home/index', {title: 'Picstream', user: req.user});
}

module.exports.login = function(req, res) {
  res.render('home/login', {title: 'Picstream', user: req.user, hideHeaderLogin: true});
}