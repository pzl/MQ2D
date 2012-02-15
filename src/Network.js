var Network = function(){
	var sock,
		dispatch = {};
	if (typeof io !== 'undefined'){
		sock = io.connect('/',{port: 3050});
		sock.on('message',function(d){
			//console.log('msg: '+d);
			d = JSON.parse(d);
			if (Object.prototype.hasOwnProperty.call(dispatch,d.t)){
				dispatch[d.t](d.d);
			}
		});
		return {
			connected: true,
			send: function(type,msg){
				sock.send(JSON.stringify({t:type, d:msg}));
			},
			on: function(evt,cb){
				dispatch[evt] = cb;
				return this;
			}
		}
	} else {
		//alert('Gamer server currently down');
		return {
			connected: false,
			send: function(){},
			on: function(){ return this; }
		}
	}
};