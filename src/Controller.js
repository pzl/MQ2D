var Controller = function(){
	var scale = 1.5;

	Renderer = Renderer(scale);
	Renderer.init(Engine.init());
	
	Network = Network();
	Network.on('w',function(d){ //welcome
			if (d=='f'){
				alert('This game is currently full! You can watch until the next game begins, though!')
			} else {
				InputManager.onPickPlayer(pickHandler);
			}
		})
		.on('s',function(d){ //state
			Engine.setState(d);
		})
		.on('b',function(d){ //ball action (not movement)
		
		});
		
		
	if (!Network.connected){
		InputManager.onPickPlayer(pickHandler);
	}
	InputManager.onChange(function(velo){
		Network.send('v',velo)
		Engine.apply(velo);
	})
	
	
	
	function pickHandler(x,y){
		var chosen = Engine.playerSelect(x/scale,y/scale);
		if (chosen !== false){
			if (Network.connected){
				Network.send('claim',chosen);
				Network.on('ca',function(d){
					if (d==1){
						Engine.assign(chosen);
						InputManager.onPickPlayer(function(){});
					} else if (d==0){
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
		}
	}
	var past, dt;
	function loop(t){
		if (past){
			dt = t-past;
		}
		Renderer.display(Engine.update(dt));
		past = t;
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