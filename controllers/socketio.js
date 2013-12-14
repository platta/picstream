module.exports.index = function(req, res) {
  res.render('socketio/index', {user: req.user});
}