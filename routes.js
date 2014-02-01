var passport = require('passport');
var controllers = require('./controllers');
var passportLib = require('./lib/passport');

// Passing this function in the middleware chain will cause a redirect to the logon page
// if the user is not logged in.
var mustBeLoggedIn = passportLib.mustBeLoggedIn;

module.exports = function(app) {

  /**
   * Home Controller
   */
  // Home page
  app.get('/', controllers.home.index);

  // Login and logout
  app.get('/login', controllers.home.login);
  app.post('/login', passport.authenticate('local', {
    successRedirect: '/user',
    failureRedirect: '/login'
  }));
  app.get('/logout', controllers.home.logout);


  /**
   * User Controller
   */
  // User page
  app.get('/user', mustBeLoggedIn, controllers.user.index);
  app.get('/user/settings', mustBeLoggedIn, controllers.user.settings);


  /**
   * Stream controller
   */
   app.post('/stream/create', mustBeLoggedIn, controllers.stream.create);
   app.get('/stream/attach/:streamId', mustBeLoggedIn, controllers.stream.attach);
   app.get('/stream/debug/:streamId', mustBeLoggedIn, controllers.stream.debug);
  
  
  /**
   * Instagram
   */
   app.get('/subscriptions/instagram', controllers.instagram.callback);
   app.post('/subscriptions/instagram', controllers.instagram.incoming);
   
   
  /**
   * Social media login handlers
   */
  // Twitter auth
  app.get('/connect/twitter', mustBeLoggedIn, passport.authorize('twitter-auth', {failureRedirect: '/user'}));
  app.get('/connect/twitter/callback', mustBeLoggedIn, passport.authorize('twitter-auth', {failureRedirect: '/user'}));
  app.post('/connect/twitter/remove', mustBeLoggedIn, controllers.user.removeTwitter);

  // Instagram auth
  app.get('/connect/instagram', mustBeLoggedIn, passport.authorize('instagram-auth', {failureRedirect: '/user'}));
  app.get('/connect/instagram/callback', mustBeLoggedIn, passport.authorize('instagram-auth', {failureRedirect: '/user'}));
  app.post('/connect/instagram/remove', mustBeLoggedIn, controllers.user.removeInstagram)
}