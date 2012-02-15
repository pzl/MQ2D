var WebGLForFunsies = function(scale){
	var API = {},
		width = window.innerWidth,
		height = window.innerHeight,
		aspect = width/height,
		angle=45,
		near = 0.1,
		far = 10000,
		field,
		container = document.getElementById('game'),
		renderer = new THREE.WebGLRenderer({antialias:true}),
		camera = new THREE.PerspectiveCamera(angle,aspect,near,far),
		scene = new THREE.Scene(),
		balls = [],
		players=[];
	
	window.scene = scene;
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
			field = start.field;
			var rad = field.R[0],
				fieldMat = new THREE.MeshLambertMaterial({color: 0x6ac06e, ambient: 0xeeeeee}),
				biglineMat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 5}),
				medlineMat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 2}),
				smllineMat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 1}),
				hoopMat =  new THREE.MeshLambertMaterial({color: 0xffffff, ambient: 0xffffff }),
				bases = [],
				hoops = [],
				kZoneGeo = [new THREE.Geometry(), new THREE.Geometry()],
				goalLineGeo = [new THREE.Geometry(), new THREE.Geometry()],
				startLineGeo = [new THREE.Geometry(), new THREE.Geometry()],
				midlineGeo = new THREE.Geometry(),
				playerMat = [new THREE.MeshLambertMaterial({color: 0xff0000, ambient: 0xffffff}),
							 new THREE.MeshLambertMaterial({color: 0x1111ff, ambient: 0xffffff})],
				playerGeo = new THREE.SphereGeometry(rad,32,32),
				wf = new THREE.MeshBasicMaterial( { color: 0x222222, wireframe: true, transparent: true, opacity: 0.1 } ),
				ballMat = [new THREE.MeshLambertMaterial({ color: 0xffffff, ambient: 0xcccccc }),
						   new THREE.MeshLambertMaterial({ color: 0xee7777, ambient: 0xcccccc }),
						   new THREE.MeshLambertMaterial({ color: 0xffd700, ambient: 0xffffff })],
				ballGeo = [new THREE.SphereGeometry(field.R[1],16,16),
						   new THREE.SphereGeometry(field.R[2],16,16),
						   new THREE.SphereGeometry(field.R[3],16,16)],
				lights = [new THREE.DirectionalLight(0XFFFFFF,0.6),new THREE.DirectionalLight(0XFAB65A)],
				plane = new THREE.Mesh(new THREE.PlaneGeometry(field.bounds[1],field.bounds[0],32,32),fieldMat);
				
				
				
			//field lines
			midlineGeo.vertices.push(new THREE.Vertex(new THREE.Vector3(0,0.5,field.bounds[0]/2)),
									 new THREE.Vertex(new THREE.Vector3(-field.bounds[1],0.5,field.bounds[0]/2)));
			kZoneGeo[0].vertices.push(new THREE.Vertex(new THREE.Vector3(0,0.5,field.keepZone)),
									  new THREE.Vertex(new THREE.Vector3(-field.bounds[1],0.5,field.keepZone)));
			kZoneGeo[1].vertices.push(new THREE.Vertex(new THREE.Vector3(0,0.5,field.bounds[0]-field.keepZone)),
									  new THREE.Vertex(new THREE.Vector3(-field.bounds[1],0.5,field.bounds[0]-field.keepZone)));
			goalLineGeo[0].vertices.push(new THREE.Vertex(new THREE.Vector3(0,0.5,field.goalLine)),
									  new THREE.Vertex(new THREE.Vector3(-field.bounds[1],0.5,field.goalLine)));
			goalLineGeo[1].vertices.push(new THREE.Vertex(new THREE.Vector3(0,0.5,field.bounds[0]-field.goalLine)),
									  new THREE.Vertex(new THREE.Vector3(-field.bounds[1],0.5,field.bounds[0]-field.goalLine)));
			startLineGeo[0].vertices.push(new THREE.Vertex(new THREE.Vector3(0,0.5,field.playerStart)),
									  new THREE.Vertex(new THREE.Vector3(-field.bounds[1],0.5,field.playerStart)));
			startLineGeo[1].vertices.push(new THREE.Vertex(new THREE.Vector3(0,0.5,field.bounds[0]-field.playerStart)),
									  new THREE.Vertex(new THREE.Vector3(-field.bounds[1],0.5,field.bounds[0]-field.playerStart)));
			var midline = new THREE.Line(midlineGeo,biglineMat),
				klines = [new THREE.Line(kZoneGeo[0],medlineMat),new THREE.Line(kZoneGeo[1],medlineMat)],
				glines = [new THREE.Line(goalLineGeo[0],medlineMat),new THREE.Line(goalLineGeo[1],medlineMat)],
				plines = [new THREE.Line(startLineGeo[0],smllineMat),new THREE.Line(startLineGeo[1],smllineMat)];
			
			
			//hoops
			var h1,h2;
			for (var i=0, l=field.goalHeights.length; i<l; i++){
				if (i==0){
					h1 = field.goalHeights[0];
					h2 = field.goalHeights[2];
				} else if (i==2){
					h1 = field.goalHeights[2];
					h2 = field.goalHeights[0];
				} else {
					h1 = h2 = field.goalHeights[1];
				}
			
				bases[i] = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,h1,4,true),hoopMat);
				bases[i+3] = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,h2,4,true),hoopMat);
				hoops[i] = new THREE.Mesh(new THREE.TorusGeometry(field.goalDiam/2,0.4,8,32,Math.PI*2),hoopMat);
				hoops[i+3] = new THREE.Mesh(new THREE.TorusGeometry(field.goalDiam/2,0.4,8,16,Math.PI*2),hoopMat);
			
				bases[i].position.y = h1/2;
				bases[i+3].position.y = h2/2;
				bases[i].position.x = -field.goals[i];
				bases[i+3].position.x = -field.goals[i];
				bases[i].position.z = field.goalLine;
				bases[i+3].position.z = field.bounds[0]-field.goalLine;
				
				hoops[i].position.y = h1+field.goalDiam/2;
				hoops[i+3].position.y = h2+field.goalDiam/2;
				hoops[i].position.x = -field.goals[i];
				hoops[i+3].position.x = -field.goals[i];
				hoops[i].position.z = field.goalLine;
				hoops[i+3].position.z = field.bounds[0]-field.goalLine;
				
				scene.add(bases[i]);
				scene.add(bases[i+3]);
				scene.add(hoops[i]);
				scene.add(hoops[i+3]);
			}
			
			//balls
			var ball=0;
			for (var i=0, l=start.state.b.length; i<l; i++){
				if (i==4){
					ball=2;
				} else if (i>0){
					ball=1;
				}
				balls[i] = THREE.SceneUtils.createMultiMaterialObject(ballGeo[ball],[ballMat[ball],wf]);
				
				balls[i].position.y = field.R[ball+1];
				balls[i].position.x = -start.state.b[i][1];
				balls[i].position.z = start.state.b[i][0];
				scene.add(balls[i]);
			}

			//players
			var t=0;
			for (var i=0, l=start.state.p.length; i<l; i++){
				if (i>6){
					t=1;
				}
				players[i] = new THREE.Mesh(playerGeo,playerMat[t]);
				players[i].position.y=rad;
				players[i].position.x = -1*start.state.p[i][1];
				players[i].position.z = start.state.p[i][0];
				scene.add(players[i]);
			}

			
			
			//sideline view
			camera.position.y =40;
			camera.position.z = field.bounds[0]/2;
			camera.position.x = -1*field.bounds[1]-150;
			camera.rotation.y=-90*Math.PI/180;
			
			
			/*
			//positive Z player view
			camera.position.y = 4;
			camera.position.z=220;
			camera.position.x = 0;
			camera.rotation.y=0;
			*/
			
			
			
			plane.rotation.x = -90*Math.PI/180;
			plane.position.z += field.bounds[0]/2;
			plane.position.x -= field.bounds[1]/2;
			
			
			lights[0].position.x = -240;
			lights[0].position.y = 52;
			lights[0].position.z = 180;
			lights[1].position.x = 80;
			lights[1].position.y = 400;
			lights[1].position.z = 220;
			scene.add(lights[0]);
			scene.add(lights[1]);
			scene.add(plane);
			scene.add(midline);
			scene.add(klines[0]);
			scene.add(klines[1]);
			scene.add(glines[0]);
			scene.add(glines[1]);
			scene.add(plines[0]);
			scene.add(plines[1]);
			
			
			//debugaxis(400);
			
			
			
			renderer.render(scene,camera);

		},
		display: function(state){
			for (var i=0, l=state.p.length; i<l; i++){
				players[i].position.x = -1*state.p[i][1];
				players[i].position.z = state.p[i][0];
			}
			for (var i=0, l=state.b.length; i<l; i++){
				balls[i].position.x = -1*state.b[i][1];
				balls[i].position.z = state.b[i][0];
			}
			renderer.render(scene,camera);

		},
		destroy: function(){
			var game = document.getElementById('game');
			game.removeChild(game.getElementsById('THREE'));
		}
	}
	return API;
};