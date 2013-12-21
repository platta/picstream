var express = require('express');
var config = require('./config');

// Function for parsing signed cookies.  Used by both the middleware stack and by
// socket.io connections.
module.exports.parse_cookie = express.cookieParser(config.cookie_secret);

// Memory store where session data is actually kept.  Socket.io needs to access this, so
// we need to store it somewhere that extends beyond the middleware.
var MemoryStore = express.session.MemoryStore;
module.exports.sessionStore = new MemoryStore();