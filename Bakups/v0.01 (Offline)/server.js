var express = require("express"),
	app = express(),
	http = require("http"),
	server = http.createServer(app),
	io = require("socket.io").listen(server);

server.listen(1337);
console.log("Listening...");

app.use(express.static(__dirname + "/public"));

io.set("log level", 1);

io.sockets.on("connection", function(socket){
	console.log("New connection: ", socket.handshake.address.address);

	socket.on("move", function(){
		console.log("We got movement!");
	})
});