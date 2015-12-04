var express = require('express');
var myRouter = express.Router();
var router = require('./controllers/router');


myRouter.get('/:uni', router.findStudent);
myRouter.get('/', router.findStudentAll);


myRouter.post('/', router.createStudent);


myRouter.post('/attributes', router.createStudentAll);
myRouter.delete('/attributes', router.deleteAttribute);


myRouter.delete('/:uni', router.deleteStudent);


myRouter.put('/:uni', router.updateStudent);
myRouter.post('/:uni/courses', router.addCourse);
myRouter.delete('/:uni/courses', router.removeCourse);

module.exports = myRouter;