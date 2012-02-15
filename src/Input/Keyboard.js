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
		shootCB,
		changeCB;
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
	    	changeCB([right-left,down-up]);
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
	    	changeCB([right-left,down-up]);
	   		e.preventDefault();
	   	}
	});
	API = {
		getInputs: function(){
			return [right-left,down-up];
		},
		onChange: function(cb){
			changeCB = cb;
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
};