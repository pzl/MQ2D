var Controller = function(){

	var scale,
		Render,
		Input,
		Net,
		stats;
	
	
	var optns = [
					{name:'3D', scale: 1,support:supported('webgl'), use: WebGLForFunsies, IM:ThreeDSpace, img: '3d.jpg',
						details: 'Browsers that support the experimental WebGL API with hardware acceleration are in for a treat with this.'},
					{name:'Vectors', scale: 1.5, support:supported('svg'), use: SVGisCoolforHavingaDOM, img: 'svg.jpg', 
						details: 'If your browser supports SVG, then this is going to look smoother and use less CPU than canvas.'},
					{name:'Canvas', scale: 1.5, support:supported('canvas'), use: CanvasIsOddlyPopular, img: 'canvas.jpg', 
						details: 'If your browser can use the 2D Canvas API, then you\'re in luck!. And your CPU may double as a toaster!'}
				];
	
	var choices = d3.select('#view').selectAll('.method')
		.data(optns).enter()
		.append('div').classed('method',true).classed('pickable',function(d){ return d.support; });
	
	choices.append('h3').html(function(d){ return d.name; });
	choices.append('img').attr('src',function(d){ return d.img; }).attr('alt',function(d){ return d.name; });
	choices.append('p').html(function(d){ return d.details; });
	
	choices.on('click',function(d,i){
		if (d.support){
			gameGO(d);
			choices.on('click',null);
		}	
	});

	

	function gameGO(d){
			scale = d.scale;
			
			d3.select('#game').classed('off',false);
			d3.select('#view').classed('off',true);
			d3.select('body').attr('id','gameOn');
			
			Render = Renderer(scale,d.use);
			Render.init(Engine.init());
			Input = InputManager(d.IM);
			if (d.name=='3D'){
				Input.playerElements(Render.getPlayers());
			}
			
			
			Net = Network();
			if (Net.connected){
				Net.on('w',function(d){ //welcome
					if (d=='f'){
						alert('This game is currently full! You can watch until the next game begins, though!')
					} else {
						Input.onPickPlayer(pickHandler);
					}
				})
				.on('s',function(d){ //state
					Engine.setState(d);
					Engine.apply(Input.getInputs());
				})
				.on('b',function(d){ //ball action (not movement)
				
				});	
			} else {
				Input.onPickPlayer(pickHandler);
			}
			
			stats = new Stats();
			stats.getDomElement().style.position = 'absolute';
			stats.getDomElement().style.left = '0px';
			stats.getDomElement().style.top = '0px';	
			document.body.appendChild( stats.getDomElement() );
			
			Controller.start();	
	}
	
	
	function pickHandler(x,y){
		var chosen = Engine.playerSelect(x/scale,y/scale);
		if (chosen !== false){
			if (Net.connected){
				Net.send('claim',chosen);
				Net.on('ca',function(d){
					if (d==1){
						successPick(chosen);
					} else if (d==0){
						alert('Woops! that position is taken, please pick again');
					} else {
						alert('Sorry! This game is full now, but you can watch this game until the next begins, or a player drops out');
						Input.onPickPlayer(null);
					}
				})
			} else { //play by yourself for funsies
				successPick(chosen);
			}
		}
	}
	function successPick(chosen){
		Engine.assign(chosen);
		Render.self(chosen);
		Input.onPickPlayer(null);	
		Input.onChange(function(velo){
			Net.send('v',velo)
			Engine.apply(velo);
		});
	}
	var past, dt;
	function loop(t){
		if (past){
			dt = t-past;
		}
		Render.display(Engine.update(dt));
		past = t;
		stats.update();
		window.requestAnimationFrame(loop);
	}
	
	return {
		start: function(){
			Render.display(Engine.getState());
			loop(new Date().getTime());
		}
	}
}();