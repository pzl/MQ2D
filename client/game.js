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
			down=0,
			API = {},
			shootCB;
		d3.select(document).on('keydown', function(){
			var e = d3.event,
				prevent=false;
		    switch (e.keyCode){
		    	case key.arrow.left:
		    	case key.wasd.left:
		    		left=1;
		    		prevent=true;
		    		break;
		    	case key.arrow.right:
		    	case key.wasd.right:
		    		right=1;
		    		prevent=true;
		    		break;
		    	case key.arrow.up:
		    	case key.wasd.up:
		    		up=1;
		    		prevent=true;
		    		break;
		    	case key.arrow.down:
		    	case key.wasd.down:
		    		down=1;
		    		prevent=true;
		    		break;
		    	case key.space:
		    		if (typeof shootCB == 'function'){
		    			shootCB();
		    		}
		    		prevent=true;
		    		break;
		    }
		    if (prevent){
		   		e.preventDefault();
		   	}
		});
		d3.select(document).on('keyup',function(){
			var e = d3.event,
				prevent=false;
		    switch (e.keyCode){
		    	case key.arrow.left:
		    	case key.wasd.left:
		    		left=0;
		    		prevent=true;
		    		break;
		    	case key.arrow.right:
		    	case key.wasd.right:
		    		right=0;
		    		prevent=true;
		    		break;
		    	case key.arrow.up:
		    	case key.wasd.up:
		    		up=0;
		    		prevent=true;
		    		break;
		    	case key.arrow.down:
		    	case key.wasd.down:
		    		down=0;
		    		prevent=true;
		    		break;
		    }
		    if (prevent){
		   		e.preventDefault();
		   	}
		});
		API = {
			getInputs: function(){
				return [right-left,down-up];
			},
			onPickPlayer: function(cb){
				d3.select(document).on('mousedown',function(){
					if (typeof cb == 'function'){
						cb(d3.event.x,d3.event.y);
					}
					d3.event.preventDefault();
				})	
			},
			shoot: function(cb){
				shootCB = cb;
			}
		}
		return API;
	},
	Touch = function(){
		var API = {},
			tstart,
			tmove,
			tstop,
			canvas,
			c,
			shootCB,
			pickCB,
			lStick = {
				id: -1,
				start: [0,0],
				cur: [0,0]
			},
			rStick = {
				id: -1,
				start: [0,0],
				cur: [0,0]
			};

			var container = document.createElement( 'div' ),
				canvas = document.createElement( 'canvas' ),
				c = canvas.getContext( '2d' ),
				moveColor = 'cyan',
				fireColor = '#FF3938';
			container.className = "joysticks";
			document.body.appendChild( container );
			container.appendChild(canvas);	
		
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		
			c.strokeStyle = moveColor;
			c.lineWidth =2;
			function circle(x,y,r,color){
				c.strokeStyle = color;
				c.beginPath();
				c.arc(x,y,r,0,Math.PI*2);
				c.stroke();
			}
			function clear(){
				c.clearRect(0,0,canvas.width,canvas.height);
			}
		tstart = function(e){
			var width = window.innerWidth;
			clear();
			for (var i=0, l=e.changedTouches.length; i<l; i++){
				if (typeof pickCB == 'function'){
					pickCB(e.changedTouches[i].clientX,e.changedTouches[i].clientY);
				}
			
				if (!~lStick.id && e.changedTouches[i].clientX <= width/2){
					lStick.id = e.changedTouches[i].identifier;
					lStick.start = [e.changedTouches[i].clientX,e.changedTouches[i].clientY];
					lStick.cur = lStick.start;
					circle(lStick.start[0],lStick.start[1],30,moveColor);
					circle(lStick.start[0],lStick.start[1],40,moveColor);
					continue;
				} else if (!~rStick.id &&  e.changedTouches[i].clientX >= width/2){
					rStick.id = e.changedTouches[i].identifier;
					rStick.start = [e.changedTouches[i].clientX,e.changedTouches[i].clientY];
					rStick.cur = rStick.start;
					circle(rStick.start[0],rStick.start[1],30,fireColor);
					circle(rStick.start[0],rStick.start[1],40,fireColor);
					continue;
				}
			}
		};
		tmove = function(e){
			clear();
			for (var i=0, l=e.changedTouches.length; i<l; i++){
				if (!!~lStick.id && e.changedTouches[i].identifier == lStick.id){
					lStick.cur = [e.changedTouches[i].clientX,e.changedTouches[i].clientY];
					circle(lStick.start[0],lStick.start[1],30,moveColor);
					circle(lStick.start[0],lStick.start[1],40,moveColor);
					circle(lStick.cur[0],  lStick.cur[1],  30,moveColor);
					continue;
				} else if (!!~rStick.id && e.changedTouches[i].identifier == rStick.id){
					rStick.cur = [e.changedTouches[i].clientX,e.changedTouches[i].clientY];
					circle(rStick.start[0],rStick.start[1],30,fireColor);
					circle(rStick.start[0],rStick.start[1],40,fireColor);
					circle(rStick.cur[0],  rStick.cur[1],  30,fireColor);
					continue;
				}
			}
			e.preventDefault();
		};		
		tstop = function(e){
			for (var i=0, l=e.changedTouches.length; i<l; i++){
				if (e.changedTouches[i].identifier == lStick.id){
					lStick.id=-1;
					lStick.start =[0,0];
					lStick.cur = lStick.start;
					continue;
				} else if (e.changedTouches[i].identifier == rStick.id){
					if (typeof shootCB == 'function'){
						shootCB((rStick.cur[0]-rStick.start[0])*0.1,(rStick.cur[1]-rStick.start[1])*0.1);
					}
					rStick.id=-1;
					rStick.start =[0,0];
					rStick.cur = rStick.start;
					continue;
				}
			}
			clear(0,window.innerWidth);
		};
	
		document.addEventListener('touchstart',tstart);
		document.addEventListener('touchmove',tmove);
		document.addEventListener('touchend',tstop);
		document.addEventListener('touchcancel',tstop);
		
		API = {
			getInputs: function(){
				if (!~lStick.id){
					return [0,0];
				} else {
					return [(lStick.cur[0]-lStick.start[0])*0.1,(lStick.cur[1]-lStick.start[1])*0.1];
				}
			},
			onPickPlayer: function(cb){
				pickCB = cb;
			},
			onShoot: function(cb){
				shootCB = cb;
			}
		};
		
		return API;
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
			getInputs: function(){ return manager.getInputs(); },//returns [velX,velY] as float between -1 and 1. positive X = right, positive Y = down
			onShoot: function(cb){ return manager.onShoot(cb); },
			onPickPlayer: function(cb,scale) { return manager.onPickPlayer(cb,scale); }
		}
	}();
	
	
	
	
	var SVGisCoolforHavingaDOM = function(scale){	
		var svg = d3.select('#game').append('svg').attr('height','99%').attr('width','100%'),
			game = svg.append('g').attr('transform','scale('+scale+')'),
			ballG,
			playG,
			R;	

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
					pos = start.positions,
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
				f.append('circle').classed('center',true).attr('cx',x).attr('cy',y).attr('r',6);
				
				
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
						.attr('rx',1)
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
			
				playG.selectAll('.player')
					.data(state.p)
					.enter()
					.append('circle')
						.attr('class',function(d,i){ 
							return pos[i%7] + ' team'+(+(i>6)) + ' ' + ((d.controlled) ? 'controlled' : '') ; 
						})
						.classed('player',true)
						.map(function(d,i){ d[2] = parseInt(i>6,10); return d; })
						.attr('r',R[0])
						.attr('cx',function(d,i){ return d[0] })
						.attr('cy',function(d,i){ return d[1] });

			},
			display: function(state){
				playG.selectAll('.player')
					.data(state.p)
					.attr('cx',function(d){ return d[0]; })
					.attr('cy',function(d){ return d[1]; })
					.classed('controlled',function(d,i){
							return !!d[2];
					})
					.classed('out',function(d,i){
						return !!d[3];
					});
				
				ballG.selectAll('circle')
					.data(state.b)
					.attr('cx',function(d){ return d[0] })
					.attr('cy',function(d){ return d[1] });
			},
			destroy: function(){
				d3.select('svg').remove();
			}
		}
	},
	CanvasIsFasterThough = function(scale){
		var container = document.getElementById('game'),
			canvas = document.createElement( 'canvas' ),
			c = canvas.getContext( '2d' ),
			buffer = document.createElement('canvas'),   //draw off screen, then copy result
			b = buffer.getContext('2d'), 
			pos,
			posMap = {seeker:'gold',chaser:'white',beater:'black',keeper:'lime'},
			R=[],										//radii of objects
			box=[];										//active bounding box
		container.appendChild(canvas);	
		
	
		canvas.width = window.innerWidth; 
		canvas.height = window.innerHeight;
		buffer.width = canvas.width;
		buffer.height=canvas.height;
		canvas.id='movement';
		
		b.scale(scale,scale);
		var CP = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
		if(CP && CP.lineTo) CP.dashedLine = function(x, y, x2, y2, dashArray){
		    if(! dashArray) dashArray=[10,5];
		    var dashCount = dashArray.length,
		    	dx = (x2 - x),
		    	dy = (y2 - y),
		    	xSlope = (Math.abs(dx) > Math.abs(dy)),
		    	slope = (xSlope) ? dy / dx : dx / dy;
		
		    this.moveTo(x, y);
		    var distRemaining = Math.sqrt(dx * dx + dy * dy),
		    	dashIndex = 0;
		    while(distRemaining >= 0.1){
		        var dashLength = Math.min(distRemaining, dashArray[dashIndex % dashCount]);
		        var step = Math.sqrt(dashLength * dashLength / (1 + slope * slope));
		        if(xSlope){
		            if(dx < 0) step = -step;
		            x += step
		            y += slope * step;
		        }else{
		            if(dy < 0) step = -step;
		            x += slope * step;
		            y += step;
		        }
		        this[(dashIndex % 2 == 0) ? 'lineTo' : 'moveTo'](x, y);
		        distRemaining -= dashLength;
		        dashIndex++;
		    }
		}								
		

		return {
			init: function(start){
				var pitch = document.createElement('canvas'),
					ctx = pitch.getContext('2d'),
					field = start.field,
					state = start.state,
					x = field.bounds[0]/2,
					y = field.bounds[1]/2;	
				pos=start.positions;
				R=field.R;
				
				
				
				pitch.width= window.innerWidth;
				pitch.height=window.innerHeight;
				pitch.id='pitch';
				container.appendChild(pitch);
				
				
				ctx.scale(scale,scale);
				ctx.fillStyle='#6ac06e';
				ctx.strokeStyle='white';

				//field
				ctx.save()
				ctx.scale((field.bounds[0]/field.bounds[1]),1);
				ctx.moveTo(0,0);
				ctx.beginPath();
				ctx.arc(y,y,y,0,Math.PI*2,true);
				ctx.fill();
				ctx.restore();
				
				
				ctx.globalCompositeOperation = 'source-atop';

				
				//midlines
				ctx.beginPath();
				ctx.lineWidth = 1.3;
				ctx.moveTo(x,0);
				ctx.lineTo(x,field.bounds[1]);
				ctx.closePath();
				ctx.stroke();
				
				ctx.beginPath();
				ctx.lineWidth=1;
				ctx.arc(x,y,6,0,Math.PI*2,true);
				ctx.closePath();
				ctx.fill();
				ctx.stroke();
					
				
				//keeper zones
				ctx.fillStyle='rgba(255,0,0,0.15)';
				ctx.fillRect(0,0,field.keepZone,field.bounds[1]);
				ctx.fillStyle='rgba(0,0,255,0.15)';
				ctx.fillRect(field.bounds[0]-field.keepZone,0,field.keepZone,field.bounds[1]);		
				
				
				//keeper lines
				ctx.beginPath();
				ctx.lineWidth=0.9;
				ctx.dashedLine(field.keepZone,0,field.keepZone,field.bounds[1]);
				ctx.closePath();
				ctx.stroke();
				
				ctx.beginPath();
				ctx.dashedLine(field.bounds[0]-field.keepZone,0,field.bounds[0]-field.keepZone,field.bounds[1]);
				ctx.closePath();
				ctx.stroke();
				
				//goal lines
				ctx.globalAlpha=0.8;
				ctx.beginPath();
				ctx.lineWidth=0.8;
				ctx.moveTo(field.goalLine,0);
				ctx.lineTo(field.goalLine,field.bounds[1]);
				ctx.closePath();
				ctx.stroke();
				
				ctx.beginPath();
				ctx.lineWidth=0.8;
				ctx.moveTo(field.bounds[0]-field.goalLine,0);
				ctx.lineTo(field.bounds[0]-field.goalLine,field.bounds[1]);
				ctx.closePath();
				ctx.stroke();
				ctx.globalAlpha=1;
				
				
				
				//start lines
				ctx.beginPath();
				ctx.lineWidth=0.3;
				ctx.dashedLine(field.playerStart,0,field.playerStart,field.bounds[1],[4,2]);
				ctx.closePath();
				ctx.stroke();
				
				ctx.beginPath();
				ctx.dashedLine(field.bounds[0]-field.playerStart,0,field.bounds[0]-field.playerStart,field.bounds[1],[4,2]);
				ctx.closePath();
				ctx.stroke();

				
				//hoops
				var bow = 2,
					r = field.goalDiam/2;
				ctx.lineWidth=1;
				ctx.strokeStyle='black';
				for (var i=0, l=field.goals.length; i<l; i++){
					ctx.beginPath();
					ctx.moveTo(field.goalLine,field.goals[i]+r)
					ctx.quadraticCurveTo(field.goalLine+bow,field.goals[i],field.goalLine,field.goals[i]-r);
					ctx.quadraticCurveTo(field.goalLine-bow,field.goals[i],field.goalLine,field.goals[i]+r);
					ctx.stroke();
					
					ctx.beginPath();
					ctx.moveTo(field.bounds[0]-field.goalLine,field.goals[i]+r)
					ctx.quadraticCurveTo(field.bounds[0]-field.goalLine+bow,field.goals[i],field.bounds[0]-field.goalLine,field.goals[i]-r);
					ctx.quadraticCurveTo(field.bounds[0]-field.goalLine-bow,field.goals[i],field.bounds[0]-field.goalLine,field.goals[i]+r);
					ctx.stroke();
				}
				
				box=[0,0,field.bounds[0],field.bounds[1]];

			},
			display: function(state){
				var xmin=0,ymin=0,xmax=0,ymax=0;
				b.clearRect(box[0],box[1],box[2]-box[0],box[3]-box[1]);
				c.clearRect(box[0],box[1],box[2]-box[0],box[3]-box[1]);
				
				//players
				b.lineWidth = 2;
				b.fillStyle='red';
				
				var temp;
				for (var i=0, l=state.p.length; i<l; i++){
					if (i>6){
						b.fillStyle='blue';
					} else {
						b.fillStyle='red';
					}
					if (!state.p[i][2]){
						b.fillStyle='#505050';
					}
					b.globalAlpha = (state.p[i][2]) ? ((state.p[i][3]) ? 0.3 : 1 ) : 0.5;
					b.strokeStyle = posMap[pos[i%7]];
					b.beginPath();
					b.arc(state.p[i][0],state.p[i][1],R[0],0,Math.PI*2);
					b.closePath();
					b.stroke();
					b.fill();
					
					xmin = ((state.p[i][0]-R[0]-2) < xmin) ? (state.p[i][0]-R[0]-2) : xmin;
					xmax = ((state.p[i][0]+R[0]+2) > xmax) ? (state.p[i][0]+R[0]+2) : xmax;
					ymax = ((state.p[i][1]+R[0]+2) > ymax) ? (state.p[i][1]+R[0]+2) : ymax;
					ymin = ((state.p[i][1]-R[0]-2) < ymin) ? (state.p[i][1]-R[0]-2) : ymin;
				}
				b.globalAlpha=1;
				
				//balls
				b.fillStyle='white';
				b.strokeStyle='black';
				b.beginPath();
				b.arc(state.b[0][0],state.b[0][1],R[1],0,Math.PI*2);
				b.closePath();
				b.stroke();
				b.fill();
				xmin = ((state.b[0][0]-R[1]-2) < xmin) ? (state.b[0][0]-R[1]-2) : xmin;
				xmax = ((state.b[0][0]+R[1]+2) > xmax) ? (state.b[0][0]+R[1]+2) : xmax;
				ymax = ((state.b[0][1]+R[1]+2) > ymax) ? (state.b[0][1]+R[1]+2) : ymax;
				ymin = ((state.b[0][1]-R[1]-2) < ymin) ? (state.b[0][1]-R[1]-2) : ymin;
				
				b.fillStyle='black';
				for (var i=1, l=state.b.length-1; i<l; i++){
					b.beginPath();
					b.arc(state.b[i][0],state.b[i][1],R[2],0,Math.PI*2);
					b.closePath();
					b.fill();
					xmin = ((state.b[i][0]-R[2]) < xmin) ? (state.b[i][0]-R[2]) : xmin;
					xmax = ((state.b[i][0]+R[2]) > xmax) ? (state.b[i][0]+R[2]) : xmax;
					ymax = ((state.b[i][1]+R[2]) > ymax) ? (state.b[i][1]+R[2]) : ymax;
					ymin = ((state.b[i][1]-R[2]) < ymin) ? (state.b[i][1]-R[2]) : ymin;
				}
				
				b.fillStyle='gold';
				b.beginPath();
				b.arc(state.b[4][0],state.b[4][1],R[3],0,Math.PI*2);
				b.closePath();
				b.fill();
				c.drawImage(buffer,0,0);
				xmin = ((state.b[4][0]-R[3]) < xmin) ? (state.b[4][0]-R[3]) : xmin;
				xmax = ((state.b[4][0]+R[3]) > xmax) ? (state.b[4][0]+R[3]) : xmax;
				ymax = ((state.b[4][1]+R[3]) > ymax) ? (state.b[4][1]+R[3]) : ymax;
				ymin = ((state.b[4][1]-R[3]) < ymin) ? (state.b[4][1]-R[3]) : ymin;
				
				xmin = Math.max(~~xmin,0);
				ymin = Math.max(~~ymin,0);
				xmax = Math.min(~~xmax,window.innerWidth);
				ymax = Math.min(~~ymax,window.innerHeight);
				
				box = [xmin*scale,ymin*scale,xmax*scale,ymax*scale];
			},
			destroy: function(){
				container.removeChild(canvas);
				container.removeChild(buffer);
			}
		}	
	},
	WebGLForFunsies = function(scale){
		var API = {},
			width = window.innerWidth,
			height = window.innerHeight,
			aspect = width/height,
			angle=45,
			near = 0.1,
			far = 10000,
			container = document.getElementById('game'),
			renderer = new THREE.WebGLRenderer({antialias:true}),
			camera = new THREE.PerspectiveCamera(angle,aspect,near,far),
			scene = new THREE.Scene();
		
		
		renderer.setSize(width,height);
		renderer.domElement.id='THREE';
		container.appendChild(renderer.domElement);
		
		var debugaxis = function(axisLength){
		    //Shorten the vertex function
		    function v(x,y,z){ 
		            return new THREE.Vertex(new THREE.Vector3(x,y,z)); 
		    }
		    
		    //Create axis (point1, point2, colour)
		    function createAxis(p1, p2, color){
		            var line, lineGeometry = new THREE.Geometry(),
		            lineMat = new THREE.LineBasicMaterial({color: color, linewidth: 1});
		            lineGeometry.vertices.push(p1, p2);
		            line = new THREE.Line(lineGeometry, lineMat);
		            scene.add(line);
		    }
		    
		    createAxis(v(-axisLength, 0, 0), v(axisLength, 0, 0), 0xFF0000);
		    createAxis(v(0, -axisLength, 0), v(0, axisLength, 0), 0x00FF00);
		    createAxis(v(0, 0, -axisLength), v(0, 0, axisLength), 0x0000FF);
		};

		
		var sphere;
		API = {
			init: function(start){
				var field = start.field,
					rad = 4,
					mat = new THREE.MeshLambertMaterial({color: 0x6ac06e, ambient: 0xeeeeee}),
					ballmat = new THREE.MeshLambertMaterial({color: 0xff0000, ambient: 0xffffff}),
					linemat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 5}),
					midlineGeo = new THREE.Geometry(),
					pointLight = new THREE.PointLight(0XFAB65A,1),
					sphere = new THREE.Mesh(new THREE.SphereGeometry(rad,32,32),ballmat),
					sphere2 = new THREE.Mesh(new THREE.SphereGeometry(rad,32,32),ballmat);
				plane = new THREE.Mesh(new THREE.PlaneGeometry(field.bounds[1],field.bounds[0],32,32),mat);
				midlineGeo.vertices.push(new THREE.Vertex(new THREE.Vector3(150,0,0)),new THREE.Vertex(new THREE.Vector3(-150,0,0)));
				var midline = new THREE.Line(midlineGeo,linemat);
				
				
				//sideline view
				camera.position.y =10;
				camera.position.z = 10;
				camera.position.x = -280;
				camera.rotation.y=-90*Math.PI/180;
				
				
				/*
				//positive Z player view
				camera.position.y = 4;
				camera.position.z=220;
				camera.position.x = 0;
				camera.rotation.y=0;
				*/
				
				
				
				plane.rotation.x = -90*Math.PI/180;
				midline.rotation.x = -45*Math.PI/180;
				
				sphere.position.z=field.bounds[0]/2-field.playerStart;
				sphere.position.y=rad;
				sphere.position.x=10;
				
				sphere2.position.z=-field.bounds[0]/2+field.playerStart;
				sphere2.position.y=rad;
				sphere2.position.x=10;
				
				pointLight.position.x = 50;
				pointLight.position.y = 400;
				pointLight.position.z = 100;
				scene.add(pointLight);
				scene.add(sphere);
				scene.add(sphere2);
				scene.add(plane);
				scene.add(midline);
				scene.add(new THREE.AmbientLight(0x333333));
				
				
				//To use enter the axis length
				debugaxis(400);
				
				
				
				renderer.render(scene,camera);

			},
			display: function(state,dt){
				//camera.position.z -= 0.2;
				//renderer.render(scene,camera);
			},
			destroy: function(){
				var game = document.getElementById('game');
				game.removeChild(game.getElementsById('THREE'));
			}
		}
		return API;
	}
	Renderer = function(scale,override){	//can add Canvas, or HTML+CSS later
		var manager;
		if (typeof scale == 'undefined'){
			scale = 1;
		}
		
		if (typeof override =='function'){
			manager=override(scale);
		} else {
			manager=SVGisCoolforHavingaDOM(scale);
		}
		
		
		//Interface
		return {
			init: function(field){ return manager.init(field); }, //draw field and initial state
			display: function(state,dt){ return manager.display(state,dt); },
			destroy: function(){ return manager.destroy(); }
		}
	};
	
	
	
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
				send: function(type,msg){
					sock.send(JSON.stringify({t:type, d:msg}));
				},
				on: function(evt,cb){
					dispatch[evt] = cb;
					return this;
				}
			}
		} else {
			//alert('Gamer server currently down');
			return {
				connected: false,
				send: function(){},
				on: function(){ return this; }
			}
		}
	};
	
	var Engine = function(){
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
					if (k.length > 7){
						for (var j=7, m=k.length; j<m; j++){
							g.push(k[j]);
						}
					}
					e.b[i] = new Ball([k[0],k[1]],[k[2],k[3]],i,k[4],k[5],k[6],g)
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
					view.b[i] = [state.b[i].loc[0],state.b[i].loc[1]];
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
	}();
	
	var Controller = function(){
		var scale = 1.5;
	
		Renderer = Renderer(scale)//,CanvasIsFasterThough);
		Network = Network();

		Renderer.init(Engine.init());
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
			.on('b',function(d){ //ball action (not movement)
			
			});
		var pickHandler = function(x,y){
			var chosen = Engine.playerSelect(x/scale,y/scale);
			if (Network.connected){
				Network.send('claim',chosen);
				Network.on('ca',function(d){
					if (d.a==1){
						Engine.assign(chosen);
						InputManager.onPickPlayer(function(){});
					} else if (d.a==0){
						alert('Woops! that position is taken, please pick again');
					} else {
						alert('Sorry! This game is full now, but you can watch this game until the next begins, or a player drops out');
						InputManager.onPickPlayer(function(){});
					}
				})
			} else { //play by yourself for funsies
				InputManager.onPickPlayer(function(){});
				Engine.assign(chosen);
			}
		};
		InputManager.onPickPlayer(pickHandler);
	
		function loop(t){
			var velo = InputManager.getInputs(),
				now = new Date().getTime(),
				dt=0,
				past;
				
			if (past){
				dt = Math.min(1,(now-past)/1000);
			}
			Engine.apply(velo);
			while (dt >= (1000/60)){
				dt -= 1000/60;
				Engine.update();
			}
			Renderer.display(Engine.update(),t);
			past=now;
			window.requestAnimationFrame(loop);
		}
		
		return {
			start: function(){
				Renderer.display(Engine.getState());
				loop(new Date().getTime());
			}
		}
	}();
	
	Controller.start();
	
	
	var stats = new Stats();
	// Align top-left
	stats.getDomElement().style.position = 'absolute';
	stats.getDomElement().style.left = '0px';
	stats.getDomElement().style.top = '0px';	
	document.body.appendChild( stats.getDomElement() );
	setInterval( function () {
	
	    stats.update();
	
	}, 1000 / 60 );
	
	/*
	var Player = Class.extend({
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
		
	})

	

	function moveLoop(){
			
			//	PLAYER MOTION
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
			
			
				//	BLUDGER SECTION
				//	and KNOCKOUT LOGIC
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
				
				
				//	QUAFFLE TIME
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
				
				
				
				
				//	SNITCHY
				if (players[i]._position=='seeker'
				&& players[i]._out ===false
				&& collision(players[i],snitch)){
					alert('YOU WIN');
					game =false;
				}
				
				
			}
		if (game){
			window.requestAnimationFrame(moveLoop);
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
*/
	
})();