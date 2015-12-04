# Courses Microservice
(brief description)

<br /> 
<br /> 
### 1. INSTALLING DEPENDENCIES
##### Dependencies (see package.json for versions):
  - cookie-parser
  - body-parser
  - method-override
  - morgan
  - errorhandler
  - mongoose
  - nconf

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

### 4. API Documentation:


<br /> 

##### A. CREATE A NEW COURSE
```
POST http://<host>:<port>/courses 
```

URL Parameter Keys:
* course_id { type: Number, min: 0000, max: 9999 } (required parameter)
* name { type: String } (required parameter)

```JSON
{
	"course_id" : <course_call_number>, 
	"name"		 : <course_name>
}
```

<br /> 

##### B. GET COURSE INFORMATION

```
 GET http:///<host>:<port>/courses
```

URL Parameter Keys:
* course_id { type: Number, min: 0000, max: 9999 }
* name { type: String }

```JSON
{
	"course_id" :	<course_call_number>, 
	"name"		 :	<course_name>
}
```

<br /> 

##### C. ADD A STUDENT TO A COURSE
```
POST http://<host>:<port>/courses/<course_call_number>/students
```

URL Parameter Keys:
* uni { type: String } (required parameter)

```JSON
{
	"uni"		:	<unique_id>
} 
```

<br /> 

##### D. DELETE A COURSE
```
DELETE http://<host>:<port>/courses
```

URL Parameter Key:
* course_id { type: Number, min: 0000, max: 9999 }


```JSON
{
	"course_id"	:	<course_call_number> 
}
```

<br /> 

##### E. REMOVE A STUDENT FROM ONE COURSE
```sh
DELETE http://<host>:<port>/courses/<course_call_number>/students
```

URL Parameter Key:
* uni { type: String } (required parameter)

```JSON
{
	"uni"		:	<unique_id>
}
```
<br /> 

##### F. REMOVE A STUDENT FROM ALL COURSES
```
DELETE http://<host>:<port>/courses/students
```

URL Parameter Key:
* uni { type: String } (required parameter)

```JSON
{
	"uni"		:	<unique_id>
}
```

<br /> 

##### G. MODIFY THE SCHEMA

1) ADD A USER-DEFINED KEY TO THE SCHEMA:
```
POST http://<host>:<port>/courses/schema
```

URL Parameter Key:
* key { type: String } (required parameter)

```JSON
{
	"key" : "<key>"
} 
```

<br /> 

2) UPDATE A USER-DEFINED KEY IN A DOCUMENT:
```
PUT http://<host>:<port>/courses/<course_call_number>
```

URL Parameter Key:
* "<key>" { type: not specified } (required parameter)
```JSON
{
	"<key>"	:	<key_value>
}
```

<br /> 

3) DELETE A USER-DEFINED KEY IN THE SCHEMA:
```
DELETE http://<host>:<port>/courses/schema
```
URL Parameter Key:
* key { type: String } (required parameter)
```JSON
{
	"key"	:	"<key>"
}
```

<br /> 

<br /> 

### 5. Example Usage 

<br /> 

##### A. Set Configuration (/courses_service/config/config.json)

```json
{
  "mongo": {
    "host": "localhost/test_server",
    "port": 4000
  },
  "courseAttributes": [
    "instructor"
  ]
}
```

<br /> 

##### B. POST a course and PUT a student to that course
```
POST http://localhost:4000/courses

{
	course_id	:	9999,
	name		:	"Microservices and APIs"
}

```

* URL: localhost:4000/courses?course_id=9999&name=Microservices and APIs

<br /> 

```
POST http://localhost:3000/courses/9999/students

{
	uni	:	"phb2114"
}

```
* URL: localhost:4000/courses/9999/students?uni=phb2114

<br /> 

```json
[
  {
    "_id": "5640cfbeb541a8043c41514f",
    "course_id": 9999,
    "name": "Microservices and APIs",
    "updated_at": "2015-11-09T16:54:22.802Z",
    "instructor": null,
    "__v": 1,
    "students": [
      {
        "uni": "phb2114",
        "_id": "5640d0f38f0fc7243cbd74b2"
      }
    ]
  }
]
```

<br /> 

##### C. PUT a value to the user-defined key

Note: The key, "instructor", was previously initialized in the config.json file

```
PUT http://localhost:3000/courses/9999
```


```JSON
{
	"instructor"	:	"Don Ferguson"
}
```

* URL: localhost:4000/courses/9999?instructor=Don Ferguson

<br /> 

```JSON
[
  {
    "_id": "5640cfbeb541a8043c41514f",
    "course_id": 9999,
    "name": "Microservices and APIs",
    "updated_at": "2015-11-09T16:54:22.802Z",
    "instructor": "Don Ferguson",
    "__v": 1,
    "students": [
      {
        "uni": "phb2114",
        "_id": "5640d0f38f0fc7243cbd74b2"
      }
    ]
  }
]
```

<br /> 

##### D. POST another user-defined key and PUT a value to the key

```
POST http://localhost:3000/courses/schema
```

```JSON
{
	"key"	:	"room"
}
```

* URL: localhost:4000/courses/schema?key=room

<br /> 

```
PUT http://localhost:3000/courses?course_id=9999
```

```JSON
{
	"room"	:	"428 Pupin"
}
```

* URL: localhost:4000/courses/9999?room=428 Pupin

<br /> 

```json
[
  {
    "_id": "5640d2748f0fc7243cbd74b3",
    "course_id": 9999,
    "name": "Microservices and APIs",
    "updated_at": "2015-11-09T17:05:56.722Z",
    "instructor": "Don Ferguson",
    "room": "428 Pupin",
    "__v": 0,
    "students": [
      {
        "uni": "phb2114",
        "_id": "5640d0f38f0fc7243cbd74b2"
      }
    ]
  }
]
```

<br /> 

##### E. DELETE a user-defined key and DELETE a student from a course
```
DELETE http://localhost:3000/courses/schema
```

```JSON
{
	"key"	:	"instructor"
}
```
* URL: localhost:4000/courses/schema?key=instructor

<br /> 

```
DELETE http://localhost:3000/courses/9999/students
```

```JSON
{
	"uni"	:	"phb2114"
} 
```

<br /> 

```JSON
[
  {
    "_id": "5640d3348f0fc7243cbd74b4",
    "course_id": 9999,
    "name": "Microservices and APIs",
    "updated_at": "2015-11-09T17:09:08.285Z",
    "room": "428 Pupin",
    "__v": 0,
    "students": []
  }
]
```

<br /> 

<br /> 





