var io = require('socket.io').listen(3050),
	util = require('util');

io.configure(function(){
	io.set('log level',1);
});

function send(s,msg,broad){
	if (broad){
		s.broadcast.send(JSON.stringify(msg));
	} else {
		s.send(JSON.stringify(msg));
	}
}

var Game = (function(){
	var players = [],
	_full = 0;
	
	return {
		full: function(){
			return (_full == 14);
		},
		available: function(i){
			return (!this.full() && (typeof players[i] == 'undefined' || players[i] === null) && i >= 0 && i < 15);
		},
		add: function(sock,i){
			if (this.available(i)){
				players[i] = sock;
				Engine.newPlayer(i);
				_full++;
				return true;
			} else {
				console.log('RUUUN');
				return false;
			}
		},
		isPlayer: function(sock){
			for (var i=0, l=players.length; i<l; i++){
				if (players[i] && players[i].id == sock.id){
					return i;
				}
			}
			return false;
		},
		lostPlayer: function(i){
			players[i] = null;
			_full--;
			Engine.lostPlayer(i);
		}
	}
})();

var Engine = (function(){
	var state = {},
		positions = ['seeker','beater','chaser','keeper','chaser','beater','chaser'],
		speed=1,
		dimensions = {
						bounds: [440,300], //44m by 30m ellipse
						keepZone: 110, //distance from edge
						playerStart: 78,
						goalLine: 55,
						goals: [127,150,173], //y position along the goal line
						goalHeights: [9,18,14],	//heights, in order
						goalDiam: 10,
						R:[5.2, 3, 2, 1] //Radius of [player,quaffle,bludger,snitch]
						//2.2 shoulder length, 8.3 armspan, 
					};
	
	function reset(){
		var players=[],
			balls=[];
			
					
		//set up players in default positions
		var x=dimensions.playerStart,
			y,
			t=0;
		for (var i=0; i<14; i++){
			if (i>6){
				x=dimensions.bounds[0]-dimensions.playerStart;
				t=1;
			}
			y = 90+20*(i%7);
			players[i] = new Player(positions[i%7],[x,y],[0,0],t,i);
		}
		//set up balls
		x=dimensions.bounds[0]/2;
		for (var i=0; i<5; i++){
			switch(i){
				case 0:
					y=135;
					break;
				case 1:
					y=75;
					break;
				case 2:
					y=165;
					break;
				case 3:
					y=225;
					break;
				case 4:
					y=150;
					break;
			}
			if (i<4){
				balls[i]=new Ball([x,y],[0,0],i);
			} else {
				balls[i] = new Snitch([x,y],[0,0]);
			}
		}
		return {b:balls, p:players};
	}
	
	
	function Player(p,l,v,t,i,o,h,c){
		this.loc = l;
		this.position=p;
		this.velo = v;
		this.team = t;
		this.idx = i;
		this.out= !!o; //undefined sets to false
		this.hold= (typeof h == 'undefined')? 6 : +h;	//6 is not being held
		this.controlled = !!c;
		this.r = dimensions.R[0];
	}
	Player.prototype.inZone = function(){
		if (this.team==1){
			return !!(this.loc[0] > dimensions.bounds[0]-dimensions.keepZone);	
		} else {
			return !!(this.loc[0] < dimensions.keepZone);
		}		
	}
	Player.prototype.atHoops = function(){
		if (this.loc[1] > dimensions.goals[0]-dimensions.goalDiam/2-dimensions.R[0] 
		&& this.loc[1] < dimensions.goals[2]+dimensions.goalDiam/2+dimensions.R[0]){
			if (this.team==1){
				return !!(this.loc[0] > dimensions.bounds[0]-dimensions.goalLine-dimensions.R[0] 
						&& this.loc[0] < dimensions.bounds[0]-dimensions.goalLine+dimensions.R[0]);
			} else {
				return !!(this.loc[0] > dimensions.goalLine-dimensions.R[0]
						&& this.loc[0] < dimensions.goalLine+dimensions.R[0]);
			}
		} else {
			return false;
		}
	}
	function Ball(l,v,i,h,d,t,g){
		this.loc=l;
		this.velo = v;
		this.idx=i;
		this.hold= (typeof h =='undefined')? -1 : +h;
		this.dead= (typeof d =='undefined')? true : !!d;
		this.thrower=(typeof t =='undefined')? -1: +t;
		this.ignore= g || [];
		if (i==1){
			this.r = dimensions.R[1];
		} else {
			this.r = dimensions.R[2];
		}
	}
	function Snitch(l,v){
		this.loc=l;
		this.velo=v;
		this.r = dimensions.R[3];
		this.thrower=-1;
		this.hold=-1;
		this.ignore=[];
	}
	
	function compact(s){
		var e = {b:[],p:[]},
			k;
		for (var i=0, l=s.b.length; i<l; i++){
			k = s.b[i];
			if (i<4){
				e.b.push([k.loc[0],k.loc[1],k.velo[0],k.velo[1],i,+k.hold,+k.dead,+k.thrower]);
				for (var j=0, m=k.ignore.length; j<m; j++){
					e.b[i].push(k.ignore[j])
				}
			} else {
				e.b.push([k.loc[0],k.loc[1],k.velo[0],k.velo[1]])
			}
		}
		for (var i=0, l=s.p.length; i<l; i++){
			k = s.p[i];
			e.p.push([k.loc[0],k.loc[1],k.velo[0],k.velo[1],i,+k.out,+k.hold,+k.controlled]);
		}
		return e;
	}
	
	function bound(x){
		if (x<0){
			return Math.max(-1,x);
		} else {
			return Math.min(1,x);
		}
	}
	function collision(a,b){
		return !!(Math.sqrt(( b.loc[0]-a.loc[0] ) * ( b.loc[0]-a.loc[0] )  + ( b.loc[1]-a.loc[1] ) * ( b.loc[1]-a.loc[1] ) ) <= ( a.r + b.r ));
	}
	function pickup(p,b){
		console.log(p+' picks up '+b);
		state.p[p].hold=b;
		state.b[b].hold=p;
		
		state.b[b].ignore=[];
		state.b[b].dead=true;
		state.b[b].thrower=-1;
	}
	
	function out(p){
		var b = state.p[p].hold;
		state.p[p].out=true;
		
		if (b < 6){
			state.b[b].hold = -1;
			state.b[b].ignore = [];
			state.b[b].thrower = -1;
			state.b[b].dead=true;
			
			state.p[p].hold = 6;
			
		}
	}
	
	
	//			!! clear ignore and thrower on dead
	
	return {
		init: function(){
			state = reset();
		},
		apply: function(i,v){ //input is force changes on object
			if (typeof i === 'number'){
				state.p[i].velo[0] = bound(v[0]);
				state.p[i].velo[1] = bound(v[1]);
			}
		},
		update: function(dt){
			var factor = dt/(1000/60) || 1;
			for (var i=0, l=state.p.length; i<l; i++){
				var player = state.p[i];
				
				//move
				player.loc[0] += speed*factor*player.velo[0];
				player.loc[1] += speed*factor*player.velo[1];
				
				//round
				player.loc[0]= (~~(player.loc[0]*10))/10;
				player.loc[1]= (~~(player.loc[1]*10))/10;
				
				
				if (!player.out && player.controlled){ //ignore balls if you're out or a ghost
					for (var j=0, m=state.b.length-1; j<m; j++){
						var ball = state.b[j],
							chance = Math.random();
							
							
						if (!~ball.hold 							//free ball
						&& collision(ball,player)					//touching it
						&& ball.thrower != i						//didn't throw it
						&& !~ball.ignore.indexOf(i)){				//not being ignored
							if (j==4 									//snitch
							&& i%7==0){	 								//you're a seeker
								//CATCH SNITCH
								
								
								
								
							} else if (j==0 							//quaffle
							&& (i%7 > 1 && i%7 != 5)){ 					//chaser or keeper
								if (ball.dead){							//dead ball
									pickup(i,j);
								} else {								//live ball
									if (i%7==3){						//keeper
										if (player.inZone()){			//in Zone
											if (chance > 0.87){
												//whiff!
												ball.ignore.push(i);
											} else {
												pickup(i,j);
											}
										} else {						//out of zone
											if (!!~ball.thrower 
											&& ~~(ball.thrower/7)==player.team){ //pass
												if (chance < 0.8){
													pickup(i,j);
												} else {
													ball.ignore.push(i);//dropped
												}
											} else {							//intercept
												if (chance < 0.2){ //pick!
													pickup(i,j);
												} else {
													ball.ignore.push(i);//miss
												}
											}
										}
									} else {
										if (!!~ball.thrower 
											&& ~~(ball.thrower/7)==player.team){ //pass
												if (chance < 0.87){
													pickup(i,j);
												} else {
													ball.ignore.push(i);//dropped
												}
											} else {							//intercept
												if (chance < 0.33){ //pick!
													pickup(i,j);
												} else {
													ball.ignore.push(i);//miss
												}
											}
									}
								}
								
								
								
								
							} else if (j>0 && j<4) {					//bludger
								if (ball.dead 							//dead ball
								&& (i%7 == 1 || i%7 == 5 )				//you're a beater
								&& player.hold ==6){					//not already holding a ball
									pickup(i,j);
								} else if (!ball.dead){					//live ball!
									if ((i%7 == 1 || i%7 == 5 )){		//is beater
										
										if (!!~ball.thrower 			//was thrown
										&& ~~(ball.thrower/7)==player.team){//by a teammate
											if (chance < 0.75){		//catch!
												pickup(i,j);
											} else {				//miss!
												ball.ignore.push(i);
											}
										} else {						//thrown by opponent
											if (player.hold < 6){		//you're holding a bludger
												if (chance > 0.85){
													out(i);
												} else {			//deflect!
													ball.ignore.push(i);
													//									!! ricochet
												}
											} else {					//not holding ball
												if (chance < 0.2){	//catch!
													pickup(i,j);
												}else if(chance < 0.5){//hit!
													//									!! ricochet or other ball info
													out(i);
												} else {			//miss
													ball.ignore.push(i);
												}
											}
										}
									} else if (!ball.dead) {			//other position, live ball
										if (i%7==3){					//keeper
											if (player.inZone()){		//in zone
												ball.ignore.push(i);//derp
											} else if (chance < 0.75) {
												out(i);
											} else {  //straight up miss
												ball.ignore.push(i); 
											}
										} else {
											if(chance < 0.75){	//hit you!
												//										!! ricochet or clear ignore for ball, or stop
												out(i);
											} else {
												ball.ignore.push(i);
											}
										}
									}
								}
							}
						}
					}
				}
				
				
				if (player.hold < 6 && state.b[player.hold].hold == i){ //looks like you're holding a ball
					var x = (player.team==0)? player.r : -1*player.r;
					var y = (player.team==0)? state.b[player.hold].r*2 : -1*state.b[player.hold].r*2;
					state.b[player.hold].loc =  [player.loc[0]+x,  player.loc[1]+y];
					state.b[player.hold].velo = [player.velo[0], player.velo[1]];
				}
				
				if (player.out && player.atHoops()){
					player.out=false;
				}					
			}
			return this.getState();
		},
		getState: function(){
			return compact(state);
		},
		pick: function(i){
			return !state.p[i].controlled;
		},
		newPlayer: function(i){
			state.p[i].controlled = true;
		},
		lostPlayer: function(i){
			state.p[i].controlled = false;
			state.p[i].velo =[0,0];
			out(i);
		}
	}
})();


