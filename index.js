let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

let player_list = {};

app.use("/public", express.static(__dirname + "/public"));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');

});

io.on('connection', (sock) => {
	let player = {
		playerId: sock.id,
		pos: {
			x: 0,
			y: 0
		},
		radius: 15,
		speed: 6
	};
	player_list[player.playerId] = player;
	sock.emit('init', player);
	sock.on('disconnect', () => {
		delete player_list[player.playerId];
	});

	sock.on('key_press', (data) => {
		const last_pos = { x: player.pos.x, y: player.pos.y };
		for (let i = 0; i < data.length; i++) {
			switch (data[i]) {
				case "right":
					player.pos.x += player.speed;
					break;
				case "left":
					player.pos.x -= player.speed;
					break;
				case "up":
					player.pos.y -= player.speed;
					break;
				case "down":
					player.pos.y += player.speed;
					break;
				// default:
					// TODO: handle invalid keys
					// break;
			}
		}
		// TODO: only check players in the current scene
		for (let i in player_list) {
			if (player_list[i] == player) { continue }
			if (check_for_collision(player, player_list[i])) {
				const diff = { x: player.pos.x - last_pos.x, y: player.pos.y - last_pos.y };
				console.log(`diff.x, diff.y = ${diff.x}, ${diff.y}`);

				const diff_length = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
				console.log(`diff_length = ${diff_length}`);
				const dist_to_p = player.radius + player_list[i].radius;
				console.log(`dist_to_p = ${dist_to_p}`);
				const new_displacement = { x: diff.x / diff_length * dist_to_p, y: diff.y / diff_length * dist_to_p }
				player.pos = { x: last_pos.x + new_displacement.x, y: last_pos.y + new_displacement.y };
			}
		}
	});

	setInterval(() => {
		sock.emit('update_players', player_list);
	}, 20);
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function check_for_collision(obj1, obj2) {
	const dist = Math.sqrt(Math.pow(obj2.pos.x - obj1.pos.x, 2) + Math.pow(obj2.pos.x - obj1.pos.x, 2));
	// console.log(`dist = ${dist}`);
	// console.log(`sum of radii = ${obj1.radius + obj2.radius}`);
	if (dist >= obj1.radius + obj2.radius) {
		return false;
	} else {
		return true;
	}
}

function extend_object(obj, src, whitelist) {
    for (let key in src) {
        if (src.hasOwnProperty(key) && (!whitelist || whitelist.includes(key))) {
			if (key == "pos") {
				if (Math.abs(src[key].x - obj[key].x) > 6 ||
				    Math.abs(src[key].y - obj[key].y) > 6) {
					continue;
				}
			}
			obj[key] = src[key];
		}
    }
}

