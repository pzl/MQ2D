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
			
			var arrow = game.append('g')
							.attr('id','arrow')
							.attr('transform','translate(50,50)');
			
			
			
			
			arrow.append('line')
					.attr('x1',10)
					.attr('x2',15)
					.attr('y1',0)
					.attr('y2',0)
			arrow.append('polygon')
					.attr('points','18,10 15,7 15,13')
					.attr('transform','translate(0,-10)')
					.attr('fill','white')

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
		},
		out: function(idx){
			var player = playG.selectAll('.player').filter(function(d,i){ return i==idx; }).classed('out',true);
			var flashy = setInterval(function(){ player.classed('flash',!player.classed('flash')); },100);
			setTimeout(function(){ clearInterval(flashy); player.classed('flash',false); },1000);
		},
		angleChange: function(angle){
			game.select('#arrow').attr('transform','rotate('+angle+',50,50)');
		}
	}
};