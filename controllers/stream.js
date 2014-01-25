var StreamManager = require('../lib/stream-manager');

module.exports.create = function(req, res) {
  // Instantiate manager and start.
  var settings = {
    keyword: req.body.keyword,
    streamTwitter: req.body.streamTwitter === 'on',
    streamInstagram: req.body.streamInstagram === 'on'
  };  
  
  console.log('Stream controller instantiating StreamManager');
  var manager = new StreamManager(req.user, settings);
  manager.start();
  
  console.log('Stream controller redirecting to attach handler');
  res.redirect('/stream/attach/' + manager.uuid);
  
  return;
  if (destination === 'debug') {
    res.render('stream/debug', {user: req.user, streamId: manager.uuid});
  } else {
    res.render('stream/index', {user: req.user});
  }
};

module.exports.attach = function(req, res) {
  console.log('Attach handler attaching to: ' + req.params.streamId);
  
  res.render('stream/index', {user: req.user, streamId: req.params.streamId});
};