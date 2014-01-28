/**
 * Controller index
 * The main file requires the entire controllers folder.  Node looks for index.js so this
 * is the code that will run when you require('./controllers').  It requires the
 * individual controllers and assigns them to properties on the main controllers object.
 */
module.exports.home = require('./home');
module.exports.user = require('./user');
module.exports.instagram = require('./instagram');
module.exports.stream = require('./stream');