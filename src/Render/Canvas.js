var CanvasIsOddlyPopular = function(scale){
	var container = document.getElementById('game'),
		canvas = document.createElement( 'canvas' ),
		c = canvas.getContext( '2d' ), 
		pos,
		posMap = {seeker:'gold',chaser:'white',beater:'black',keeper:'lime'},
		R=[],										//radii of objects
		box=[];										//active bounding box
	container.appendChild(canvas);	
	
	canvas.width = 1; 
	canvas.height = 1;
	canvas.id='movement';
	
	var CP = window.CanvasRenderingContext2D && CanvasRenderingContext2D.prototype;
	if(CP && CP.lineTo) CP.dashedLine = function(x, y, x2, y2, dashArray){
	    if(! dashArray) dashArray=[10,5];
	    var dashCount = dashArray.length,
	    	dx = (x2 - x),
	    	dy = (y2 - y),
	    	xSlope = (Math.abs(dx) > Math.abs(dy)),
	    	slope = (xSlope) ? dy / dx : dx / dy;
	
	    this.moveTo(x, y);
	    var distRemaining = Math.sqrt(dx * dx + dy * dy),
	    	dashIndex = 0;
	    while(distRemaining >= 0.1){
	        var dashLength = Math.min(distRemaining, dashArray[dashIndex % dashCount]);
	        var step = Math.sqrt(dashLength * dashLength / (1 + slope * slope));
	        if(xSlope){
	            if(dx < 0) step = -step;
	            x += step
	            y += slope * step;
	        }else{
	            if(dy < 0) step = -step;
	            x += slope * step;
	            y += step;
	        }
	        this[(dashIndex % 2 == 0) ? 'lineTo' : 'moveTo'](x, y);
	        distRemaining -= dashLength;
	        dashIndex++;
	    }
	}								
	

	return {
		init: function(start){
			var pitch = document.createElement('canvas'),
				ctx = pitch.getContext('2d'),
				field = start.field,
				state = start.state,
				x = field.bounds[0]/2,
				y = field.bounds[1]/2;	
			pos=start.positions;
			R=field.R;
			
			canvas.width = field.bounds[0]*scale; 
			canvas.height =field.bounds[1]*scale;
			c.scale(scale,scale);

			
			pitch.width= field.bounds[0]*scale;
			pitch.height=field.bounds[1]*scale;
			pitch.id='pitch';
			container.appendChild(pitch);
			
			
			ctx.scale(scale,scale);
			ctx.fillStyle='#6ac06e';
			ctx.strokeStyle='white';

			//field
			ctx.save()
			ctx.scale((field.bounds[0]/field.bounds[1]),1);
			ctx.moveTo(0,0);
			ctx.beginPath();
			ctx.arc(y,y,y,0,Math.PI*2,true);
			ctx.fill();
			ctx.restore();
			
			
			ctx.globalCompositeOperation = 'source-atop';

			
			//midlines
			ctx.beginPath();
			ctx.lineWidth = 1.3;
			ctx.moveTo(x,0);
			ctx.lineTo(x,field.bounds[1]);
			ctx.closePath();
			ctx.stroke();
			
			ctx.beginPath();
			ctx.lineWidth=1;
			ctx.arc(x,y,6,0,Math.PI*2,true);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
				
			
			//keeper zones
			ctx.fillStyle='rgba(255,0,0,0.15)';
			ctx.fillRect(0,0,field.keepZone,field.bounds[1]);
			ctx.fillStyle='rgba(0,0,255,0.15)';
			ctx.fillRect(field.bounds[0]-field.keepZone,0,field.keepZone,field.bounds[1]);		
			
			
			//keeper lines
			ctx.beginPath();
			ctx.lineWidth=0.9;
			ctx.dashedLine(field.keepZone,0,field.keepZone,field.bounds[1]);
			ctx.closePath();
			ctx.stroke();
			
			ctx.beginPath();
			ctx.dashedLine(field.bounds[0]-field.keepZone,0,field.bounds[0]-field.keepZone,field.bounds[1]);
			ctx.closePath();
			ctx.stroke();
			
			//goal lines
			ctx.globalAlpha=0.8;
			ctx.beginPath();
			ctx.lineWidth=0.8;
			ctx.moveTo(field.goalLine,0);
			ctx.lineTo(field.goalLine,field.bounds[1]);
			ctx.closePath();
			ctx.stroke();
			
			ctx.beginPath();
			ctx.lineWidth=0.8;
			ctx.moveTo(field.bounds[0]-field.goalLine,0);
			ctx.lineTo(field.bounds[0]-field.goalLine,field.bounds[1]);
			ctx.closePath();
			ctx.stroke();
			ctx.globalAlpha=1;
			
			
			
			//start lines
			ctx.beginPath();
			ctx.lineWidth=0.3;
			ctx.dashedLine(field.playerStart,0,field.playerStart,field.bounds[1],[4,2]);
			ctx.closePath();
			ctx.stroke();
			
			ctx.beginPath();
			ctx.dashedLine(field.bounds[0]-field.playerStart,0,field.bounds[0]-field.playerStart,field.bounds[1],[4,2]);
			ctx.closePath();
			ctx.stroke();

			
			//hoops
			var bow = 2,
				r = field.goalDiam/2;
			ctx.lineWidth=1;
			ctx.strokeStyle='black';
			for (var i=0, l=field.goals.length; i<l; i++){
				ctx.beginPath();
				ctx.moveTo(field.goalLine,field.goals[i]+r);
				ctx.quadraticCurveTo(field.goalLine+bow,field.goals[i],field.goalLine,field.goals[i]-r);
				ctx.quadraticCurveTo(field.goalLine-bow,field.goals[i],field.goalLine,field.goals[i]+r);
				ctx.stroke();
				
				ctx.beginPath();
				ctx.moveTo(field.bounds[0]-field.goalLine,field.goals[i]+r)
				ctx.quadraticCurveTo(field.bounds[0]-field.goalLine+bow,field.goals[i],field.bounds[0]-field.goalLine,field.goals[i]-r);
				ctx.quadraticCurveTo(field.bounds[0]-field.goalLine-bow,field.goals[i],field.bounds[0]-field.goalLine,field.goals[i]+r);
				ctx.stroke();
			}
			
			box=[0,0,field.bounds[0],field.bounds[1]];

		},
		display: function(state){
			var xmin=0,ymin=0,xmax=0,ymax=0;
			c.clearRect(box[0],box[1],box[2]-box[0],box[3]-box[1]);
			
			//players
			c.lineWidth = 2;
			c.fillStyle='red';
			
			var temp;
			for (var i=0, l=state.p.length; i<l; i++){
				if (i>6){
					c.fillStyle='blue';
				} else {
					c.fillStyle='red';
				}
				if (!state.p[i][2]){
					c.fillStyle='#505050';
				}
				c.globalAlpha = (state.p[i][2]) ? ((state.p[i][3]) ? 0.3 : 1 ) : 0.5;
				c.strokeStyle = posMap[pos[i%7]];
				c.beginPath();
				c.arc(state.p[i][0],state.p[i][1],R[0],0,Math.PI*2);
				c.closePath();
				c.stroke();
				c.fill();
				
				xmin = ((state.p[i][0]-R[0]-2) < xmin) ? (state.p[i][0]-R[0]-2) : xmin;
				xmax = ((state.p[i][0]+R[0]+2) > xmax) ? (state.p[i][0]+R[0]+2) : xmax;
				ymax = ((state.p[i][1]+R[0]+2) > ymax) ? (state.p[i][1]+R[0]+2) : ymax;
				ymin = ((state.p[i][1]-R[0]-2) < ymin) ? (state.p[i][1]-R[0]-2) : ymin;
			}
			c.globalAlpha=1;
			
			//balls
			c.fillStyle='white';
			c.strokeStyle='black';
			c.beginPath();
			c.arc(state.b[0][0],state.b[0][1],R[1],0,Math.PI*2);
			c.closePath();
			c.stroke();
			c.fill();
			xmin = ((state.b[0][0]-R[1]-2) < xmin) ? (state.b[0][0]-R[1]-2) : xmin;
			xmax = ((state.b[0][0]+R[1]+2) > xmax) ? (state.b[0][0]+R[1]+2) : xmax;
			ymax = ((state.b[0][1]+R[1]+2) > ymax) ? (state.b[0][1]+R[1]+2) : ymax;
			ymin = ((state.b[0][1]-R[1]-2) < ymin) ? (state.b[0][1]-R[1]-2) : ymin;
			
			c.fillStyle='black';
			for (var i=1, l=state.b.length-1; i<l; i++){
				c.beginPath();
				c.arc(state.b[i][0],state.b[i][1],R[2],0,Math.PI*2);
				c.closePath();
				c.fill();
				xmin = ((state.b[i][0]-R[2]) < xmin) ? (state.b[i][0]-R[2]) : xmin;
				xmax = ((state.b[i][0]+R[2]) > xmax) ? (state.b[i][0]+R[2]) : xmax;
				ymax = ((state.b[i][1]+R[2]) > ymax) ? (state.b[i][1]+R[2]) : ymax;
				ymin = ((state.b[i][1]-R[2]) < ymin) ? (state.b[i][1]-R[2]) : ymin;
			}
			
			c.fillStyle='gold';
			c.beginPath();
			c.arc(state.b[4][0],state.b[4][1],R[3],0,Math.PI*2);
			c.closePath();
			c.fill();
			xmin = ((state.b[4][0]-R[3]) < xmin) ? (state.b[4][0]-R[3]) : xmin;
			xmax = ((state.b[4][0]+R[3]) > xmax) ? (state.b[4][0]+R[3]) : xmax;
			ymax = ((state.b[4][1]+R[3]) > ymax) ? (state.b[4][1]+R[3]) : ymax;
			ymin = ((state.b[4][1]-R[3]) < ymin) ? (state.b[4][1]-R[3]) : ymin;
			
			xmin = Math.max(~~xmin,0);
			ymin = Math.max(~~ymin,0);
			xmax = Math.min(~~xmax,window.innerWidth);
			ymax = Math.min(~~ymax,window.innerHeight);
			
			box = [xmin*scale,ymin*scale,xmax*scale,ymax*scale];
		},
		destroy: function(){
			container.removeChild(canvas);
			container.removeChild(buffer);
		},
		out: function(idx){
			
		},
		angleChange: function(angle){
			
		}
	}	
};