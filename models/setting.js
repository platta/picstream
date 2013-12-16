var Entity = require('./entity');

module.exports = Setting;

function Setting(storageInfo) {
  Entity.call(this, storageInfo);
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