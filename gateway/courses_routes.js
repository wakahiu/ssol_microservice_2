var express = require('express');
var myRouter = express.Router();
var router = require('./controllers/router');

//app.get('/students/:id', router.getStudent);
//console.log('Inside courses routes');
myRouter.get('/', router.findCourse);

myRouter.post('/', router.createCourse);

myRouter.post('/schema', router.createCourse);
myRouter.delete('/schema', router.deleteCourse);

myRouter.put('/:course_num', router.updateCourse);
myRouter.post('/:course_num/:resource', router.createCourse);

myRouter.delete('/', router.deleteCourse);
myRouter.delete('/:course_num/:resource', router.deleteCourse);
myRouter.delete('/:resource', router.deleteCourse);

module.exports = myRouter;
