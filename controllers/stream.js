
module.exports.index = function(req, res) {
  res.render('stream/index', {user: req.user});
}