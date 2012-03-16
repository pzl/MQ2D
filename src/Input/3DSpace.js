var ThreeDSpace = function(){
	var key = { 
				arrow:{left: 37, up: 38, right: 39, down: 40 }, 
				wasd: { left: 65, up: 87, right: 68, down: 83}, 
				space: 32, 1: 49, 2: 50, 3:51, 4:52, 5:53, 6:54, 7:55 
			},
		x=0,
		y=0,
		API = {},
		players = [],
		shootCB,
		changeCB,
		cam;
	
	
	for (var i=0, l=window.scene.children.length; i<l; i++){
		if (window.scene.children[i].hasOwnProperty('near')){
			cam = window.scene.children[i];
			break;
		}
	}
	
	d3.select(document).on('keydown', function(){
		var e = d3.event,
			prevent=false,
			vector = [Math.cos(cam.rotation.y),Math.sin(cam.rotation.y)];
	    switch (e.keyCode){
	    	case key.arrow.left:
	    	case key.wasd.left:
	    		x=Math.cos(cam.rotation.y-Math.PI/2);
	    		y=-1*Math.sin(cam.rotation.y-Math.PI/2);
	    		prevent=true;
	    		break;
	    	case key.arrow.right:
	    	case key.wasd.right:
	    		x=-1*Math.cos(cam.rotation.y-Math.PI/2);
	    		y=Math.sin(cam.rotation.y-Math.PI/2);
	    		prevent=true;
	    		break;
	    	case key.arrow.up:
	    	case key.wasd.up:
	    		x=-1*vector[0];
	    		y=vector[1];
	    		prevent=true;
	    		break;
	    	case key.arrow.down:
	    	case key.wasd.down:
	    		x=vector[0];
	    		y=-1*vector[1];
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
	    	changeCB([x,y]);
	   		e.preventDefault();
	   	}
	});
	d3.select(document).on('keyup',function(){
		var e = d3.event,
			prevent=false;
	    switch (e.keyCode){
	    	case key.arrow.left:
	    	case key.wasd.left:
	    	case key.arrow.right:
	    	case key.wasd.right:
	    	case key.arrow.up:
	    	case key.wasd.up:
	    	case key.arrow.down:
	    	case key.wasd.down:
	    		x=0;
	    		y=0;
	    		prevent=true;
	    		break;
	    }
	    if (prevent){
	    	changeCB([x,y]);
	   		e.preventDefault();
	   	}
	});
	API = {
		getInputs: function(){
			return [x,y];
		},
		onChange: function(cb){
			d3.select(document).on('mousemove',function(){
				var dist = ((window.innerWidth/2)-d3.event.clientX)/(window.innerWidth/2),
					sensitivity = 2.5;
				
				cam.rotation.y += dist*sensitivity*Math.PI/180;		
			});
			changeCB = cb;
		},
		playerElements: function(el){
			for (var i=0, l=el.length; i<l; i++){
				players[i] = el[i].children[0];
			}
		},
		onPickPlayer: function(cb){
			var projector = new THREE.Projector();
			d3.select(document).on('mousedown',function(){
				var vector = new THREE.Vector3(( d3.event.clientX / window.innerWidth ) * 2 - 1, - ( d3.event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
				projector.unprojectVector(vector,cam);
				var ray = new THREE.Ray(cam.position, vector.subSelf(cam.position).normalize()),
					intersects = ray.intersectObjects(players);
					if (intersects && intersects.length > 0 && typeof cb == 'function'){
						cb(intersects[0].point.z,-1*intersects[0].point.x);
					}
				
			});
		},
		shoot: function(cb){
			shootCB = cb;
		}
	}
	return API;
};