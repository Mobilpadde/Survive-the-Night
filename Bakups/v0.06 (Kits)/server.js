var express = require("express"),
	app 	= express(),
	http 	= require("http"),
	server 	= http.createServer(app),
	io 		= require("socket.io").listen(server),
	clients = {},
	zombies = [],
	kits	= {},
	kitsN	= 1,
	speed	= 1;

server.listen(1337);
//server.listen(80);
console.log("Listening...");

app.use(express.static(__dirname + "/public"));

io.set("log level", 1);
kits[kitsN] = new medicKit();
/* To specific client */
io.sockets.on("connection", function(socket){
	console.log("IP:", socket.handshake.address.address);
	console.log("ID:", socket.id);
	zombies.push(new zombie());

	socket.send(socket.id);
	socket.on("newPlayer", function(data){
		if(!(data.id in clients)){
			clients[data.id] 			= data;
			clients[data.id].updated 	= new Date().getTime();
			clients[data.id].follow 	= true;
		}

		socket.broadcast.emit("clientUpdate", data);
	});
	socket.on("kitTaken", function(id){ delete kits[id] });
	socket.on("playerMovement", function(data){
		clients[data.id] 			= data;
		clients[data.id].updated 	= new Date().getTime();
		if(!(data.y <= 42)){
			clients[data.id].follow = true;
		}

		socket.broadcast.emit("clientUpdate", data);
	})
	socket.on("imDead", function(data){
		clients[data.id] 			= data;
		clients[data.id].updated 	= new Date().getTime();
		clients[data.id].follow 	= false;
		socket.broadcast.emit("clientUpdate", data);
	});
	socket.on("disconnect", function(data){
		zombies.splice(0,1);
		delete clients[socket.id];
		socket.broadcast.emit("ClientLeft", socket.id);
		console.log(data);
		if(empty(clients)){
			zombies = [];
			console.log("No clients D:");
		}
	});
});
/* To all clients */
setInterval(function(){
	handleAFK();
	moveZombies();
	io.sockets.emit("zombie", zombies);
	io.sockets.emit("medic", kits);
}, 1000/30);
setInterval(function(){ io.sockets.emit("afk", clients) }, 1000);
setInterval(function(){ 
	if(!empty(clients)){
		(Math.round(Math.random()) ? kits[kitsN] = new medicKit() : zombies.push(new zombie())); 
	}
}, 30000);

/* Functions */
function rand(min, max){
	var num = Math.floor(Math.random()*(max - min + 1)) + min;
	while(num < min){
		num = Math.floor(Math.random()*(max - min + 1)) + min;
	}
	return num;
}
function empty(obj){
	for(var a in obj){ if(obj.hasOwnProperty(a)){ return false }};
	return true;
}
function medicKit(){
	this.x	= rand(7, 493);
	this.y 	= rand(50, 493);
	this.id = kitsN;
	kitsN++;
	console.log("I can haz life");
}
function zombie(){
	this.x		= rand(7, 493);
	this.y 		= rand(57, 493);
	this.dist 	= {x: rand(0, 500), y: rand(58, 500)};
	console.log("A wild zombie has appeared!");
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
				var z 		= zombies[key],
					dist 	= { d: 1012 };

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
function handleAFK(){ // If you're dead, you'll also be tagged as afk :3
	for(var key in clients){
		var c = clients[key];
		if(new Date().getTime() - c.updated > 10000 && c.y > 42){
			c.follow 	= false;
			c.x 		= rand(8, 492);
			c.y 		= rand(42, 42);
		}
	}
}