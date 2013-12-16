/**
 * Socket.io controller
 * This controller is mainly for testing the socket.io library.  It will probably go away
 * eventually.
 */
module.exports.index = function(req, res) {
  res.render('socketio/index', {user: req.user});
}