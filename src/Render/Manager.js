var Renderer = function(scale,override){
	var manager;
	if (typeof scale == 'undefined'){
		scale = 1;
	}
	var e = document.createElement('div');
	e.innerHTML = '<svg></svg>';
	var svgTest = (e.firstChild && "namespaceURI" in e.firstChild && e.firstChild.namespaceURI == 'http://www.w3.org/2000/svg');
	
	if (typeof override =='function'){
		manager=override(scale);
	} else if (svgTest){
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
		out: function(i){ if (typeof manager.out == 'function'){ manager.out(i); } }
	}
};