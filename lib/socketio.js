var socketio = require('socket.io');
var config = require('./config');

var ntwitter = require('ntwitter');
var instagram = require('instagram-node-lib');

var libSession = require('./session');
var libPassport = require('./passport');

var StreamManager = require('./stream-manager');
var StreamListener = require('./stream-listener');
var MediaAggregator = require('./media-aggregator');
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
  
  module.exports.manager.set('log level', 0);
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
  var aggregator = new MediaAggregator();
  

  
  socket.on('attach', function(streamId) {
    console.log('Socket Code: ' + streamId);
    var listener = new StreamListener(socket);
    listener.attach(streamId);
  });
  
  socket.on('start', function(data) {
    // The client passes the keyword to the server 
    var keyword = data.keyword;
    var maxSlides = data.maxSlides || 10;

    // Determine which services to stream
    var streamTwitter = data.streamTwitter;
    var streamInstagram = data.streamInstagram;
        
    //var dummy = new DummyService(socket.handshake.user, {interval: 6000, color: 'ff6666'});
    //var dummy2 = new DummyService(socket.handshake.user, {interval: 6500, color: '99ccff'});
    //aggregator.addService(dummy);
    //aggregator.addService(dummy2);
    
    // Add Twitter service
    if (streamTwitter && socket.handshake.user.twitterToken) {
      var twitterService = new TwitterService(socket.handshake.user, {
        keyword: keyword,
        maxMedia: maxSlides
      });
      aggregator.addService(twitterService);
    }
    
    // Add Instagram service
    if (streamInstagram && socket.handshake.user.instagramAccessToken) {
      var instagramService = new InstagramService(socket.handshake.user, {
        keyword: keyword,
        maxMedia: maxSlides
      });
      aggregator.addService(instagramService);
    }

    // TODO: How do we "unwire" event handlers when a socket connection drops?
    aggregator.on('initial-media', function(data) {
      data.forEach(function(item) {
        socket.emit('new-image', item);
      });
    });
    aggregator.on('new-media', function(data) {
      socket.emit('new-image', data);
    });
    aggregator.start();
  });

  socket.on('disconnect', function() {
    aggregator.stop();
  });
};