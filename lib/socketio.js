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
  var keyword, twitterStream, instagramSubscriptionId, maxSlides;
  
  // The client passes the keyword to the server 
  socket.on('start', function(data) {
    keyword = data.keyword;
    maxSlides = data.maxSlides || 10;
    var initialMedia = new Array(), twitterReceived = false, instagramReceived = false;
    
    // Set up twitter streaming
    var twitter = new ntwitter ({
      consumer_key: config.twitterConsumerKey,
      consumer_secret: config.twitterConsumerSecret,
      access_token_key: socket.handshake.user.twitterToken,
      access_token_secret: socket.handshake.user.twitterTokenSecret
    });
    var socketHandler = libTwitter.socketHandler(socket);
    
    // Perform the initial search for twitter data. 
    twitter.get('/search/tweets.json', {q: '#' + keyword, count: maxSlides}, function(err, data) {
      if (!err) {
        data.statuses.forEach(function(status) {
          if (status.entities.media) {
            status.entities.media.forEach(function(media) {
              initialMedia.push(libTwitter.createItem(status, media));
            });
          }
        });
      }
      twitterReceived = true;
      pushInitialMedia(initialMedia, socket, twitterReceived, instagramReceived);
    });
    
    // Engage streaming
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
        
        var subscription = {
          socket: socket, 
          min_tag_id: 0, 
          working: false,
          keyword: keyword,
          maxSlides: maxSlides
        };
      
        libInstagram.subscriptions[instagramSubscriptionId] = subscription;
        
        // Get the first batch of Instagram photos for the keyword.
        libInstagram.queryMedia(subscription, function(data) {
          data.forEach(function(item) {
            if (item.type === 'image') {
              initialMedia.push(libInstagram.createItem(item));
            }
          });
          
          instagramReceived = true;
          pushInitialMedia(initialMedia, socket, twitterReceived, instagramReceived);
        });
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
};

function pushInitialMedia(array, socket, twitter, instagram) {
  if (twitter && instagram) {
    // Sort by date ascending
    // TODO: The -5 here should be controlled by a setting.
    var outputArray = array.sort(function(a, b) {
      if (a.created > b.created) return 1;
      if (a.created < b.created) return -1;
      return 0;
    }).slice(-5);
    
    outputArray.forEach(function(item) {
      socket.emit('new-image', item);
    });
  }
}