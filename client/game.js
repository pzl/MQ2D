(function(){
	var key = { 
					arrow:{left: 37, up: 38, right: 39, down: 40 }, 
					wasd: { left: 65, up: 87, right: 68, down: 83}, 
					space: 32, 1: 49, 2: 50, 3:51, 4:52, 5:53, 6:54, 7:55 
				},
		posMap = {c: 'chaser', b:'beater', k: 'keeper', s: 'seeker'},
		ballMap = {q: 'quaffle', s: 'snitch', b:'bludger'},
		sock,
		game = {},
		quaf,
		snitch,
		bludgers = [],
		players = [],
		me,
		dispatch = {};
		
	
	function send(msg){
		sock.send(JSON.stringify(msg));
	}
	
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
		
		d3.select(document).on('keydown', function(){
			var e = d3.event,
				arrow = key.arrow;
		    switch (e.keyCode){
		    	case arrow.left:
		    	case arrow.right:
		    	case arrow.up:
		    	case arrow.down:
		    		if (!me.motion[e.keyCode]){
		    			me.motion[e.keyCode] = true;
		    		}
		    		return false;
		    	case key.space:
		    		return false;
		    	default:
		    		return true;
		    }
		});
		d3.select(document).on('keyup',function(){
			var e = d3.event,
				arrow = key.arrow;
			 switch (e.keyCode){
		    	case arrow.left:
		    	case arrow.right:
		    	case arrow.up:
		    	case arrow.down:
		    		me.motion[e.keyCode] = false;
		    		return false;
		    	case key.space:
		    		if (me._ball !== false && me._ball.attached() !== false){
		    			me.toss();
		    		}
		    		return false;
		    	default:
		    		return true;
		    }
		});
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
		
	
	
	if (typeof io === 'undefined'){
		alert('Game server currently down :[   Sorry!');
		sock = { send: function(){} }; //server's down, we know, just swallow further errors
		init();
	} else {
		sock = io.connect('/',{port: 3050});
		sock.on('message',function(d){
			d = JSON.parse(d);
			console.log('msg: '+JSON.stringify(d));
			if (Object.prototype.hasOwnProperty.call(dispatch,d.t)){
				dispatch[d.t](d.d);
			}
		});
	}
	
	
	dispatch.w = function(d){ //welcome
		if (d=='f'){
			alert('all positions have been chosen, please wait for an open match');
		} else {
			init();
		}
	};
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