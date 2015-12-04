# Students Microservice

<br />
### 1. Things to note before beginning:

In order to implement sharding my last names, three instance of the services need to be instantiated, each connected to a different database. The databases are sharded by uni's in the following way:

* students_service_1: A-H
* students_service_2: I-Q
* students_service_3: R-Z

Thus in order to typically run the students service, one would have to 
* 1) Instantiate each of the three Node instances 
* 2) Initialize each of the sharded databases
* 3) Connect each service with the corresponding database

Below we outline the steps to achieve the above - please replace <number> with the service instance being instantiated.

To set up the database:
Run mongod on separate terminal window (This step is done only once)
```
	mongod [--dbpath ./data/]
```	
Run mongo to setup the database
```	
	mongo students_service_<number> db_scripts/setup_db_<number>.js
```
Modify the following line in config file to the appropriate number (config/env/development.js)
```	
	port: process.env.PORT || 300<number>,
	db: 'mongodb://0.0.0.0/students_service_<number>'
```

### 2. Running the application
Before you run the application:
<br />
run "npm install"

To run the app:
<br />
run "node app.js"

<br />
<br />

### 3. API documentation

It is strongly suggested that a tool such as Postman is used to send the various requests. For all POST and PUT requests, the parameters should be passed by the x-www-form-urlencoded format.

#### Searching a student

```
GET <hostname>:<port>/students
```

One can specify query parameters as URL arguments. If none is specified, the request will return all students in the database. This is a simple query to the database, thus if there are invalid parameters, the result will simply return an empty list.

#### Adding a student

```
POST <hostname>:<port>/students
```

In order for this request to succeed, three required parameters must be specified in the HTTP POST request body: first_name, last_name, uni. Failure to do so will result in a error status of 400. Specification of parameters that are not part of the schema will also generate a 400 error. Lastly, a duplicate value for UNI will also result in a 400. 

#### Fetching a student by UNI

```
GET <hostname>:<port>/students/<uni>
```

This will result in a 404 if the student specified by <uni> is not valid. Otherwise, it will return a JSON representation of the student

####  Removing a student

```
DELETE <hostname>:<port>/students/<uni>
```

This endpoint will remove a student specified by <uni>. A 404 error willl be generated if such student does not exist

#### Updating a student

```
PUT <hostname>:<port>/students/<uni>
```
The following cases will generate errors in this method:

* Specified student with <uni> is not found (404)
* Trying to change the courses attribute through this endpoint (400)
* Trying to change an attribute that does not exist (400)
* Modifying the UNI to a non-unique value (400)

Note that changing the courses attribute is not allowed through this endpoint, but must be done through the add-course or remove-course actions described below

### Adding a course to a student

```
POST <hostname>:<port>/students/<uni>/courses
```

There must be a 'course_id' parameter in the request body in order for this method to work - the parameter must specify the call number of the course to be added. In addition, the following errors may be generated for this method:

* 'course_id' parameter not defined (400)
* Call number is not a number (400)
* Student specified by <uni> not found (404)
* Student already registered for course specified (400)


### Removing a course from a student

```
DELETE <hostname>:<port>/students/<uni>/courses
```

As with adding a course, there must be a 'course_id' parameter in the request body specifying the call number of the course to be removed. The following errors may be generated for this method:

* 'course_id' parameter not defined (400)
* Call number is not a number (400)
* Student specified by <uni> not found (404)
* Student not registered for course specified (400)

### Adding a schema attribute

```
POST <hostname>:<port>/attributes
```

This method must be provided a 'attribute' parameter in the request body, otherwise it will generate a 400 error. Furthermore, adding an attribute that already exists will also generate a 400 error. Lastly, all attributes will be converted to lowercase.

### Deleting an attribute

```
DELETE <hostname>:<port>/attributes
```

As with adding an attribute, this method must be provided an 'attribute' parameter in the request body. Attempt to delete an attribute that does not exist will result in an 400 error. Furthermore, users are not allowed to delete the following attributes:

* first_name
* last_name
* uni
* courses

An attempt to do so will result in a 403 error.










