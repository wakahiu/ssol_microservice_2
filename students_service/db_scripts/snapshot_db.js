db = db.getSiblingDB('students_service_1');
db.createCollection('Students_courselist_snapshot', {});
db.Students.insert(
	{
		"uni": "aa1111",
		"datetime": "015/11/09 17:00:27",
		"courses": [1111, 2222, 3333, 4444]
	}
);



