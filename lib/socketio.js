var socketio = require('socket.io');
var config = require('./config');

var libSession = require('./session');
var libPassport = require('./passport');
var libInstagram = require('./instagram');
var libTwitter = require('./twitter');


module.exports.listen = function(server) {
  module.exports.manager = socketio.listen(server);
  
  // Set up authorization for all incoming connections.
  module.exports.manager.configure(function() {
    module.exports.manager.set('authorization', module.exports.authorizationFunction);
  });
  
  // Set up actual socket logic.
  module.exports.manager.sockets.on('connection', module.exports.socketHandler);
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
            console.log('foo');
            callback(null, false);
          } else {
            console.log('bar');
            libPassport.deserializeUser(session.passport.user, function(err, user) {
              if (err) {
                console.log('bat');
                callback(err);
              } else {
                if (user) {
                  console.log('baz');
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
  var instagrammer = libInstagram.apiObject(config.instagramClientId,
    config.instagramClientSecret);
  var subscriptionId;
  var tag = 'selfie';
  
  instagrammer.tags.subscribe({object_id: tag,
    callback_url: config.instagram_callback + '/subscriptions/instagram',
    access_token: socket.handshake.user.instagramAccessToken,
    complete: function(data) {
      console.log(data);
      subscriptionId = data.id;
      
      libInstagram.subscriptions[subscriptionId] = {
        socket: socket, 
        min_tag_id: 0, 
        working: false,
        tag: tag
      };
    }
  });
  
  socket.on('disconnect', function() {
    libInstagram.subscriptions[subscriptionId] = null;
    instagrammer.tags.unsubscribe({id: subscriptionId,
      complete: function() {}});
  });
  
  /*
  // Create a variable here to let us reference the stream so we can close it later.
  var stream;
  
  // The authorization code will place the user in socket.handshake.user
  var tweeter = libTwitter.apiObject(config.twitterConsumerKey,
    config.twitterConsumerSecret,
    socket.handshake.user.twitterToken,
    socket.handshake.user.twitterTokenSecret);
  
  tweeter.stream('statuses/sample', function(s) {
    stream = s;
    stream.on('data', function(tweet) {
      console.log(tweet.text);
      socket.emit('list', {text: tweet.text});
    });
  });
  
  socket.on('disconnect', function() {
    if (stream) {
      stream.destroy();
    }
  });
  */
};