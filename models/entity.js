var azure = require('azure'),
  uuid = require('node-uuid');
  
module.exports = Entity

function Entity(storageInfo) {
  this.tableService = storageInfo.tableService;
  this.partitionKey = storageInfo.partitionKey;

  if (this.tableName) {
    this.tableService.createTableIfNotExists(this.tableName,
      function (err) {
        if (err) {
          throw err;
        }
      });
  }
}

Entity.prototype = {
  tableName: null,
  
  // Search by query, return multiple.
  find: function(query, callback) {
    var self = this;
    self.tableService.queryEntities(query, 
      function (err, entities){
        if(err) {
          callback(err);
        } else {
          callback(null, entities);
        }
      });
  },

  // Shortcut to build a query based on one field and return multiple
  findByField: function(field, value, callback) {
    var self = this;
    var query = azure.TableQuery
      .select()
      .from(self.tableName)
      .where(field + ' eq ?', value);
    self.find(query, function (err, items) {
      if (err) {
        callback(err);
      } else {
        callback(null, items);
      }
    });
  },

  // Retrieve one entity based on row key
  get: function(rowKey, callback) {
    var self = this;
    
    self.tableService.queryEntity(self.tableName, self.partitionKey, rowKey,
      function (err, entity) {
        if (err) {
          callback(err);
        } else {
          callback(null, entity);
        }
      });
  },

  insertItem: function(item, callback) {
    var self = this;
    item.RowKey = uuid();
    item.PartitionKey = self.partitionKey;
    self.tableService.insertEntity(self.tableName, item, 
      function (err) {
        if(err){  
          callback(err);
        } else {
          callback(null);
        }
      });
  },

  updateItem: function(item, callback) {
    var self = this;
    self.tableService.updateEntity(self.tableName, item, function(err) {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    });
  },
  
  deleteItem: function(item, callback) {
    var self = this;
    self.tableService.deleteEntity(self.tableName, item, function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    });
  }
}