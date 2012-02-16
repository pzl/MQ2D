var Controller = function(){
	var scale = 1.5,
		ThreeD = ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )(),
		Render,
		Input,
		Net;
		
	if (ThreeD){
		scale=1;
		Render = Renderer(scale,WebGLForFunsies);
	} else {
		Render = Renderer(scale);
	}
	Render.init(Engine.init());
	
	if (ThreeD){
		Input = InputManager(ThreeDSpace);
		Input.playerElements(Render.getPlayers());
	} else {
		Input = InputManager();
	}
	
	Net = Network();
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
		
		
	if (!Net.connected){
		Input.onPickPlayer(pickHandler);
	}
	Input.onChange(function(velo){
		Net.send('v',velo)
		Engine.apply(velo);
	})
	
	
	
	function pickHandler(x,y){
		var chosen = Engine.playerSelect(x/scale,y/scale);
		console.log(chosen);
		if (chosen !== false){
			if (Net.connected){
				Net.send('claim',chosen);
				Net.on('ca',function(d){
					if (d==1){
						Engine.assign(chosen);
						Input.onPickPlayer(function(){});
					} else if (d==0){
						alert('Woops! that position is taken, please pick again');
					} else {
						alert('Sorry! This game is full now, but you can watch this game until the next begins, or a player drops out');
						Input.onPickPlayer(function(){});
					}
				})
			} else { //play by yourself for funsies
				Input.onPickPlayer(function(){});
				Engine.assign(chosen);
			}
		}
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

var stats = new Stats();
// Align top-left
stats.getDomElement().style.position = 'absolute';
stats.getDomElement().style.left = '0px';
stats.getDomElement().style.top = '0px';	
document.body.appendChild( stats.getDomElement() );

Controller.start();	