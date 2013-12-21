/**
 * Load Configuration Values
 * If on Azure we will take from environment variables which are populated based on the
 * App Settings.  If running locally, we will provide the configuration values in a
 * config.json file.
 */
var config = require('./lib/config');

config.loadFromSettingsTable(function(err) {
  if (err) {
    throw err;
  } else {
    console.log('settings loaded');
    
    // Resume initializing application
    continueInit();
  }
});


function continueInit() {
  /**
   * Module Dependencies
   */
  var express = require('express');
  var http = require('http');
  var path = require('path');
  var passport = require('passport');

  // Helper libraries
  var libPassport = require('./lib/passport');
  var libSocketIo = require('./lib/socketio');
  var libSession = require('./lib/session');


  /**
   * Create and configure Express app object
   */
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
  app.use(libSession.parse_cookie);

  // TODO: Default session provider gives a memory leak warning - look into using something
  // else for Azure/Production
  app.use(express.session({
    store: libSession.sessionStore,
    secret: config.cookie_secret,
    key: config.session_key
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));

  // TODO: Check where this belongs in the middleware stack.  Read something about passport
  // deserializing user for every request because of bad order.
  app.use(express.static(path.join(__dirname, 'public')));

  // development only
  if ('development' == app.get('env')) {
    app.use(express.errorHandler());
  }

  // Attach the config object to app.locals so that Jade templates can read it.
  app.locals.config = config;


  /**
   * Configure Passport - this is for site login as well as OAuth calls to social media
   * sites.
   */

  // Passport strategies
  passport.use(libPassport.localStrategy);
  passport.use('twitter-auth', libPassport.twitterStrategy);
  passport.use('instagram-auth', libPassport.instagramStrategy);

  // Passport functions to serialize and deserialize users for sessions.
  passport.serializeUser(libPassport.serializeUser);
  passport.deserializeUser(libPassport.deserializeUser);


  /**
   * Load Routes
   */
  require('./routes')(app);


  /**
   * Start server
   */
 
  // Instantiate server
  var server = http.createServer(app);

  // Attach socket.io
  libSocketIo.listen(server);

  // Start server
  server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
}