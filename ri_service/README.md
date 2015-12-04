# Courses Microservice

<br /> 
<br /> 
### 1. INSTALLING DEPENDENCIES
##### Dependencies (see package.json for versions):
  - redis

##### Dependencies Installation:
```sh
  $ npm install
```

<br /> 

<br /> 

### 2. CONFIGURATION
All configurable parameters are accessible the following JSON file:
   - /courses_service/config/config.json

<br /> 

##### A. Server Configurables
  -  mongo.host : <host> {type: string}
  -  mongo.port : <port> {type: integer}

<br /> 

##### B. Schema Configurables
  -  courseAttributes : <key(s)> {type: string array}
  -  Attributes can also be added and removed via API (see Section 4 under 'MODIFY THE SCHEMA')

<br /> 

<br /> 

### 3. Launch:
```sh
  $ nodemon app.js
```

<br /> 

<br /> 

### 4. API Documentation (as Command Line Templates):

From the command line, following APIs can be executed:

<br /> 

##### A. CREATE A NEW COURSE
```sh
$ curl -H "Content-Type: application/json" -X POST -d '{"name":"<course_name>"}' http://<host>:<port>/courses/
```

<br /> 

##### B. GET COURSE INFORMATION

###### - ALL COURSES:
```sh
$ curl -H "Content-Type: application/json" -X GET http://localhost:3000/courses/
```
###### - ONE COURSE:
```sh
$ curl -H "Content-Type: application/json" -X GET http://<host>:<port>/courses?name=<course_name>
```

<br /> 

##### C. ADD A STUDENT TO A COURSE
```sh
$ curl -i -X PUT -H 'Content-Type: application/json' -d '{"students":{"lastname":"<lastname>","firstname":"<firstname>"}}' http://<host>:<port>/courses?name=<course_name>
```

<br /> 

##### D. DELETE A COURSE
```sh
$ curl -H "Content-Type: application/json" -X DELETE http://<host>:<port>/courses?name=<course_name>
```
Note: '%20' can be used for one whitespace (i.e. <course_name> = course%204 --> 'course 4')

<br /> 

##### E. REMOVE A STUDENT FROM ONE COURSE
```sh
$ curl -i -X DELETE -H 'Content-Type: application/json' -d '{"students":{"lastname":"<lastname>","firstname":"<firstname>"}}' http://<host>:<port>/courses/<course_name>
```

<br /> 

##### F. REMOVE A STUDENT FROM ALL COURSES
```sh
$ curl -i -X DELETE -H 'Content-Type: application/json' -d '{"students":{"lastname":"<lastname>","firstname":"<firstname>"}}' http://<host>:<port>/student
```

<br /> 

##### G. MODIFY THE SCHEMA

###### -ADD A USER-DEFINED KEY TO THE SCHEMA:
```sh
$ curl -i -X POST -H 'Content-Type: application/json' -d '{"key":"<key>"}' http://<host>:<port>/schema/courses
```
###### -UPDATE A USER-DEFINED KEY IN A DOCUMENT:
```sh
$ curl -i -X PUT -H 'Content-Type: application/json' -d '{"attribute1":<key_value>}' http://<host>:<port>/courses?name=<course_name>
```
###### -DELETE A USER-DEFINED KEY IN THE SCHEMA:
```sh
$ curl -i -X DELETE -H 'Content-Type: application/json' -d '{"key":"<key>"}' http://<host>:<port>/schema/courses
```

<br /> 

<br /> 

### 5. Example

<br /> 

##### A. Set Configuration (/courses_service/config/config.json)

```json
{
  "mongo": {
    "host": "localhost/test_server",
    "port": 3000
  },
  "courseAttributes": [
    "instructor"
  ]
}
```

<br /> 

##### B. POST a course and PUT a student to that course
```sh
curl -H "Content-Type: application/json" -X POST -d '{"name":"Microservices and APIs"}' http://localhost:3000/courses/

curl -i -X PUT -H 'Content-Type: application/json' -d '{"students":{"lastname":"Burrows","firstname":"Peter"}}' http://localhost:3000/courses?name=microservices%20and%20apis
```


```json
[
     {
          "_id": "56379ab8fec87c4f1c8dfaed",
          "name": "MICROSERVICES AND APIS",
          "updated_at": "2015-11-02T17:17:44.293Z",
          "instructor": null,
          "__v": 1,
          "students": [
               {
                    "lastname": "BURROWS",
                    "firstname": "PETER",
                    "_id": "56379ac3fec87c4f1c8dfaee"
               }
          ]
     }
]
```

<br /> 

##### C. PUT a value to the user-defined key

Note: The key, "instructor", was previously initialized in the config.json file

```sh
curl -i -X PUT -H 'Content-Type: application/json' -d '{"instructor":"Don Ferguson"}' http://localhost:3000/courses?name=microservices%20and%20apis
```


```json
[
     {
          "_id": "56379ab8fec87c4f1c8dfaed",
          "name": "MICROSERVICES AND APIS",
          "updated_at": "2015-11-02T17:17:44.293Z",
          "instructor": "DON FERGUSON",
          "__v": 1,
          "students": [
               {
                    "lastname": "BURROWS",
                    "firstname": "PETER",
                    "_id": "56379ac3fec87c4f1c8dfaee"
               }
          ]
     }
]
```

<br /> 

##### D. POST another user-defined key and PUT a value to the key

```sh
curl -i -X POST -H 'Content-Type: application/json' -d '{"key":"ROOM"}' http://localhost:3000/schema/courses

curl -i -X PUT -H 'Content-Type: application/json' -d '{"ROOM":"428 Pupin"}' http://localhost:3000/courses?name=microservices%20and%20apis
```


```json
[
     {
          "_id": "56379af9fec87c4f1c8dfaef",
          "name": "MICROSERVICES AND APIS",
          "updated_at": "2015-11-02T17:18:49.804Z",
          "instructor": "DON FERGUSON",
          "ROOM": "428 PUPIN",
          "__v": 0,
          "students": [
               {
                    "lastname": "BURROWS",
                    "firstname": "PETER",
                    "_id": "56379ac3fec87c4f1c8dfaee"
               }
          ]
     }
]
```

<br /> 

##### E. DELETE a user-defined key and remove a student from a course
```sh
curl -i -X DELETE -H 'Content-Type: application/json' -d '{"key":"instructor"}' http://localhost:3000/schema/courses

curl -i -X DELETE -H 'Content-Type: application/json' -d '{"students":{"lastname":"Burrows","firstname":"Peter"}}' http://localhost:3000/courses/microservices%20and%20apis
```

```JSON
[
     {
          "_id": "5637a904eed25fa71fa22376",
          "name": "MICROSERVICES AND APIS",
          "updated_at": "2015-11-02T18:18:44.319Z",
          "ROOM": "428 PUPIN",
          "__v": 0,
          "students": []
     }
]
```

<br /> 

<br /> 

### 6. Known Issues

  - Unexpected behavior when adding courses and names with characters that are not letters nor numerals



