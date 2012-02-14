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

var players = [];

var Engine = function(){
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
		var x=78,
			y,
			t=0;
		for (var i=0; i<14; i++){
			if (i>6){
				x=362;
				t=1;
			}
			y = 90+20*(i%7);
			players[i] = new Player(positions[i%7],[x,y],[0,0],t,i);
		}
		//set up balls
		x=220;
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
	
	state = reset();

	
	
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
		this.dead= !!d;
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
	}
	
	function compact(){
		var e = {b:[],p:[]},
			k;
		for (var i=0, l=state.b.length; i<l; i++){
			k = state.b[i];
			if (i<4){
				e.b.push([k.loc[0],k.loc[1],k.velo[0],k.velo[1],i,+k.hold,+k.dead,+k.thrower]);
				for (var j=0, m=k.ignore.length; j<m; j++){
					e.b[i].push(k.ignore[j])
				}
			} else {
				e.b.push([k.loc[0],k.loc[1],k.velo[0],k.velo[1]])
			}
		}
		for (var i=0, l=state.p.length; i<l; i++){
			k = state.p[i];
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
	
	
	return {
		init: function(){
			var that=this;
			return {
					field: dimensions,
					positions: positions,
					state: that.getState()
				};
		},
		apply: function(input){ //input is force changes on object
			if (typeof self === 'number'){
				state.p[self].velo[0] = bound(input[0]);
				state.p[self].velo[1] = bound(input[1]);
			}
		},
		update: function(){
			for (var i=0, l=state.p.length; i<l; i++){
				//move
				state.p[i].loc[0] += speed*state.p[i].velo[0];
				state.p[i].loc[1] += speed*state.p[i].velo[1];
				
				//round
				state.p[i].loc[0]= (~~(state.p[i].loc[0]*10))/10;
				state.p[i].loc[1]= (~~(state.p[i].loc[1]*10))/10;
				
				
				if (state.p[i].out && state.p[i].atHoops()){
					state.p[i].out=false;
				}					
			}
			return this.getState();
		},
		getState: function(){
			var view = {b:[],p:[]};
			for (var i=0, l=state.p.length; i<l; i++){
				view.p[i] = [state.p[i].loc[0],state.p[i].loc[1],+state.p[i].controlled,+state.p[i].out];
			}
			for (var i=0, l=state.b.length; i<l; i++){
				view.b[i] = [state.b[i].loc[0],state.b[i].loc[1]];
			}
			return view;
		}
	}
}();


io.sockets.on('connection',function(sock){
	
});

io.sockets.on('disconnect',function(sock){

});