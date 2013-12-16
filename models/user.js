var Entity = require('./entity');

module.exports = User;

function User(storageInfo) {
  Entity.call(this, storageInfo);
}

User.prototype = Object.create(Entity.prototype);

User.prototype.tableName = 'users';

// Look up multiple users based on username
// TODO: This should probably be a get function and just return 1 result.
User.prototype.findByUsername = function(username, callback) {
  var self = this;
  self.findByField('username', username, callback);
}