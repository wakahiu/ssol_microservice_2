for i in {2000..2300}

do
	echo "Welcome $i times"
	curl -X POST http://localhost:3001/courses?course_num=$i
done


curl -i -X PUT -H 'Content-Type: application/json' -d '{"course":"1122"}' http://localhost:3003/jsc2226/remove-course

curl -i -X DELETE -H 'Content-Type: application/json' -d '{"students":{"lastname":"Singh","firstname":"Jivtesh","uni":"jsc2226"}}' http://localhost:3000/courses/1122

curl -X PUT -H 'Content-Type: application/json' -d '{"students":{"lastname":"Singh","firstname":"Jivtesh","uni":"jsc2226"}}' http://localhost:3000/courses?name=1122


