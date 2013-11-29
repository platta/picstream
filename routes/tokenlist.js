var azure = require('azure'),
	async = require('async');
	
module.exports = TokenList;

function TokenList(token) {
	this.token = token;
}

TokenList.prototype = {
	showTokens: function(req, res) {
		var self = this;
		var query = azure.TableQuery
			.select()
			.from(self.token.tableName);
		
		self.token.find(query, function(err, items) {
			res.render('tokenlist', {title: 'Tokens', tokens: items});
		});
	},
	
	addToken: function(req, res) {
		var self = this;
		var item = req.body.item;
		self.token.addItem(item, function(err) {
			if (err) {
				throw err;
			} else {
				res.redirect('/tokenlist');
			}
		});
	},
	
	deleteToken: function(req, res) {
		var self = this;
		console.log("deleteToken called");
		console.log(req.body);
		var id = Object.keys(req.body)[0];

		console.log("deleting item: " + id);
		self.token.deleteItem(id, function(err) {	
			if (err) {
				throw err;
			} else {
				res.redirect('/tokenlist');
			}
		});
	}
};