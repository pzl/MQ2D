var ThreeDSpace = function(){
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
		players = [],
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
		playerElements: function(el){
			players = el;
		},
		onPickPlayer: function(cb){
			var projector = new THREE.Projector(),
				cam;
			for (var i=0, l=window.scene.children.length; i<l; i++){
				if (window.scene.children[i].hasOwnProperty('near')){
					cam = window.scene.children[i];
					break;
				}
			}
			
			d3.select(document).on('mousedown',function(){
				var vector = new THREE.Vector3(( d3.event.clientX / window.innerWidth ) * 2 - 1, - ( d3.event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
				projector.unprojectVector(vector,cam);
				var ray = new THREE.Ray(cam.position, vector.subSelf(cam.position).normalize()),
					intersects = ray.intersectObjects(players);
					if (intersects && intersects.length > 0 && typeof cb == 'function'){
						cb(intersects[0].object.position.z,-1*intersects[0].object.position.x);
					}
				
			});
		},
		shoot: function(cb){
			shootCB = cb;
		}
	}
	return API;
};