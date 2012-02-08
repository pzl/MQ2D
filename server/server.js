var io = require('socket.io').listen(3050),
	util = require('util'),
	Class = require('./class.js').Class;

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function send(s,msg,broad){
	if (broad){
		s.broadcast.send(JSON.stringify(msg));
	} else {
		s.send(JSON.stringify(msg));
	}
}

var Entity = Class.extend({
		init: function(){},
		speedLimit: 0.15,
		loc: {x: 0, y: 0},
		onMove: function(coords,cb){ //cb is the callback function, first param as coordinates to send, second is whether move was successful
			if (Math.abs(coords.x - this.loc.x) > speedLimit || Math.abs(coords.y - this.loc.y) > speedLimit){
				cb(this.loc,false); //moved too fast, we're putting you back
			} else {
				this.loc.x = coords.x;
				this.loc.y = coords.y.
				cb(coords,true); //send out!
			}
		}
	}),
	Player = Entity.extend({
		init: function(team,p){
			this.team = team;
			this.position = p;
			this.claimed = false;
		},
		claim: function(sock){
			this.sock = sock;
			this.claimed=true;
		},
		radius: 0.7
	}),
	Chaser = Player.extend({
		init: function(team){
			this._super(team,'c');
		}
	}),
	Keeper = Player.extend({
		init: function(team){
			this._super(team,'k');
		}
	}),
	Beater = Player.extend({
		init: function(team){
			this._super(team,'b');
		}
	}),
	Seeker = Player.extend({
		init: function(team){
			this._super(team,'s');
		}
	}),
	Ball = Entity.extend({
		//new speedLimit
	}),
	Quaffle = Ball.extend({
		radius: 0.4
	}),
	Bludger = Ball.extend({
		radius: 0.3
	}),
	Snitch = Entity.extend({
		radius: 0.1
	}),
	players = [
				{
					k: [new Keeper(0)],
					b: [new Beater(0), new Beater(0)],
					c: [new Chaser(0),new Chaser(0), new Chaser(0)],
					s: [new Seeker(0)]
				},
				{
					k: [new Keeper(1)],
					b: [new Beater(1), new Beater(1)],
					c: [new Chaser(1), new Chaser(1), new Chaser(1)],
					s: [new Seeker(1)]
				},
			],
	state = {},
	dispatch = {};


dispatch.claim = function(d){
	if (!(d.t === 0 || d.t === 1) && !players[0].hasOwnProperty(d.p)){		
		send(this,{t:'ca',d:{a: 0}}); //improper claim format, reject 
		return;
	}
	
	if (players[d.t][d.p][d.i].claimed===false){
		players[d.t][d.p][d.i].claim(this);
		d.a=1;
		send(this,{t:'ca',d:d}); //claim accepted
		send(this,{t:'np', d:[d]},true);
		this.set('id',d);			
	} else {
		for(var i=0; i<players.length; i++){
			for (var pos in players[i]){
				if (players[i].hasOwnProperty(pos)){
					for (var j=0, l=players[i][pos].length; j<l; j++){
						if (players[i][pos][j].claimed!==false){
							send(this,{t:'ca',d:{a:0}}); //your pick is gone, but there are some open
							return;
						}
					}
				}
			}
		}
		send(this,{t:'ca',d:-1}); //all positions taken!
	}
}	
dispatch.move = function(d){
	var sock = this;
	sock.get('id',function(e,id){;
		send(sock,{t:'mv', d: {x:d.x, y:d.y, i:id.i, t:id.t, p:id.p}},true);
	});
}
dispatch.toss = function(d){
	send(this,{t:'t', d: d},true);	
}
dispatch.ballmove = function(d){
	send(this,{t:'bmv', d: d},true);
}

io.configure(function(){
	io.set('log level',1);
});

/*
 * Messages:
 *	w: welcome
 *	np: new player
 *
 */
io.sockets.on('connection',function(sock){
	/*
	for (var key in sock){
		console.log(key+": "+sock[key]);
	}
	*/
	var nps = [];
	for(var i=0; i<players.length; i++){
		for (var pos in players[i]){
			if (players[i].hasOwnProperty(pos)){
				for (var j=0, l=players[i][pos].length; j<l; j++){
					if (players[i][pos][j].claimed!==false){
						nps.push({p: pos, t:i, i:j});
					}
				}
			}
		}
	}
	if (nps.length == 14){
		console.log('New connection - Game already full');
		send(sock,{t:'w', d: 'f'});
	} else {		
		if (nps.length){
			send(sock,{t:'np', d: nps});
		}
		send(sock,{t:'w',d:'aok'});
		console.log('New connection - positions open');
		
		sock.on('message',function(d){
			d = JSON.parse(d);
			if (Object.prototype.hasOwnProperty.call(dispatch,d.t)){
				dispatch[d.t].call(sock,d.d);
			}
		});
	}
});