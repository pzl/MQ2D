var Engine = (function(){
	var state = {},
		positions = ['seeker','beater','chaser','keeper','chaser','beater','chaser'],
		speed=1,
		self,
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
	}

	
	//unpack from network transport
	function expand(s){
		var e = {b:[], p:[]},
			b = s.b,
			p = s.p,
			t=0,
			k=[],
			g=[];
		
		
		for (var i=0, l=b.length; i<l; i++){
			k = b[i];
			g=[];
			if (i<4){
				if (k.length > 8){
					for (var j=8, m=k.length; j<m; j++){
						g.push(k[j]);
					}
				}
				e.b[i] = new Ball([k[0],k[1]],[k[2],k[3]],i,k[5],k[6],k[7],g)
			} else {
				e.b[i] = new Snitch([k[0],k[1]],[k[2],k[3]]);
			}
		}
		for (var i=0, l=p.length; i<l; i++){
			k = p[i];
			if (i>6){
				t=1;
			}
			e.p[i] = new Player(positions[i%7],[k[0],k[1]],[k[2],k[3]],t,i,k[5],k[6],k[7]);
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
			state = reset();
			return {
					field: dimensions,
					positions: positions,
					state: that.getState()
				};
		},
		apply: function(input){ //input is force changes on object
			if (typeof self === 'number'){
				state.p[self].velo = [bound(input[0]),bound(input[1])];
				
				if (state.p[self].hold < 6){
					state.b[state.p[self].hold].velo = [state.p[self].velo[0],state.p[self].velo[1]];
				}
			}
		},
		update: function(dt){
			var factor = dt/(1000/60) || 1;
			for (var i=0, l=state.p.length; i<l; i++){
				if (state.p[i].velo[0] || state.p[i].velo[1]){
					//move
					state.p[i].loc[0] += speed*factor*state.p[i].velo[0];
					state.p[i].loc[1] += speed*factor*state.p[i].velo[1];
					
					//round
					state.p[i].loc[0]= (~~(state.p[i].loc[0]*10))/10;
					state.p[i].loc[1]= (~~(state.p[i].loc[1]*10))/10;
					
					if (state.p[i].hold < 6){
						state.b[state.p[i].hold].velo = [state.p[i].velo[0],state.p[i].velo[1]];
					}
					
					if (state.p[i].out && state.p[i].atHoops()){
						state.p[i].out=false;
					}
				}					
			}
			for (var i=0, l=state.b.length; i<l; i++){
				if (state.b[i].velo[0] || state.b[i].velo[1]){
					//move
					state.b[i].loc[0] += speed*factor*state.b[i].velo[0];
					state.b[i].loc[1] += speed*factor*state.b[i].velo[1];
				}					
			}
			window.state = state;
			return this.getState();
		},
		setState: function(newState){
			state = expand(newState);
			return this.getState();
		},
		getState: function(){
			var view = {b:[],p:[]};
			for (var i=0, l=state.p.length; i<l; i++){
				view.p[i] = [state.p[i].loc[0],state.p[i].loc[1],+state.p[i].controlled,+state.p[i].out];
			}
			for (var i=0, l=state.b.length; i<l; i++){
				view.b[i] = [state.b[i].loc[0],state.b[i].loc[1],state.b[i].hold,+state.b[i].dead];
			}
			return view;
		},
		playerSelect: function (x,y){
			for (var i=0, l=state.p.length; i<l; i++){
				if (!state.p[i].controlled && collision(state.p[i],{loc:[x,y], r:dimensions.R[0]})){
					return i;
				}
			}
			return false;
		},
		assign: function(i){
			self =i;
			state.p[self].controlled=true;
		}
	}
})();