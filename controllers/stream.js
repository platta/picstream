/**
 * Stream Controller
 */

var StreamManager = require('../lib/stream-manager');

// Creates a stream and redirects to the url to attach to it.
module.exports.create = function(req, res) {

  // Create the settings object that will tell the StreamManager how to operate.
  var settings = {
    keyword: req.body.keyword,
    streamTwitter: req.body.streamTwitter === 'on',
    streamInstagram: req.body.streamInstagram === 'on'
  };  

  if (settings.keyword && (settings.streamTwitter || settings.streamInstagram)) {  
    // Instantiate the StreamManager and start it.
    var manager = new StreamManager(req.user, settings);
    manager.start();
  
    // Redirect the user to the appropriate attach url for the new Stream
    var destination = req.body.destination;
    if (destination === 'debug') {
      res.redirect('/stream/debug/' + manager.uuid);
    } else {
      res.redirect('/stream/attach/' + manager.uuid);
    }
  } else {
    res.redirect('/user');
  }
};


// Attach to a stream that already exists.
module.exports.attach = function(req, res) {
  var streamId = req.params.streamId;
  
  // Check to see if the stream exists
  if (StreamManager.streams[streamId]) {
    // Stream exists.  Pass off to rendering.  The browser side code will handle the rest.
    res.render('stream/index', {user: req.user, streamId: streamId});
  } else {
    res.render('stream/error', {user: req.user, streamId: streamId});
  }
};


// Render the debug page for a stream
module.exports.debug = function(req, res) {
  var streamId = req.params.streamId;
  
  // Check to see if the stream exists
  if (StreamManager.streams[streamId]) {
    // Stream exists.  Pass off to rendering.  The browser side code will handle the rest.
    res.render('stream/debug', {user: req.user, streamId: streamId});
  } else {
    res.render('stream/error', {user: req.user, streamId: streamId});
  }
}