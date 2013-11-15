// Azure port handling
var port = process.env.PORT || 8000;

// Set up express erver and socket.io
var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    util = require('util');

// Bring in social media modules
var twitterModule = require('./modules/twitterModule');


// Static web components served from here
app.use(express.static(__dirname + '/public'));

// Enable console logging if desired.
//app.use(express.logger());

server.listen(port);