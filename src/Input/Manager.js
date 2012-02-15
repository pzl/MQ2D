var InputManager = function(override){
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
		onChange: function(cb){ return manager.onChange(cb); },
		onShoot: function(cb){ return manager.onShoot(cb); },
		onPickPlayer: function(cb,scale) { return manager.onPickPlayer(cb,scale); }
	}
}();