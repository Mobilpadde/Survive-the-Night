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

io.sockets.on("connection", function(socket){
	console.log("New connection:", socket.handshake.address.address);
	zombies.push(new zombie());

	socket.on("newPlayer", function(data){
		if(!(data.id in clients)){
			clients[data.id] = data;
			clients[data.id].updated = new Date().getTime();
			clients[data.id].follow = true;
		}
	});
	socket.on("playerMovement", function(data){
		clients[data.id] = data;
		clients[data.id].updated = new Date().getTime();
		if(!(data.y <= 42)){
			clients[data.id].follow = true;
		}

		socket.broadcast.emit("clientUpdate", data);
	})
	socket.on("imDead", function(data){
		clients[data.id] = data;
		clients[data.id].updated = new Date().getTime();
		clients[data.id].follow = false;
		socket.broadcast.emit("clientUpdate", data);
	});
	socket.on("disconnect", function(){
		zombies.unshift();
	});

	setInterval(function(){
		handleAFK();
		moveZombies();
		socket.emit("zombie", zombies);
	}, 1000/30);
	setInterval(function(){ socket.emit("afk", clients) }, 1000);
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
	this.x		= rand(0, 500);
	this.y 		= rand(50, 500);
	this.dist 	= {x: rand(50, 500), y: rand(0, 500)};
}
function moveZombies(){
	if(clients != undefined){
		var follow = false;
		for(var key in clients){
			var c = clients[key];
			if(c.follow){
				follow = true;
			}
		}

		if(follow){
			for(var key in zombies){
				var z = zombies[key],
					dist = { d: 1012 };

				for(var key in clients){
					var c = clients[key],
						distTemp = Math.sqrt(Math.pow(Math.abs(Math.abs(z.x) - Math.abs(c.x)),2) + Math.pow(Math.abs(Math.abs(z.y) - Math.abs(c.y)),2));
					if(distTemp < dist.d && distTemp < 250 && c.hp > 0 && c.follow){
						dist.d = distTemp;
						dist.x = c.x;
						dist.y = c.y;
					}
				}

				if(dist.d >= 250){
					if(z.x < z.dist.x && !Math.round(Math.random()*5)){ z.x = z.x + speed };
					if(z.x > z.dist.x && !Math.round(Math.random()*5)){ z.x = z.x - speed };
					if(z.y < z.dist.y && !Math.round(Math.random()*5)){ z.y = z.y + speed };
					if(z.y > z.dist.y && !Math.round(Math.random()*5)){ z.y = z.y - speed };

					if(z.x == z.dist.x){ z.dist.x = rand(0, 500); }
					if(z.y == z.dist.y){ z.dist.y = rand(58, 500); }
				}else{
					if(z.x < dist.x && Math.round(Math.random())){ z.x = z.x + speed };
					if(z.x > dist.x && Math.round(Math.random())){ z.x = z.x - speed };
					if(z.y < dist.y && Math.round(Math.random())){ z.y = z.y + speed };
					if(z.y > dist.y && Math.round(Math.random())){ z.y = z.y - speed };
				}
			}
		}else{
			for(var key in zombies){
				var z = zombies[key];
				if(z.x < z.dist.x && !Math.round(Math.random()*5)){ z.x = z.x + speed };
				if(z.x > z.dist.x && !Math.round(Math.random()*5)){ z.x = z.x - speed };
				if(z.y < z.dist.y && !Math.round(Math.random()*5)){ z.y = z.y + speed };
				if(z.y > z.dist.y && !Math.round(Math.random()*5)){ z.y = z.y - speed };

				if(z.x == z.dist.x){ z.dist.x = rand(0, 500); }
				if(z.y == z.dist.y){ z.dist.y = rand(58, 500); }
			}
		}
	}
}
function handleAFK(){
	for(var key in clients){
		var c = clients[key];
		if(new Date().getTime() - c.updated > 10000 && c.y > 42){
			c.follow 	= false;
			c.x 		= rand(8, 492);
			c.y 		= rand(8, 42);
		}
	}
}