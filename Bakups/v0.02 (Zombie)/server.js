var express = require("express"),
	app 	= express(),
	http 	= require("http"),
	server 	= http.createServer(app),
	io 		= require("socket.io").listen(server),
	clients = {},
	zombies = [],
	speed	= 1;

server.listen(1337);
console.log("Listening...");

app.use(express.static(__dirname + "/public"));

io.set("log level", 1);

zombies.push(new zombie());
io.sockets.on("connection", function(socket){
	console.log("New connection:", socket.handshake.address.address);

	socket.on("newPlayer", function(data){
		clients[data.id] = data;
		clients[data.id].updated = new Date().getTime();
		clients[data.id].follow = true;
	});
	socket.on("playerMovement", function(data){
		clients[data.id] = data;
		clients[data.id].updated = new Date().getTime();
		clients[data.id].follow = true;

//		socket.broadcast.emit("playerMovement", data);
	})

	setInterval(function(){
		moveZombies();
		socket.emit("zombie", zombies);
	}, 1000/20);
});


/* Functions */
function rand(min, max){
	var num = Math.floor(Math.random()*(max - min + 1)) + min;
	while(num < min){
		num = Math.floor(Math.random()*(max - min + 1)) + min;
	}
	return num;
}
function zombie(){
	this.x	= rand(0, 500);
	this.y 	= rand(25, 500);
}
function moveZombies(){
	if(clients != undefined){
		for(var key in zombies){
			var z = zombies[key],
				dist = {d: 500, key: 0};

			for(var key in clients){
				var c = clients[key],
					distTemp = Math.sqrt(Math.pow(Math.abs(Math.abs(z.x) - Math.abs(c.x)),2) + Math.pow(Math.abs(Math.abs(z.y) - Math.abs(c.y)),2));
				if(distTemp < dist.d && c.hp > 0 && c.follow){
					dist.d = distTemp;
					dist.id = key;
				}
			}

			if(z.x < clients[dist.id].x && Math.round(Math.random())){ z.x = z.x + speed };
			if(z.x > clients[dist.id].x && Math.round(Math.random())){ z.x = z.x - speed };
			if(z.y < clients[dist.id].y && Math.round(Math.random())){ z.y = z.y + speed };
			if(z.y > clients[dist.id].y && Math.round(Math.random())){ z.y = z.y - speed };

			for(var key in clients){
				var c = clients[key];
				if(new Date().getTime() - c.updated > 30000){
					//delete clients[key];
					clients[data.id].follow = false;
				}
			}
		}
	}
}