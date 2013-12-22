var socketio = require('socket.io');
var config = require('./config');

var ntwitter = require('ntwitter');
var instagram = require('instagram-node-lib');

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
  var keyword, twitterStream, instagramSubscriptionId;
  
  // The client passes the keyword to the server 
  socket.on('start', function(data) {
    // TODO: We have to retrieve an initial set of images for the tag from each service
    // by doing a search, then start streaming.
    
    keyword = data.keyword;
    
    // Set up twitter streaming
    var twitter = new ntwitter ({
      consumer_key: config.twitterConsumerKey,
      consumer_secret: config.twitterConsumerSecret,
      access_token_key: socket.handshake.user.twitterToken,
      access_token_secret: socket.handshake.user.twitterTokenSecret
    });
    var socketHandler = libTwitter.socketHandler(socket);
    twitter.stream('statuses/filter', {track: '#' + keyword}, function(stream) {
      twitterStream = stream;
      stream.on('data', socketHandler);
    });
    
    
    // Set up instagram streaming
    instagram.tags.subscribe({object_id: keyword,
      callback_url: config.instagram_callback + '/subscriptions/instagram',
      access_token: socket.handshake.user.instagramAccessToken,
      complete: function(data) {
        instagramSubscriptionId = data.id;
      
        libInstagram.subscriptions[instagramSubscriptionId] = {
          socket: socket, 
          min_tag_id: 0, 
          working: false,
          keyword: keyword
        };
      }
    });
  });

  socket.on('disconnect', function() {
    // Disconnect Twitter stream.
    if (twitterStream) {
      twitterStream.destroy();
    }
    
    // Disconnect Instagram stream.
    if (instagramSubscriptionId) {
      instagram.tags.unsubscribe({
        id: instagramSubscriptionId,
        complete: function() {}
      });
    }
  });
  
  /*
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
  */
  
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