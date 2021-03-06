$(function(){
	var canvas 		= $("#board")[0];
		ctx 		= canvas.getContext("2d"),
		speed 		= 1,
		player 		= {
			"x"		: rand(0, 500),
			"y"		: rand(25, 500),
			"hp"	: 1,
			"id"	: Math.round($.now()*Math.random())},
		movement 	= {
			"left"	: false,
			"up"	: false,
			"right" : false,
			"down"	: false},
		clients 	= {},
		zombies 	= [],
		socket		= io.connect("http://80.163.19.100:1337");

	socket.on("connect", socket.emit("newPlayer", player));
	socket.on("playerMovement", function(data){ clients = data });

	function rand(min, max){
		var num = Math.floor(Math.random()*(max - min + 1)) + min;
		while(num < min){
			num = Math.floor(Math.random()*(max - min + 1)) + min;
		}
		return num;
	}

	function handleKeys(){
		document.onkeydown = function(e){
			var kc = e.keyCode;
			if(kc == 65 || kc == 37){ movement.left = true };
			if(kc == 87 || kc == 38){ movement.up = true };
			if(kc == 68 || kc == 39){ movement.right = true };
			if(kc == 83 || kc == 40){ movement.down = true };
		}
		document.onkeyup = function(e){
			var kc = e.keyCode;
			if(kc == 65 || kc == 37){ movement.left = false };
			if(kc == 87 || kc == 38){ movement.up = false };
			if(kc == 68 || kc == 39){ movement.right = false };
			if(kc == 83 || kc == 40){ movement.down = false };
		}
	}

	function movePlayer(){
		if(player.hp > 0){
			if(movement.left){ player.x = player.x - speed; socket.emit("playerMovement", player); };
			if(movement.up){ player.y = player.y - speed; socket.emit("playerMovement", player); };
			if(movement.right){ player.x = player.x + speed; socket.emit("playerMovement", player); };
			if(movement.down){ player.y = player.y + speed; socket.emit("playerMovement", player); };
		}

		ctx.fillStyle = "rgba(200, 0, 0, "+player.hp+")";
		ctx.beginPath();
		ctx.arc(player.x, player.y, 7, 0, Math.PI*2);
		ctx.closePath();
		ctx.fill();
	}

	function moveZombies(){
		for(var key in zombies){
			var z = zombies[key];
			ctx.fillStyle = "rgb(50, 50, 50)";
			ctx.beginPath();
			ctx.arc(z.x, z.y, 7, 0, Math.PI*2);
			ctx.closePath();
			ctx.fill();
		}
	}

	function handleDeath(){
		for(var key in zombies){
			var z = zombies[key];
			if( (player.x <= (z.x + 14) && player.x >= (z.x - 14)) && 
				(player.y <= (z.y + 14) && player.y >= (z.y - 14)) &&
				player.hp >= 0){
				player.hp = player.hp - .1;
			}
		}
	}

	function handleClients(){
		for(var key in clients){
			var c = clients[key];
			ctx.fillStyle = "rgba(200, 0, 0, "+c.hp+")";
			ctx.beginPath();
			ctx.arc(c.x, c.y, 7, 0, Math.PI*2);
			ctx.closePath();
			ctx.fill();
		}
	}

	function loop(){
		ctx.clearRect(0, 0, 500, 500);
		ctx.fillStyle = "#e2bc86";
		ctx.fillRect(0, 25, 500, 500);
		ctx.strokeStyle = "#000";
		ctx.moveTo(0, 25);
		ctx.lineTo(0, 500);
		ctx.lineTo(500, 500);
		ctx.lineTo(500, 25);
		ctx.lineTo(0, 25);
		ctx.closePath();
//		ctx.stroke();

		ctx.fillStyle = "yellow";
		ctx.fillRect(0, 0, 500, 25);
		ctx.fillStyle = "darkblue";
		ctx.fillRect(0, 25, 500, 25);

		handleKeys();
//		handleDeath();
		movePlayer();
//		handleClients();
		moveZombies();
	}
	setInterval(loop, 1000/30);

	socket.on("zombie", function(data){
		zombies = data;
	});
	/*socket.on("playerMovement", function(data){
		clients[data.id] = data;
	});*/
})