(function(){
		var posMap = {c: 'chaser', b:'beater', k: 'keeper', s: 'seeker'},
		ballMap = {q: 'quaffle', s: 'snitch', b:'bludger'},
		game = {},
		quaf,
		snitch,
		bludgers = [],
		players = [],
		me,
		dispatch = {};
	
	
	var Keyboard = function(){
		var key = { 
					arrow:{left: 37, up: 38, right: 39, down: 40 }, 
					wasd: { left: 65, up: 87, right: 68, down: 83}, 
					space: 32, 1: 49, 2: 50, 3:51, 4:52, 5:53, 6:54, 7:55 
				},
			right=0,
			left=0,
			up=0,
			left=0,
			fire=false;
		d3.select(document).on('keydown', function(){
			var e = d3.event,
				prevent=false,
				arrow = key.arrow;
		    switch (e.keyCode){
		    	case arrow.left:
		    		left=1;
		    		prevent=true;
		    		break;
		    	case arrow.right:
		    		right=1;
		    		prevent=true;
		    		break;
		    	case arrow.up:
		    		up=1;
		    		prevent=true;
		    		break;
		    	case arrow.down:
		    		down=1;
		    		prevent=true;
		    		break;
		    	case key.space:
		    		fire=true;
		    		prevent=true;
		    		break;
		    }
		    if (prevent){
		   		e.preventDefault();
		   	}
		});
		d3.select(document).on('keyup',function(){
			var e = d3.event,
				prevent=false,
				arrow = key.arrow;
		    switch (e.keyCode){
		    	case arrow.left:
		    		left=0;
		    		prevent=true;
		    		break;
		    	case arrow.right:
		    		right=0;
		    		prevent=true;
		    		break;
		    	case arrow.up:
		    		up=0;
		    		prevent=true;
		    		break;
		    	case arrow.down:
		    		down=0;
		    		prevent=true;
		    		break;
		    }
		    if (prevent){
		   		e.preventDefault();
		   	}
		});
		return {
			getInputs: function(){
				return [right-left,down-up];
			}
		}
	},
	Touch = function(){
		var tstart,
			tmove,
			tstop,
			lStick = {
				id: -1,
				start: [0,0],
				cur: [0,0]
			};		
		tstart = function(e){
			if (!~lStick.id){
				var width = window.innerWidth || document.documentElement.offsetWidth;
				for (var i=0, l=e.changedTouches.length; i<l; i++){
					if (e.changedTouches[i].clientX <= width/2){
						lStick.id = e.changedTouches[i].identifier;
						lStick.start = [e.changedTouches[i].clientX,e.changedTouches[i].clientY];
						lStick.cur = lStick.start;
						break;
					}
				}
			}

		};
		tmove = function(e){
			if (!!~lStick.id){
				for (var i=0, l=e.changedTouches.length; i<l; i++){
					if (e.changedTouches[i].identifier == lStick.id){
						lStick.cur = [e.changedTouches[i].clientX,e.changedTouches[i].clientY];
						break;
					}
				}
			}
			e.preventDefault();
		};		
		tstop = function(e){
			lStick.id=-1;
			lStick.start =[0,0];
			lStick.cur = lStick.start;
		};
	
		document.addEventListener('touchstart',tstart);
		document.addEventListener('touchmove',tmove);
		document.addEventListener('touchend',tstop);
		document.addEventListener('touchcancel',tstop);
		
		return {
			getInputs: function(){
				if (!~lStick.id){
					return [0,0];
				} else {
					return [lStick.cur[0]-lStick.start[0],lStick.cur[1]-lStick.start[1]];
				}
			}
		}
	},
	InputManager = function(override){
		var manager;
		
		if (typeof override === 'function'){
			manager=override();
		} else if ('ontouchstart' in window){ //touch device
			manager=Touch();
		} else { //let's hope you have a keyboard!
			manager=Keyboard();
		}
		//Interface
		return {
			
			getInputs: function(){ return manager.getInputs(); }//returns [velX,velY] as float between -1 and 1. positive X = right, positive Y = down
		}
	}();
	
	
	
	
	var SVGisCoolforHavingaDOM = function(){
		var svg = d3.select('#game').append('svg').attr('height','99%').attr('width','100%'),
			game = svg.append('g').attr('transform','scale(15)'),
			balls =[],
			players = [];		

		function makeDup(pitchLength,distance){
			if (typeof distance === 'undefined'){
				return function(dist){
					return [0+dist,pitchLength-dist];
				}
			}
			return [0+distance,pitchLength-distance];
		}
		
		return {
			init: function(start){
				var field = start.field,
					state = start.state,
					x = field.bounds[0]/2,
					y = field.bounds[1]/2,
					dup = makeDup(field.bounds[0]);
					zones = dup(field.keepZone),
					starts = dup(field.playerStart),
					glines = dup(field.goalLine),
					hoops = [],
					f = game.append('g').attr('id','field').attr('clip-path','url(#fieldClip)');
				R = field.R;
				for (var i=0, l=field.goals.length; i<l; i++){
					hoops.push({x:glines[0],y:field.goals[i]});
					hoops.push({x:glines[1],y:field.goals[i]});
				}
				ballG = game.append('g').attr('id','balls');
				playG = game.append('g').attr('id','players');
				
				
				//field clipper
				svg.append('defs').append('clipPath')
					.attr('id','fieldClip')
						.append('ellipse').attr('cx',x).attr('rx',x).attr('cy',y).attr('ry',y);
				
				f.append('ellipse').attr('cx',x).attr('rx',x).attr('cy',y).attr('ry',y).attr('class','field');
				f.append('line').classed('mid',true).attr('x1',x).attr('x2',x).attr('y1',0).attr('y2',field.bounds[1]);
				f.append('circle').classed('center',true).attr('cx',x).attr('cy',y).attr('r',0.6);
				
				
				//mirrored lines and goals
				f.selectAll('.zone')
					.data(zones)
					.enter()
					.append('rect')
						.classed('zone',true)
						.classed('team0',function(d,i){ return i==0 })
						.classed('team1',function(d,i){ return i==1 })
						.attr('x',function(d,i){ return ((i)? d : i); })
						.attr('y',0)
						.attr('width',function(d,i){ return field.keepZone })
						.attr('height',field.bounds[0]);	
				f.selectAll('.zoneLine')
					.data(zones)
					.enter()
					.append('line')
						.classed('zoneLine',true)
						.attr('x1',function(d){ return d; })
						.attr('x2',function(d){ return d; })
						.attr('y1',0)
						.attr('y2',field.bounds[0]);
				f.selectAll('.start')
					.data(starts)
					.enter()
					.append('line')
						.classed('start',true)
						.attr('x1',function(d){ return d; })
						.attr('x2',function(d){ return d; })
						.attr('y1',0)
						.attr('y2',field.bounds[0]);
				f.selectAll('.goal')
					.data(glines)
					.enter()
					.append('line')
						.classed('goal',true)
						.attr('x1',function(d){ return d; })
						.attr('x2',function(d){ return d; })
						.attr('y1',0)
						.attr('y2',field.bounds[0]);
				f.selectAll('.hoop')
					.data(hoops)
					.enter()
					.append('ellipse')
						.classed('hoop',true)
						.attr('rx',0.1)
						.attr('ry',field.goalDiam/2)
						.attr('cx',function(d){ return d.x })
						.attr('cy',function(d){ return d.y });
			
			ballG.selectAll('circle')
					.data(state.b)
					.enter()
					.append('circle')
					.attr('r',function(d,i){
						if (i==0){
							return R[1];
						} else if (i<4){
							return R[2];
						} else {
							return R[3];
						}
					})
					.attr('class',function(d,i){
						if (i==0){
							return 'quaffle';
						} else if (i<4){
							return 'bludger';
						} else {
							return 'snitch';
						}
					})
					.attr('cx',function(d){ return d[0] })
					.attr('cy',function(d){ return d[1] });
			
				

			},
			display: function(state){
				
			}
		}
	},
	Renderer = function(override){	//can add Canvas, or HTML+CSS later
		var manager;
		if (typeof override =='function'){
			manager=override();
		} else {
			manager=SVGisCoolforHavingaDOM();
		}
		
		//Interface
		return {
			init: function(field){ return manager.init(field); }, //draw field and initial state
			display: function(state){ return manager.display(state); }
		}
	}();
	
	
	
	var Network = function(){
		var sock,
			dispatch = {};
		if (typeof io !== 'undefined'){
			sock = io.connect('/',{port: 3050});
			sock.on('message',function(d){
				console.log('msg: '+d);
				d = JSON.parse(d);
				if (Object.prototype.hasOwnProperty.call(dispatch,d.t)){
					dispatch[d.t](d.d);
				}
			});
			return {
				connected: true,
				send: function(m){
					sock.send(JSON.stringify(m));
				},
				on: function(evt,cb){
					dispatch[evt] = cb;
					return this;
				}
			}
		} else {
			alert('Gamer server currently down');
			return {
				connected: false,
				send: function(){},
				on: function(){ return this; }
			}
		}
	};
	
	var Engine = function(){
		var defState = {
				b: [
					[22,13.5], //quaffle
					[22,16.5], //bludger
					[22,7.5],
					[22,22.5],
					[22,15] //snitch
				],
				p: {
				}
			},
			curState = {
				
			},
			Ball = function(){
				
			}
		
		function expand(s){
		
		}
		
		return {
			init: function(){
				var that=this;
				this.reset();
				return {
						field: {
							bounds: [44,30], //44m by 30m ellipse
							keepZone: 11, //distance from edge
							playerStart: 7.8,
							goalLine: 5.5,
							goals: [12.7,15,17.3], //y position along the goal line
							goalHeights: [0.9,1.8,1.4],	//heights, in order
							goalDiam: 1,
							R:[0.7, 0.4, 0.3, 0.1] //Radius of [player,quaffle,bludger,snitch]
						},
						state: that.getState()
					};
			},
			reset: function(){ //initial state
				curState = copy(defState);
				return this.getState();
			},
			apply: function(input){ //input is force changes on object
			
			
				return this.getState();	
			},
			setState: function(newState){
				curState = expand(newState);
				return this.getState();
			},
			getState: function(){
				
			}
		}
	}();
	
	var Controller = function(){
		Renderer.init(Engine.init());
		Network = Network();
		Network.on('w',function(d){ //welcome
				if (d=='f'){
					alert('This game is currently full! You can watch until the next game begins, though!')
				} else {
					//can pick
				}
			})
			.on('s',function(d){ //state
				Renderer.display(Engine.setState(d));
			})
			.on('ca',function(d){ //claim answer
			
			})
			.on('np',function(d){ //new player(s)
			
			})
			.on('b',function(d){ //ball action (not movement)
			
			});
		
	
		function loop(){
			var velo = InputManager.getInputs(),
				state = Engine.apply(velo);
			Renderer.display(state);
			window.requestAnimFrame(loop);
		}
		
		return {
			start: function(){
				Renderer.display(Engine.reset());
				loop();
			}
		}
	}();
	
	
	var Player = Class.extend({
		init: function(element,idx){
			this._el = element; //d3 selection
			this._ball = false;
			this._position = element.property('dataset').position;
			this._team = element.property('dataset').team;
			this._out = false;
			this._inZone = true;
			
			element.map(function(d,i){ 
				if(typeof(d)==='undefined'){
					d = {};
				}
				d.idx=idx;
				return d;
			});
		},
		motion: {},
		move: function(pos){
			var p = this._el,
				b = this._ball,
				r = +p.attr('r'),
				dir = (this._team==0)? 1: -1;
								
			p.attr('cx',pos.x).attr('cy',pos.y);
			if (b){
				b = this._ball._el;
				b.attr('cy',pos.y+dir*r*0.8);
				b.attr('cx',pos.x+dir*r*0.8);
			}
			if (this._team == 0){
				if (+pos.x < 11){
					this._inZone = true;
				} else {
					this._inZone = false;
				}
			} else {
				if (+pos.x > 33){
					this._inZone = true;
				} else {
					this._inZone = false;
				}
			}
		},
		travel: function(direction){
			var pos = {x: +this._el.attr('cx'), y: +this._el.attr('cy') },
				newpos = {x: pos.x, y: pos.y},
				p = this._el,
				speed = 0.15,
				arrow = key.arrow,
				b = this._ball;
			direction = +direction;
			
			switch (direction){
				case arrow.up:
					newpos.y -= speed;
					break;
				case arrow.down:
					newpos.y += speed;
					break;
				case arrow.left:
					newpos.x -= speed;
					break;
				case arrow.right:
					newpos.x += speed;
					break;
			}
			this.move(newpos);
		},
		pickup: function(ball){
			var dir = dir = (this._team==0)? 1: -1;
			if (ball._motion !== false){
				clearInterval(ball._motion.intvl)
				ball._motion = false;
			}
			ball._attached = this;
			this._ball = ball;
			var p = this._el;
			ball._el.attr('cy',parseFloat(p.attr('cy'))+dir*parseFloat(p.attr('r'))*0.8)
			ball._el.attr('cx',parseFloat(p.attr('cx'))+dir*parseFloat(p.attr('r'))*0.8)
		},
		toss: function(x, y){
			var ball = this._ball;
			this._ball = false;
			ball.toss(this,x,y);
		},
		hit:  function(){
			var t = this;
			this._out = true;
			t._el.attr('class',t._el.attr('class') + ' out');
			if (this._ball !== false){
				this._ball._attached = false;
				this._ball = false;
			}
			var flashOn = false,
				flashTime = setInterval(function(){
					flashOn = !flashOn;
					t._el.classed('flash',flashOn)
				},100);
			setTimeout(function(){ clearInterval(flashTime); t._el.classed('flash',false); },600);
			setTimeout(function(){ t._el.classed('out',false); t._out=false;  },6000);
		}
	}),
	Ball = Class.extend({
		init: function(elm){
			this._attached = false;
			this._el = elm;
			this._motion=false;
		},
		attached: function(){
			return this._attached;
		},
		toss: function(from, x, y){
			var thisBall = this,
				time = 150,
				dir = dir = (from._team==0)? 1: -1,
				fps = 1000/60
				n = { x: (x || dir*~~(Math.random()*6)+2), y: (y || ~~(Math.random()*4)-2)},
				current = { x: +this._el.attr('cx'), y: +this._el.attr('cy')},
				start = { x: current.x+dir*2*parseInt(this._el.attr('r'))+n.x*0.2, y: current.y+n.y*0.1 },
				val = { x: current.x+n.x*1.2, y: current.y+n.y },
				iters = time/fps,
				i=1,
				step = { x: Math.abs(val.x-start.x)/iters, y: (val.y-start.y)/iters};
				console.log(current);
				console.log(start);
				console.log(val);
				console.log(step);
			if (from==me){
				send({t:'toss', 
						   d: {id: from._el.property('dataset').uid, x: n.x, y:n.y }});
			}
			this._attached = false;
			thisBall._el.attr('cx',start.x).attr('cy',start.y);
			this._motion = {intvl: setInterval(function(){ thisBall._el.attr('cx',start.x+dir*i*step.x).attr('cy',start.y+(i++)*step.y);  },fps),
							from: from} ;
			setTimeout(function(){ clearInterval(thisBall._motion.intvl); thisBall._motion=false;  },time);
		}
		
	}),
	Quaffle = Ball.extend({
	
	}),
	Bludger = Ball.extend({
	
	}),
	Snitch = Class.extend({
		init: function(element){
			this._el = element;
		}
	})
	
	function collision(el1,el2){
		var x1 = +el1._el.attr('cx'),
			x2 = +el2._el.attr('cx'),
			y1 = +el1._el.attr('cy'),
			y2 = +el2._el.attr('cy'),
			r1 = +el1._el.attr('r'),
			r2 = +el2._el.attr('r');
		return !!(Math.sqrt(( x2-x1 ) * ( x2-x1 )  + ( y2-y1 ) * ( y2-y1 ) ) <= ( r1 + r2 ));
	}
	function newPlayer(p){
		console.log('new player! ' +JSON.stringify(p));
		var el = d3.select('.team'+p.t+' .'+posMap[p.p]+':eq('+p.i+'):not(.controlled)'); //select only selects first match (versus selectAll)
		el.classed('controlled',true)//.property('dataset').uid = p.id;
	}
	function playerById(id){
		return players[d3.selectAll('.player').filter(function(d,i){ return (this.dataset.uid == id); })[0][0].__data__.idx];
	}
	function getIndex(el,selector){
		var idx=null;
		d3.selectAll(selector).each(function(d,i){
			if (el==this){
				idx=i;
				return;
			}
		});
		return idx;
	}
	
		var t0 = new Date();
	function moveLoop(){
			//var t1 = new Date(),
			//	obs = ~~(1000/(t1-t0));
			//t0 = t1;
			
			
			/*
				PLAYER MOTION
			*/
			var cur = { x: +me._el.attr('cx'), y: +me._el.attr('cy') },
				position = '.'+me._el.property('dataset').position.toLowerCase();
			if (position == '.keeper' || position == '.chaser'){
				position = '.keeper:not(.me):not(.out), .chaser'
			}
			var collidables = d3.selectAll(position+':not(.me):not(.out)');	
			for (var direction in me.motion){
				if (me.motion[direction]){							
					me.travel(direction);
				}
			}
			for (var i=0, l=collidables[0].length; i<l; i++){
				if (collision(me,{_el: d3.select(collidables[0][i])})){
					me._el.attr('cx',cur.x).attr('cy',cur.y);
					break;
				}
			}
			if (+me._el.attr('cx') != cur.x || +me._el.attr('cy') != cur.y){
				var x, y, id;
				
				send({t:'move', 
						   d: {x:+me._el.attr('cx'), y:+me._el.attr('cy'), id:me._el.property('dataset').uid }});
				if (me._ball !== false){
					var el = me._ball._el,
						cl = el.attr('class'),
						idx = getIndex(el[0][0],'.'+cl);
					send({t:'ballmove', 
							   d: {b: cl.charAt(0), i: idx, x:el.attr('cx'), y:el.attr('cy')  }});
				}
			}
			
			
			for (var i=0, l=players.length; i<l; i++){
			
			
				/*
					BLUDGER SECTION
					and KNOCKOUT LOGIC
				*/
				for (var j=0, m=bludgers.length; j<m; j++){
					if (bludgers[j]._motion !== false 							//"active"/"in the air"
					&& bludgers[j]._motion.from._team !== players[i]._team //no friendly fire
					&& players[i]._out === false							//you're still in
					&& collision(players[i],bludgers[j])){ 					//and it hit you
						if (players[i]._position == 'beater'){ //you're a beater
							if (players[i]._ball !== false){ // you already have a ball
								//gamble deflection
								players[i].hit();
							} else {
								(Math.random() < .8) ? players[i].hit() : players[i].pickup(bludgers[j]); //gamble catch
							}
						} else if (players[i]._position == 'keeper' && players[i]._inZone===true){
							//safe
						} else { //you're definitely hit
							players[i].hit();
						}
						break; //exits bludger loop
					} else if ( bludgers[j].attached() === false  //nobody has it
								&& players[i]._position=='beater' //position can use it
								&& bludgers[j]._motion === false  //sitting on the ground
								&& players[i]._ball ===false      //don't have a ball already
								&& players[i]._out === false	  //you're not out
								&& collision(players[i],bludgers[j])){ //and you're touching it 
						players[i].pickup(bludgers[j]);
					}
				}
				
				/*
					QUAFFLE TIME
				*/
				if (players[i]._ball===false  //not holding a ball
				&& (players[i]._position == 'chaser' //chaser or
				  || players[i]._position=='keeper') //keeper
				&& quaf.attached()===false			// open quaffle
				&& players[i]._out === false 		//not out
				&& collision(players[i],quaf)){		//touching the ball 
					if (quaf._motion !== false){	//gamble catch
						var chance = (players[i]._position=='keeper' ? 0.3 : 0.2); //keeper has better hands
						if (quaf._motion.from._team == players[i]._team){ //passes more accurate
							chance += 0.1;
						}
						(Math.random() < chance ) ? players[i].pickup(quaf) : null;
					} else {
						players[i].pickup(quaf);
					}
				}
				
				
				
				/*
					SNITCHY
				*/
				if (players[i]._position=='seeker'
				&& players[i]._out ===false
				&& collision(players[i],snitch)){
					alert('YOU WIN');
					game =false;
				}
				
				
			}
		if (game){
			window.requestAnimFrame(moveLoop);
		}
	}
	
	
	
	function init(){
		d3.selectAll('.player:not(.controlled)').on('click',function(){
			var el = d3.select(this),
				data = el.property('dataset');
			d3.selectAll('.player:not(.controlled)').on('click',false);
			if (typeof io !=='undefined'){
				var m = {
						p:data.position.charAt(0),
						t:data.team,
						i:getIndex(el[0][0],'.team'+data.team+' .'+data.position)
					};
				send({t: 'claim', d: m});
			} else {
				run(el); //play around with it when the server's down
			}
		})
	}
	function run(el){
		me = players[el[0][0].__data__.idx];
		el.classed('me',true);
		
		moveLoop();
	}
	



	quaf = new Quaffle(d3.select('.quaffle'));
	snitch = new Snitch(d3.select('.snitch'));
	d3.selectAll('.bludger').each(function(){
		bludgers.push(new Bludger(d3.select(this)));
	});
	d3.selectAll('.player').each(function(d,i){
		players.push(new Player(d3.select(this),i));
	})
	
	

	dispatch.ca = function(d){ //claim answer
		if (d.a==1){
			console.log('.team'+d.t+' .'+posMap[d.p]+':eq('+d.i+')');
			run(d3.select('.team'+d.t+' .'+posMap[d.p]+':eq('+d.i+')'));
		} else if (d.a==0){
			alert('Woops! that position is taken, please pick again');
			init();
		} else {
			this.w('f');
		}
	};
	dispatch.np = function(d){ //new player
		var el;
		for (var i=0, l=d.length; i<l; i++){
			newPlayer(d[i]);
		}
	};
	dispatch.mv = function(d){ //move
		d3.select('.team'+d.t+' .'+posMap[d.p]+':eq('+d.i+')').attr('cx',d.x).attr('cy',d.y);
		//playerById(d.id).move(d);
	};
	dispatch.t = function(d){ //throw
		var p = playerById(d.id);
		if (p !== false){
			p.toss(d.x,d.y);
		}
	};
	dispatch.bmv = function(d){
		d3.selectAll('.'+ballMap[d.b]+':eq('+d.i+')').attr('cx',d.x).attr('cy',d.y);
	};
	
})();