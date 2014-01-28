/**
 * Socket.io Logic
 */
 
 
/**
 * Module dependencies
 */
// Basics
var socketio = require('socket.io');
var config = require('./config');

// We need some of the functions in these.
var libSession = require('./session');
var libPassport = require('./passport');

// Socket and stream management
var StreamManager = require('./stream-manager');
var StreamListener = require('./stream-listener');

// Media service aggregator
var MediaAggregator = require('./media-aggregator');

// Actual media services
var DummyService = require('./dummy-service');
var TwitterService = require('./twitter-service');
var InstagramService = require('./instagram-service');


module.exports.listen = function(server) {
  module.exports.manager = socketio.listen(server);
  
  // Set up authorization for all incoming connections.
  module.exports.manager.configure(function() {
    module.exports.manager.set('authorization', module.exports.authorizationFunction);
  });
  
  // Set up actual socket logic.
  module.exports.manager.sockets.on('connection', module.exports.socketHandler);
  
  // Uncomment this line to turn off the verbose logging of socket chatter.
  //module.exports.manager.set('log level', 0);
};


// When .listen() is called, this will be populated with the manager object that gets
// created.
module.exports.manager = null;


// Authorization function to verify incoming connections
module.exports.authorizationFunction = function(handshake, callback) {
  libSession.parse_cookie(handshake, null, function(err) {
    if (err) {
      callback(err);
    } else {
      libSession.sessionStore.get(handshake.signedCookies[config.session_key], function(err, session) {
        if (err) {
          callback(err);
        } else {
          if (!session || !session.passport || !session.passport.user) {
            callback(null, false);
          } else {
            libPassport.deserializeUser(session.passport.user, function(err, user) {
              if (err) {
                callback(err);
              } else {
                if (user) {
                  // Tack the full user onto the handshake object so that the socket
                  // code can access it.
                  handshake.user = user;
                  callback(null, true);
                } else {
                  callback(null, false);
                }
              }
            });
          }
        }
      });
    }
  });
};


// Socket handler function.
module.exports.socketHandler = function(socket) {
  socket.on('attach', function(streamId) {
    console.log('Socket Code: ' + streamId);
    
    // Once associated with a StreamListener object, the listener will do the rest of the
    // work and handle any other events like disconnects and detaching.
    var listener = new StreamListener(socket);
    listener.attach(streamId);
  });
};