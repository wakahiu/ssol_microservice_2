module.exports = function(app){
	var router = require('./controllers/router');
	app.get('/students/:id', router.getStudent);
}