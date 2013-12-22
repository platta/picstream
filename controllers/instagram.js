/**
 * Instagram controller
 */

var libInstagram = require('../lib/instagram'); 
var instagramNodeLib = require('instagram-node-lib');
var https = require('https');
module.exports.callback = function(req, res) {
  instagramNodeLib.subscriptions.handshake(req, res);
};


module.exports.incoming = function(req, res) {
  libInstagram.socketHandler(req.body);
  
  res.send("");
};