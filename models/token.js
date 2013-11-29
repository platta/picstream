var azure = require('azure'),
	uuid = require('node-uuid');

module.exports = Token;	

function Token(storageClient, tableName, partitionKey) {
	this.storageClient = storageClient;
	this.tableName = tableName;
	this.partitionKey = partitionKey;
	
	this.storageClient.createTableIfNotExists(tableName,
		function tableCreated(err) {
			if (err) {
				throw err;
			}
		});
};

Token.prototype = {
	find: function(query, callback) {
		var self = this;
		self.storageClient.queryEntities(query,
			function(err, entities) {
				if (err) {
					callback(err);
				} else {
					callback(null, entities);
				}
			});
	},
	
	addItem: function(item, callback) {
		var self = this;
		item.RowKey = uuid();
		item.PartitionKey = self.partitionKey;
		
		// TODO: Default values for new items?
		
		self.storageClient.insertEntity(self.tableName, item,
			function (err) {
				if (err) {
					callback(err);
				} else {
					callback(null);
				}
			});
	},
		
	deleteItem: function(item, callback) {
		var self = this;
		self.storageClient.queryEntity(self.tableName, self.partitionKey, item,
			function(err, entity) {
				if (err) {
					callback(err);
				} else {
					self.storageClient.deleteEntity(self.tableName, entity,
						function(err) {
							if (err) {
								callback(err);
							} else {
								callback(null);
							}
						});
				}
			});
	}
}