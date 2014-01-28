var nconf = require('nconf');
var azure = require('azure');
var express = require('express');
var instagramNodeLib = require('instagram-node-lib');

// Use environment variables if they exist (Azure/production) or fall back on a file
// named config.json (local/staging)
nconf.env().file({file: 'config.json'});


// Site title
module.exports.title = nconf.get("TITLE");

// Root URL (when running locally this is localhost
module.exports.root_url = nconf.get("ROOT_URL");

// URL to use for Instagram Callbacks.  Instagram's real time API issues HTTP POST
// requests to your endpoint, so when running locally we have to use ngrok to expose
// localhost to the internet.  ngrok gives us a public URL to use here.
module.exports.instagram_callback = nconf.get("INSTAGRAM_CALLBACK");

// Secret for signing session cookies
module.exports.cookie_secret = nconf.get("COOKIE_SECRET");

// Name of the cookie item used to store the session key
module.exports.session_key = nconf.get("SESSION_KEY") || 'connect.sid';

// Credentials for connecting to azure storage
module.exports.storage_account = nconf.get("STORAGE_ACCOUNT");
module.exports.storage_key = nconf.get("STORAGE_KEY");
module.exports.partition_key = nconf.get("PARTITION_KEY");

// Azure storage Table Service and partition key
module.exports.storage_link = {
  tableService: azure.createTableService(module.exports.storage_account, module.exports.storage_key),
  partitionKey: module.exports.partition_key
}

// Now that we have the storage_link defined, we can actually get data from Azure.  This
// just defines the function that will do it, though.  We need to call this function from
// app.js, and partition the initialization of our application.  The second half of the
// initialization code will have to go into a function that we will call in the callback
// function we pass to this function.  It's a little weird, but it's the only way to
// introduce some synchronous control into node's asynchronous model.
var Setting = require('../models/setting');
module.exports.loadFromSettingsTable = function(callback) {
  Setting.getAll(function(err, items) {
    if (err) {
      callback(err);
    } else {
      items.forEach(function(item) {
        item.key = item.key[0].toLowerCase() + item.key.substring(1);
        module.exports[item.key] = item.value;
      });
      
      // The settings for instagram's API get set once, so set them here and forget about
      // it.
      instagramNodeLib.set('client_id', module.exports.instagramClientId);
      instagramNodeLib.set('client_secret', module.exports.instagramClientSecret);
      
      callback(null);
    }
  });
}