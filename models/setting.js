var Entity = require('./entity');
var config = require('../lib/config');
var azure = require('azure');

function Setting(storageLink) {
  Entity.call(this, storageLink);
}

Setting.prototype = Object.create(Entity.prototype);

Setting.prototype.tableName = 'settings';

// Retrieve a single setting item based on its key (not RowKey)
Setting.prototype.getByKey = function(key, callback) {
  var self = this;
  self.findByField('key', key, function(err, items) {
    if (err) {
      callback(err);
    } else {
      if (items && items.length > 0) {
        callback(null, items[0]);
      } else {
        callback(null, null);
      }
    }
  });
}

// Retrieve all records
Setting.prototype.getAll = function(callback) {
  var self = this;
  var query = azure.TableQuery
    .select()
    .from(self.tableName);
    
  self.find(query, function (err, items) {
    if (err) {
      callback(err);
    } else {
      callback(null, items);
    }
  });
}

module.exports = new Setting(config.storage_link);