/**
 * Base class for interacting with Azure Table Services
 */
 
var azure = require('azure'),
  uuid = require('node-uuid');

// Entity is a class designed to be subclassed for specific tables. 
module.exports = Entity

function Entity(storageInfo) {
  // The TableService object is created using the azure storage account name and key
  this.tableService = storageInfo.tableService;
  this.partitionKey = storageInfo.partitionKey;

  if (this.tableName) {
    // Ensure the table exists.
    this.tableService.createTableIfNotExists(this.tableName,
      function (err) {
        if (err) {
          throw err;
        }
      });
  }
}

Entity.prototype = {
  // Subclasses must set this value
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

  // Insert new item
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

  // Update existing item
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
  
  // Delete existing item
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