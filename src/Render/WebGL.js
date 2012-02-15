var WebGLForFunsies = function(scale){
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
		display: function(state){
			//camera.position.z -= 0.2;
			//renderer.render(scene,camera);
		},
		destroy: function(){
			var game = document.getElementById('game');
			game.removeChild(game.getElementsById('THREE'));
		}
	}
	return API;
};