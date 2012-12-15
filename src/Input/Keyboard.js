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
		players,
		API = {},
		shootCB,
		changeCB,
		angleCB,
		angle = 0,
		angleHandle;
	
	
	function angleChange(direction){
		angle = (angle+(direction*2))%360;
		
		if (angle < 0){
			angle += 360;
		}
		
		angleCB(angle);
		
	}
	
	
	d3.select(document).on('keydown', function(){
		var e = d3.event,
			prevent=false;
	    switch (e.keyCode){
	    	case key.arrow.left:
	    		left=1;
	    		prevent=true;
	    		break;
	    	case key.arrow.right:
	    		right=1;
	    		prevent=true;
	    		break;
	    	case key.arrow.up:
	    		up=1;
	    		prevent=true;
	    		break;
	    	case key.arrow.down:
	    		down=1;
	    		prevent=true;
	    		break;
	    	case key.space:
	    		if (typeof shootCB == 'function'){
	    			shootCB();
	    		}
	    		prevent=true;
	    		break;
	    	case key.wasd.up:
	    		clearInterval(angleHandle);
	    		angleHandle = setInterval(function(){ angleChange(-1);  }, 16);
	    		break;
	    	case key.wasd.down:
	    		clearInterval(angleHandle);
	    		angleHandle = setInterval(function(){ angleChange(1); }, 16);
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
	    		left=0;
	    		prevent=true;
	    		break;
	    	case key.arrow.right:
	    		right=0;
	    		prevent=true;
	    		break;
	    	case key.arrow.up:
	    		up=0;
	    		prevent=true;
	    		break;
	    	case key.arrow.down:
	    		down=0;
	    		prevent=true;
	    		break;
	    	case key.wasd.up:
	    	case key.wasd.down:
	    		clearInterval(angleHandle);
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
		playerElements: function(el){
			players = el;
		},
		onPickPlayer: function(cb){
			d3.select(document).on('mousedown',function(){
				if (typeof cb == 'function'){
					cb(d3.event.x,d3.event.y);
				}
				d3.event.preventDefault();
			})	
		},
		onShoot: function(cb){
			shootCB = cb;
		},
		newAngle: function(cb){
			angleCB = cb;
		}
	}
	return API;
};