Engine.init();

var dispatch = {};
dispatch.claim = function(i){
	if (Engine.pick(i)&& Game.add(this,i)){
		console.log('new player selected');
		send(this,{t:'ca',d:1}); //a winner is you!
	} else if (Game.full()){
		console.log('full');
		send(this,{t:'ca',d:-1}); //full up, son!
	} else {
		console.log('not him, but not full');
		send(this,{t:'ca',d:0}); //try again, there's room
	}
}
dispatch.v = function(velo){
	var p;
	if ((p=Game.isPlayer(this))!==false){
		Engine.apply(p,velo)
	}
}

io.sockets.on('connection',function(sock){
	/*
	for (var key in sock){
		if (typeof sock[key] == 'function'){
			console.log(key+': fn')
		} else {
			console.log(key+': '+sock[key]);
		}
	}
	*/
	if (Game.full()){
		send(sock,{t:'w',d:'f'});
	} else {
		send(sock,{t:'w',d:'o'});
		sock.on('message',function(d){
			//console.log('recv msg: '+d);
			d = JSON.parse(d);
			if (Object.prototype.hasOwnProperty.call(dispatch,d.t)){
				dispatch[d.t].call(sock,d.d); //set this===sock
			}
		});
	}
	sock.on('disconnect',function(){
		var i = Game.isPlayer(this);
		if (i !== false){
			Game.lostPlayer(i);
		}
	})
});

var past = new Date().getTime(),
	now;
setInterval(function(){
	now = new Date().getTime();
	var dt = now-past;
	Engine.update(dt);
	past = now;
},1000/120);

setInterval(function(){
	io.sockets.volatile.send(JSON.stringify({t:'s',d:Engine.getState()}));
}, 1000/30)