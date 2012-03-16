var Renderer = function(scale,override){
	var manager;
	if (typeof scale == 'undefined'){
		scale = 1;
	}

	
	if (typeof override =='function'){
		manager=override(scale);
	} else if (supported('svg')){
		manager=SVGisCoolforHavingaDOM(scale);
	} else {
		manager=CanvasIsOddlyPopular(scale);
	}
	
	
	//Interface
	return {
		//Mandatory implementation
		init: function(field){ return manager.init(field); }, //draw field and initial state
		display: function(state){ return manager.display(state); },
		destroy: function(){ return manager.destroy(); },
		//Optional
		out: function(i){ if (typeof manager.out == 'function'){ return manager.out(i); } },
		getPlayers: function(){ if (typeof manager.getPlayers == 'function') { return manager.getPlayers(); } },
		self: function(i){ if (typeof manager.self == 'function') { return manager.self(i); } }
	}
};
function supported(tech){
	tech = tech.toLowerCase();
	if (tech == 'svg'){
		var e = document.createElement('div');
		e.innerHTML = '<svg></svg>';
		return !!(e.firstChild && "namespaceURI" in e.firstChild && e.firstChild.namespaceURI == 'http://www.w3.org/2000/svg');
	} else if (tech == 'canvas'){
		var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
	} else if (tech=='webgl'){
		try {
            var canvas = document.createElement('canvas'),
                ret;
            ret = !!(window.WebGLRenderingContext && (canvas.getContext('experimental-webgl') || canvas.getContext('webgl')));
            canvas = undefined;
        } catch (e){
            ret = false;
        }
        return ret;
	}
}