var io = require('socket.io').listen(3050),
	util = require('util'),
	Class = require('./class.js').Class;

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

Function.prototype.toString = function(){
	return 'function';
}

var AllocTeam = function(){
		var _pos = ['c','c','c','b','b','k','s']
	
		return {
			full: function(){ return !_pos.length },
			assign: function(){
				if (!_pos.length){
					return false;
				} else {
					return _pos.splice(~~(Math.random()*_pos.length),1)[0];
				}
			}
		}
	},
	Entity = Class.extend({
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
		init: function(id,sock,p){
			this.id = id;
			this.sock = sock;
			this.position = p;
		},
		radius: 0.7
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
	alloc = [new AllocTeam(), new AllocTeam()],
	allocbuf = [],
	players = {},
	state = {},
	dispatch = {};
	
dispatch.move = function(d){
	this.broadcast.send(JSON.stringify({t:'mv', d: d}))
}
dispatch.toss = function(d){
	this.broadcast.send(JSON.stringify({t:'throw', d: d}));	
}
dispatch.ballmove = function(d){
	this.broadcast.send(JSON.stringify({t:'bmv', d: d}));
}

io.configure(function(){
	io.set('log level',1);
});

io.sockets.on('connection',function(sock){
	for (var key in sock){
		//console.log(key+": "+sock[key]);
	}
	if (alloc[0].full() && alloc[1].full()){
		console.log('New connection - Game already full');
		sock.send(JSON.stringify({t:'welcome', d: 'full'}));
	} else {
		var aTeam = (Math.random() > 0.5) ? 0 : 1;
		if (alloc[aTeam].full()){
			aTeam = (aTeam) ? 0 : 1;
		}
		var position = alloc[aTeam].assign(),
			msg = { t: aTeam+1, p:position, id: sock.id };
		
		players[sock.id]
			
		if (allocbuf.length){
			sock.send(JSON.stringify({t:'np', d: allocbuf}));
		}
		sock.send(JSON.stringify({t:'welcome', d: msg}));
		sock.broadcast.send(JSON.stringify({t:'np', d: msg}));
		allocbuf.push(msg);
		console.log('New connection - '+JSON.stringify(msg));
	}
	
	sock.on('message',function(d){
		d = JSON.parse(d);
		if (Object.prototype.hasOwnProperty.call(dispatch,d.t)){
			dispatch[d.t].call(sock,d.d);
		}
	});
});