module.exports = function(app, controllers) {
	app.get('/', controllers.home.index);
}