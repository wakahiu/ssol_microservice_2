db = db.getSiblingDB('students_service_3');
db.dropDatabase();
db = db.getSiblingDB('students_service_3');
db.createCollection('Students', {});
db.createCollection('Students_courselist_snapshot', {});

db.Students.insert(
	{
		"first_name": "Sam",
		"last_name": "Singh",
		"address": "123 High Street",
		"class": 2014,
		"uni": "ss1111",
		"major": "Electrical Engineering",
		"minor": "Gender Studies",
		"courses": [1111, 4444, 9999, 0000]
	}
);

db.Students.insert(
	{
		"first_name": "Robert",
		"last_name": "Ronson",
		"address": "1230 Cross Street",
		"class": 2014,
		"uni": "rr1111",
		"major": "Psychology",
		"minor": "Spanish",
		"courses": [2222, 3333, 6666, 5555]
	}
);

db.Students_courselist_snapshot.insert(
	{
		"uni": "rr1111",
		"datetime": "2013/11/09 17:00:27",
		"courses": [1111, 2222, 3333, 4444]
	}
);


