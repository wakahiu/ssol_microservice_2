var redis = require("redis")

clientRISub = redis.createClient() // Subscribes to ri channel
clientRIPub = redis.createClient()// Publishes to student channel
clientRISub.subscribe("referential_integrity");

clientRISub.on("subscribe", function (channel, count) {
    console.log("Subscribed to " + channel + " channel.")
});

clientRISub.on("message", function (channel, message) { // Listens for ri channel JSON messgages

    console.log("Recieved message from channel name: " + channel);
    console.log("Recieved message: " + message);
    obj = JSON.parse(message)

    var publish_channel = "";

    // Publish to the students microservice
    if (obj.sender == "courses_micro_service") {
        publish_channel = "students_micro_service";      
    }
    
    // Publish to the courses microservice 
    else if (obj.sender == "students_micro_service") {
        publish_channel = "courses_micro_service";
    }

    clientRIPub.publish(publish_channel, message);
    console.log("Just published to " + publish_channel + " with message: " +  message);
    
});