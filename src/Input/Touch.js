var Touch = function(){
	var API = {},
		tstart,
		tmove,
		tstop,
		canvas,
		c,
		shootCB,
		pickCB,
		changeCB,
		lStick = {
			id: -1,
			start: [0,0],
			cur: [0,0]
		},
		rStick = {
			id: -1,
			start: [0,0],
			cur: [0,0]
		};

		var container = document.createElement( 'div' ),
			canvas = document.createElement( 'canvas' ),
			c = canvas.getContext( '2d' ),
			moveColor = 'cyan',
			fireColor = '#FF3938';
		container.className = "joysticks";
		document.body.appendChild( container );
		container.appendChild(canvas);	
	
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	
		c.strokeStyle = moveColor;
		c.lineWidth =2;
		function circle(x,y,r,color){
			c.strokeStyle = color;
			c.beginPath();
			c.arc(x,y,r,0,Math.PI*2);
			c.stroke();
		}
		function clear(){
			c.clearRect(0,0,canvas.width,canvas.height);
		}
	tstart = function(e){
		var width = window.innerWidth;
		clear();
		for (var i=0, l=e.changedTouches.length; i<l; i++){
			if (typeof pickCB == 'function'){
				pickCB(e.changedTouches[i].clientX,e.changedTouches[i].clientY);
			}
		
			if (!~lStick.id && e.changedTouches[i].clientX <= width/2){
				lStick.id = e.changedTouches[i].identifier;
				lStick.start = [e.changedTouches[i].clientX,e.changedTouches[i].clientY];
				lStick.cur = lStick.start;
				circle(lStick.start[0],lStick.start[1],30,moveColor);
				circle(lStick.start[0],lStick.start[1],40,moveColor);
				continue;
			} else if (!~rStick.id &&  e.changedTouches[i].clientX >= width/2){
				rStick.id = e.changedTouches[i].identifier;
				rStick.start = [e.changedTouches[i].clientX,e.changedTouches[i].clientY];
				rStick.cur = rStick.start;
				circle(rStick.start[0],rStick.start[1],30,fireColor);
				circle(rStick.start[0],rStick.start[1],40,fireColor);
				continue;
			}
		}
	};
	tmove = function(e){
		clear();
		for (var i=0, l=e.changedTouches.length; i<l; i++){
			if (!!~lStick.id && e.changedTouches[i].identifier == lStick.id){
				lStick.cur = [e.changedTouches[i].clientX,e.changedTouches[i].clientY];
				circle(lStick.start[0],lStick.start[1],30,moveColor);
				circle(lStick.start[0],lStick.start[1],40,moveColor);
				circle(lStick.cur[0],  lStick.cur[1],  30,moveColor);
				changeCB([(lStick.cur[0]-lStick.start[0])*0.1,(lStick.cur[1]-lStick.start[1])*0.1]);
				continue;
			} else if (!!~rStick.id && e.changedTouches[i].identifier == rStick.id){
				rStick.cur = [e.changedTouches[i].clientX,e.changedTouches[i].clientY];
				circle(rStick.start[0],rStick.start[1],30,fireColor);
				circle(rStick.start[0],rStick.start[1],40,fireColor);
				circle(rStick.cur[0],  rStick.cur[1],  30,fireColor);
				continue;
			}
		}
		e.preventDefault();
	};		
	tstop = function(e){
		for (var i=0, l=e.changedTouches.length; i<l; i++){
			if (e.changedTouches[i].identifier == lStick.id){
				lStick.id=-1;
				lStick.start =[0,0];
				lStick.cur = lStick.start;
				changeCB([0,0]);
				continue;
			} else if (e.changedTouches[i].identifier == rStick.id){
				if (typeof shootCB == 'function'){
					shootCB((rStick.cur[0]-rStick.start[0])*0.1,(rStick.cur[1]-rStick.start[1])*0.1);
				}
				rStick.id=-1;
				rStick.start =[0,0];
				rStick.cur = rStick.start;
				continue;
			}
		}
		clear(0,window.innerWidth);
	};

	document.addEventListener('touchstart',tstart);
	document.addEventListener('touchmove',tmove);
	document.addEventListener('touchend',tstop);
	document.addEventListener('touchcancel',tstop);
	
	API = {
		getInputs: function(){
			if (!~lStick.id){
				return [0,0];
			} else {
				return [(lStick.cur[0]-lStick.start[0])*0.1,(lStick.cur[1]-lStick.start[1])*0.1];
			}
		},
		onPickPlayer: function(cb){
			pickCB = cb;
		},
		onChange: function(cb){
			changeCB = cb;
		},
		onShoot: function(cb){
			shootCB = cb;
		}
	};
	
	return API;
};