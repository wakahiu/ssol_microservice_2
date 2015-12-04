var async = require('async');
var request = require('request')
var _ = require('lodash');
//var express = require('express');
var config = require('../config/config');
var host = 'localhost';

find_partition = function(uni, array) {
    var i;
    for (i = 0; i < array.length; i++) {
        //console.log(i);
        if (uni.charAt(0) <= array[i].ending_letter) {
            break;
        }
    };
    return i;
};
Array.prototype.clean = function() {
    for (var i = 0; i < this.length; i++) {
        if (_.isEmpty(this[i])) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};
Array.prototype.make_single = function() {
    var single = [];
    for (var i = 0; i < this.length; i++) {
        single = single.concat(this[i]);
    }
    return single;
};

exports.findStudent = function(req, res) {
    //console.log('Inside deleteStudent');
    var uni = req.params.uni;
    var index = find_partition(uni, config.partitions);
    var fullUrl = req.protocol + '://' + host + ':' + config.partitions[index].port + '/students' + req.url;
    console.log(fullUrl);
    request({
        url: fullUrl
    }, function(err, response, body) {
        if (err) {
            return res.status(500).end('Error');
        }
        obj = JSON.parse(body);
        if (obj.hasOwnProperty('error')) {
            return res.status(obj.error.status).end(obj.message);
        } else {
          res.writeHead(200, {
              "Content-Type": "text/plain"
          });
      }
        res.end(body);
    });
};
exports.findStudentAll = function(req, res) {
    //console.log(config.partitions[1].port);
    async.map(config.partitions, function(item, callback) {

        var fullUrl = req.protocol + '://' + host + ':' + item.port + '/students' + req.url;
        console.log(fullUrl);
        request(fullUrl, function(err, response, body) {
            // JSON body
            if (err) {
                console.log(err);
                callback(err);
                return;
            }
            obj = JSON.parse(body);
            callback(false, obj);
        });
    }, function(err, results) {
        if (err) {
            console.log(err);
            res.send(500, "Server Error");
            return;
        }
        //console.log(results);
        res.send(results.clean().make_single());
    });
};
exports.createStudent = function(req, res) {
    var uni = req.body.uni;
    // console.log(uni);
    var index = find_partition(uni, config.partitions);
    var fullUrl = req.protocol + '://' + host + ':' + config.partitions[index].port + '/students' + req.url;
    console.log(fullUrl);
    request.post({
        url: fullUrl,
        form: req.body
    }, function(err, response, body) {
        //console.log(response);
        if (err) {
            return res.status(500).end('Error');
        }
        obj = JSON.parse(body);
        if (obj.hasOwnProperty('error')) {
            return res.status(obj.error.status).end(obj.message);
        } else {
          res.writeHead(200, {
              "Content-Type": "text/plain"
          });
      }
        res.end(body);
    });
};
exports.addCourse = function(req, res) {
    var uni = req.params.uni;
    // console.log(uni);
    var index = find_partition(uni, config.partitions);
    var fullUrl = req.protocol + '://' + host + ':' + config.partitions[index].port + '/students' + req.url;
    console.log(fullUrl);
    request.post({
        url: fullUrl,
        form: req.body
    }, function(err, response, body) {
        //console.log(response);
        if (err) {
            return res.status(500).end('Error');
        }
        obj = JSON.parse(body);
        if (obj.hasOwnProperty('error')) {
            return res.status(obj.error.status).end(obj.message);
        } else {
          res.writeHead(200, {
              "Content-Type": "text/plain"
          });
      }
        res.end(body);
    });
};
exports.removeCourse = function(req, res) {
    var uni = req.params.uni;
    // console.log(uni);
    var index = find_partition(uni, config.partitions);
    var fullUrl = req.protocol + '://' + host + ':' + config.partitions[index].port + '/students' + req.url;
    console.log(fullUrl);
    request.del({
        url: fullUrl,
        form: req.body
    }, function(err, response, body) {
        //console.log(response);
        if (err) {
            return res.status(500).end('Error');
        }
        obj = JSON.parse(body);
        if (obj.hasOwnProperty('error')) {
            return res.status(obj.error.status).end(obj.message);
        } else {
          res.writeHead(200, {
              "Content-Type": "text/plain"
          });
      }
        res.end(body);
    });
};
//#TODO: Better error handling
exports.createStudentAll = function(req, res) {
    //console.log(config.partitions[1].port);
    async.map(config.partitions, function(item, callback) {

        var fullUrl = req.protocol + '://' + host + ':' + item.port + '/students' + req.url;
        console.log(fullUrl);
        request.post({
            url: fullUrl,
            form: req.body
        }, function(err, response, body) {
            // JSON body
            if (err) {
                console.log(err);
                callback(err);
                return;
            }
            //obj = JSON.parse(body);
            callback(false, body);
        });
    }, function(err, results) {
        if (err) {
            console.log(err);
            res.send(500, "Server Error");
            return;
        }
        console.log(results);
        res.send(results);
    });
};
exports.deleteStudent = function(req, res) {
    //console.log('Inside deleteStudent');
    var uni = req.params.uni;
    var index = find_partition(uni, config.partitions);
    var fullUrl = req.protocol + '://' + host + ':' + config.partitions[index].port + '/students' + req.url;
    console.log(fullUrl);
    request.del({
        url: fullUrl
    }, function(err, response, body) {
        if (err) {
            return res.status(500).end('Error');
        }
        obj = JSON.parse(body);
        if (obj.hasOwnProperty('error')) {
            return res.status(obj.error.status).end(obj.message);
        } else {
          res.writeHead(200, {
              "Content-Type": "text/plain"
          });
      }
        res.end(body);
    });
};
exports.deleteAttribute = function(req, res) {
    //console.log('Inside deleteAttribute');
    async.map(config.partitions, function(item, callback) {

        var fullUrl = req.protocol + '://' + host + ':' + item.port + '/students' + req.url;
        console.log(fullUrl);
        request.del({
            url: fullUrl,
            form: req.body
        }, function(err, response, body) {
            // JSON body
            if (err) {
                console.log(err);
                callback(err);
                return;
            }
            //obj = JSON.parse(body);
            callback(false, body);
        });
    }, function(err, results) {
        if (err) {
            console.log(err);
            res.send(500, "Server Error");
            return;
        }
        console.log(results);
        res.send(results);
    });
};
exports.updateStudent = function(req, res) {
    //console.log('Inside updateStudent');
    var uni = req.params.uni;
    var index = find_partition(uni, config.partitions);
    var fullUrl = req.protocol + '://' + host + ':' + config.partitions[index].port + '/students' + req.url;
    console.log(fullUrl);
    request.put({
        url: fullUrl,
        form: req.body
    }, function(err, response, body) {
        if (err) {
            return res.status(500).end('Error');
        }
        obj = JSON.parse(body);
        if (obj.hasOwnProperty('error')) {
            return res.status(obj.error.status).end(obj.message);
        } else {
          res.writeHead(200, {
              "Content-Type": "text/plain"
          });
      }
        res.end(body);
    });
};

//Courses Microservice handling
exports.findCourse = function(req, res) {
    //console.log(req);
    async.parallel([
            function(callback) {
                //TODO: '/courses' should be removed later
                var fullUrl = req.protocol + '://' + host + ':' + config.courses_port + '/courses' + req.url;
                console.log(fullUrl);
                request(fullUrl, function(err, response, body) {
                    // JSON body
                    if (err) {
                        console.log(err);
                        callback(true);
                        return;
                    }
                    obj = JSON.parse(body);
                    callback(false, obj);
                });
            },
        ],
        function(err, results) {
            if (err) {
                console.log(err);
                res.send(500, "Server Error");
                return;
            }
            res.send(results[0]);
        }
    );
};
exports.createCourse = function(req, res) {
    console.log('Inside createCourse');
    var fullUrl = req.protocol + '://' + host + ':' + config.courses_port + '/courses' + req.url;
    console.log(fullUrl);
    request.post({
        url: fullUrl,
        form: req.body
    }, function(err, response, body) {
        if (err) {
            return res.status(500).end('Error');
        }
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });
        res.end(body);
    });
};
exports.updateCourse = function(req, res) {
    //console.log('Inside createStudent');
    var fullUrl = req.protocol + '://' + host + ':' + config.courses_port + '/courses' + req.url;
    console.log(fullUrl);
    request.put({
        url: fullUrl,
        form: req.body
    }, function(err, response, body) {
        if (err) {
            return res.status(500).end('Error');
        }
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });
        res.end(body);
    });
};
exports.deleteCourse = function(req, res) {
    //console.log('Inside deleteAttribute');
    var fullUrl = req.protocol + '://' + host + ':' + config.courses_port + '/courses' + req.url;
    console.log(fullUrl);
    request.del({
        url: fullUrl,
        form: req.body
    }, function(err, response, body) {
        if (err) {
            return res.status(500).end('Error');
        }
        res.writeHead(200, {
            "Content-Type": "text/plain"
        });
        res.end(body);
    });
};
