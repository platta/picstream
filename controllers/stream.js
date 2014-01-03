
module.exports.index = function(req, res) {
  var destination = req.query.destination;

  if (destination === 'debug') {
    res.render('stream/debug', {user: req.user});
  } else {
    res.render('stream/index', {user: req.user});
  }
}