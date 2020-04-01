APP={}
APP.init = function(){
	_this=this;
	this.state = "loading";

	// get incoming query params
	this.queryParams = $.getQueryParameters();
	if(this.queryParams.page) { this.page = this.queryParams.page;}

	// get device specs and capabilities
	getSpecs(this);
	
	// section and page is pushed to page
	if(window.section) { state = window.section; }
	if(window.page) { state+= "/" + window.page;}
	if(!window.section) { state = "home"; }
	

	// init the views 
	APP.webGL.init();

	APP.hidden = false;

	APP.mouse = new THREE.Vector2(0,0);

	if(!this.isMobile){
		window.addEventListener("mousemove", mouseMove);
	}
	function mouseMove(e){
		var x =  (e.clientX - window.innerWidth/2);
  		var y = (e.clientY - window.innerHeight/2);
  		APP.mouse.x = x;
  		APP.mouse.y = y;
	}
}	
	

// router, manage state  //
APP.go = function(state, storeHistory){
	if(this.state==state) { return false; }

	// get section and page
	var path = state.split( '/' );
	if(path[0]){ var section  = path[0]; }
	if(path[1]){ var page = path[1]; }

	var fromPath = this.state.split( '/' );
	if(fromPath[0]){ var fromSection  = fromPath[0]; }
	if(fromPath[1]){ var fromPage = fromPath[1]; }

	// dynamic url is same level unless coming from deeper link
	// then up a level
	p = "./";
	if(fromPage){ p = "../";}

	// handle leaving old state
	switch(fromSection){
		case "home":
			break;

	}
	// handle entering new state
	switch(section){
		case "home":
			APP.state = state;
			APP.webGL.go("home");
			break;
	}
	
}



