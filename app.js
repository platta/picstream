
/**
 * Module dependencies.
 */
var express = require('express');
var http = require('http');
var path = require('path');
var azure = require('azure');
var crypto = require('crypto');
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  TwitterStrategy = require('passport-twitter').Strategy,
  InstagramStrategy = require('passport-instagram').Strategy;


var nconf = require('nconf');
nconf.env().file({file: 'config.json'});

var config = {};
config.title = nconf.get("TITLE");

// Load credentials for connecting to azure storage
config.storage_account = nconf.get("STORAGE_ACCOUNT");
config.storage_key = nconf.get("STORAGE_KEY");
config.partition_key = nconf.get("PARTITION_KEY");
config.root_url = nconf.get("ROOT_URL");
config.twitter = {};
config.instagram = {};

// Create TableService instance
var storageInfo = {
  tableService: azure.createTableService(config.storage_account, config.storage_key),
  partitionKey: config.partition_key
}

// Load entities
var User = new (require('./models/user'))(storageInfo);
var Setting = new(require('./models/setting'))(storageInfo);

// Used this code to create settings in the first place.
/*var newSetting = {
  key: 'InstagramClientSecret',
  value: ''
};

Setting.insertItem(newSetting, function(err) {
  if (err) {
    throw err;
  }
});*/

Setting.getByKey('TwitterConsumerKey', function(err, setting) {
  if (err) {
    throw err;
  } else {
    config.twitter.consumerKey = setting.value;
    
    Setting.getByKey('TwitterConsumerSecret', function(err, setting) {
      if (err) {
        throw err;
      } else {
        config.twitter.consumerSecret = setting.value;
    
        passport.use('twitter-auth', new TwitterStrategy({
          consumerKey: config.twitter.consumerKey,
          consumerSecret: config.twitter.consumerSecret,
          callbackURL: config.root_url + '/connect/twitter/callback',
          passReqToCallback: true
        },
        function(req, token, tokenSecret, profile, done) {
          req.user.twitterToken = token;
          req.user.twitterTokenSecret = tokenSecret;
          User.updateItem(req.user, function(err) {
            if (err) {
              done(err);
            } else {
              done(null, false);
            }
          });
        }));
      }
    });
  }
});


Setting.getByKey('InstagramClientId', function(err, setting) {
  if (err) {
    throw err;
  } else {
    config.instagram.clientId = setting.value;
    
    Setting.getByKey('InstagramClientSecret', function(err, setting) {
      if (err) {
        throw err;
      } else {
        config.instagram.clientSecret = setting.value;
        
        passport.use('instagram-auth', new InstagramStrategy({
          clientID: config.instagram.clientId,
          clientSecret: config.instagram.clientSecret,
          callbackURL: config.root_url + '/connect/instagram/callback',
          passReqToCallback: true
        },
        function(req, accessToken, refreshToken, profile, done) {
          console.log(accessToken);
          req.user.instagramAccessToken = accessToken;
          User.updateItem(req.user, function(err) {
            if (err) {
              done(err);
            } else {
              done(null, false);
            }
          });
        }));
      }
    });
  }
});




// Code to create password hash for a user.
User.findByUsername('keyboardg', function(err, user) {
  if (err) {
    throw err;
  } else {
    user = user[0];
    user.password = 'foobar';
    user.passwordSalt = crypto.randomBytes(128).toString('base64');
    crypto.pbkdf2(user.password, user.passwordSalt, 10000, 512, function(err, derivedKey) {
      if (err) {
        throw err;
      } else {
        user.password = derivedKey.toString('base64');
        
        User.updateItem(user, function(err) {
          if (err) {
            throw err;
          }
        });
      }
    });
  }
});

// Helper function to pass in the request chain to restrict to authenticated users.
function mustBeLoggedIn(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

passport.use(new LocalStrategy(function(username, password, callback) {
  User.findByUsername(username, function(err, user) {
    if (err) {
      return callback(err);
    } else {
      if (user.length > 0) {
        user = user[0];
        crypto.pbkdf2(password, user.passwordSalt, 10000, 512, function(err, derivedKey) {
          if (err) {
            callback(err);
          } else {
            if (user.password === derivedKey.toString('base64')) {
              return callback(null, user);
            } else {
              return callback(null, false, {message: 'Invalid username or password.'});
            }
          }
        });
      } else {
        return callback(null, false, {message: 'Invalid username or password.'});
      }
    }
  });
}));



var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Load Controllers
var controllers = require('./controllers');

/**
 * Load Routes
 */
app.get('/', controllers.home.index);
app.get('/login', controllers.home.login);
app.post('/login', passport.authenticate('local', {
  successRedirect: '/user',
  failureRedirect: '/login'
}));
  
app.get('/logout', function(req, res) {
  req.logout();
  req.user = null;
  res.redirect('/');
});

app.get('/user', mustBeLoggedIn, controllers.user.index);

app.get('/connect/twitter', mustBeLoggedIn, passport.authorize('twitter-auth', {failureRedirect: '/user'}));
app.get('/connect/twitter/callback', mustBeLoggedIn, passport.authorize('twitter-auth', {failureRedirect: '/user'}));

app.post('/connect/twitter/remove', mustBeLoggedIn, function(req, res) {
  if (req.user) {
    req.user.twitterToken = null;
    req.user.twitterTokenSecret = null;
    User.updateItem(req.user, function(err) {
      if (err) {
        throw err;
      }
    });
    res.redirect('/user');
  }
});

app.get('/connect/instagram', mustBeLoggedIn, passport.authorize('instagram-auth', {failureRedirect: '/user'}));
app.get('/connect/instagram/callback', mustBeLoggedIn, passport.authorize('instagram-auth', {failureRedirect: '/user'}));

app.post('/connect/instagram/remove', mustBeLoggedIn, function(req, res) {
  if (req.user) {
    req.user.instagramAccessToken = null;
    User.updateItem(req.user, function(err) {
      if (err) {
        throw err;
      }
    });
    res.redirect('/user');
  }
});

/**
 * Start server
 */
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


// Use a hash to store user details to prevent constant hits to azure storage.
// Not sure how big a problem it would be to let the actual requests go through
// every time, but this works on a small scale.
var userHash = {};
passport.serializeUser(function(user, callback) {
  userHash[user.RowKey] = user;
  callback(null, user.RowKey);
});

passport.deserializeUser(function(id, callback) {
  if (userHash[id]) {
    callback(null, userHash[id]);
  } else {
    done(null, false);
  }
});