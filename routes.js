var passport = require('passport');
var controllers = require('./controllers');
var passportLib = require('./lib/passport');

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
  
  app.get('/logout', function(req, res) {
    req.logout();
    req.user = null;
    res.redirect('/');
  });


  /**
   * User Controller
   */
 
  // User page
  app.get('/user', mustBeLoggedIn, controllers.user.index);

  // Twitter auth
  app.get('/connect/twitter', mustBeLoggedIn, passport.authorize('twitter-auth', {failureRedirect: '/user'}));
  app.get('/connect/twitter/callback', mustBeLoggedIn, passport.authorize('twitter-auth', {failureRedirect: '/user'}));
  app.post('/connect/twitter/remove', mustBeLoggedIn, controllers.user.removeTwitter);

  // Instagram auth
  app.get('/connect/instagram', mustBeLoggedIn, passport.authorize('instagram-auth', {failureRedirect: '/user'}));
  app.get('/connect/instagram/callback', mustBeLoggedIn, passport.authorize('instagram-auth', {failureRedirect: '/user'}));
  app.post('/connect/instagram/remove', mustBeLoggedIn, controllers.user.removeInstagram)


  /**
   * Socket.io Controller
   */
 
  app.get('/socketio-test', controllers.socketio.index);
  
  
  /**
   * Instagram
   */
   app.get('/subscriptions/instagram', controllers.instagram.callback);
   app.post('/subscriptions/instagram', controllers.instagram.incoming);
}