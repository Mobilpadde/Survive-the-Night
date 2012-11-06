//$(function(){
	var socket		= io.connect("http://80.163.19.100:1337");
	socket.on("connect", function(){
		var canvas 		= $("#board")[0];
			ctx 		= canvas.getContext("2d"),
			speed 		= 2,
			size		= 7, // Radius; 7 => 14
			player 		= {
				"x"		: rand(0, 500),
				"y"		: rand(50, 500),
				"hp"	: 1,
				"id"	: socket.socket.sessionid,
				"color"	: { "r": rand(100, 255), "g": rand(100, 255), "b": rand(100, 255) }},
			movement 	= {
				"left"	: false,
				"up"	: false,
				"right" : false,
				"down"	: false},
			clients 	= {},
			zombies 	= [];

		socket.on("connect", socket.emit("newPlayer", player));
		socket.on("playerMovement", function(data){ clients[data.id] = data });

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
				if(movement.left 	&& player.x >= 008){ player.x = player.x - speed; socket.emit("playerMovement", player); };
				if(movement.up 		&& player.y >= 008){ player.y = player.y - speed; socket.emit("playerMovement", player); };
				if(movement.right 	&& player.x <= 492){ player.x = player.x + speed; socket.emit("playerMovement", player); };
				if(movement.down 	&& player.y <= 492){ player.y = player.y + speed; socket.emit("playerMovement", player); };
			}

			ctx.fillStyle = "rgba("+player.color.r+", "+player.color.b+", "+player.color.b+", "+(player.hp <= 0 ? 0 : player.hp)+")";
			ctx.beginPath();
			ctx.arc(player.x, player.y, size, 0, Math.PI*2);
			ctx.closePath();
			ctx.fill();
		}

		function moveZombies(){
			for(var key in zombies){
				var z = zombies[key];
				ctx.fillStyle = "rgb(50, 50, 50)";
				ctx.beginPath();
				ctx.arc(z.x, z.y, size, 0, Math.PI*2);
				ctx.closePath();
				ctx.fill();
			}
		}

		function handleLife(){
			for(var key in zombies){
				var z = zombies[key];
				if( (player.x <= (z.x + size) && player.x >= (z.x - size)) && 
					(player.y <= (z.y + size) && player.y >= (z.y - size)) &&
					player.hp >= 0){
					player.hp = player.hp - .1;
				}else if(player.hp <= 0){
					socket.emit("imDead", player);
				}
			}
		}

		function handleClients(){
			$("#users").html("");
			for(var key in clients){
				var c = clients[key];

				$("<li "+(c.hp <= 0 ? "class='dead'" : '')+" \n\
					style='color: rgb("+c.color.r+", "+c.color.b+", "+c.color.b+")'>\n\
					"+c.id+"</li>").appendTo("#users");

				ctx.fillStyle = "rgba("+c.color.r+", "+c.color.b+", "+c.color.b+", "+(c.hp <= 0 ? 0 : c.hp)+")";
				ctx.beginPath();
				ctx.arc(c.x, c.y, size, 0, Math.PI*2);
				ctx.closePath();
				ctx.fill();
			}
			$("<li "+(player.hp <= 0 ? "class='dead'" : '')+" \n\
				style='color: rgb("+player.color.r+", "+player.color.b+", "+player.color.b+")'> \n\
				"+player.id+"</li>").prependTo("#users");
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

			ctx.fillStyle = "darkblue";
			ctx.fillRect(0, 0, 500, 50);
			ctx.fillStyle = "white";
			ctx.font = "bold 30px sans-serif";
			ctx.textBaseline = "top";
			ctx.fillText("SafeZone", Math.round(250 - ctx.measureText("SafeZone").width/2), 7);

			handleKeys();
			handleLife();
			movePlayer();
			handleClients();
			moveZombies();
		}
		setInterval(loop, 1000/30);

		socket.on("zombie", function(data){
			zombies = data;
		});
		socket.on("clientUpdate", function(data){
			clients[data.id] = data;
		});
		socket.on("afk", function(data){
			if(player.id == data[player.id].id){
				player.x = data[player.id].x;
				player.y = data[player.id].y;
			}
		});
	});
//})