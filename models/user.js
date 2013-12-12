var Entity = require('./entity');

module.exports = User;

function User(storageInfo) {
  Entity.call(this, storageInfo);
}

User.prototype = Object.create(Entity.prototype);

User.prototype.tableName = 'users';

User.prototype.findByUsername = function(username, callback) {
  var self = this;
  self.findByField('username', username, callback);
}