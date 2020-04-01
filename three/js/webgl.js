APP.webGL = {
  _this : this,
  statsEnabled:false,
  models:[],
  textures:[],
  featuredTextures:[],
  objects:[],
  mouse : new THREE.Vector2(),
  windowHalfX : window.innerWidth/2,
  windowHalfY : window.innerHeight/2,
  raycaster : new THREE.Raycaster(),
  draggingObject : null,
  clock : new THREE.Clock(),
  backgroundPlane:null,

  // shader vars
  BackgroundFragShader:null,
  BackgroundVertShader:null,

  backgroundPaused:true,
  infoBackgroundPaused:true,
  paused:false,
  intensity:0.5,

  init : function(){

        // set up background scene
        this.canvas= document.getElementById("webgl");
        this.camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 1000 );

        this.camera.position.set(0,0,50);
        //this.camera.lookAt(new THREE.Vector3(0,0,0));
        this.scene = new THREE.Scene();
        //this.scene.fog = new THREE.FogExp2( 0x000000, 0.0008 );
        //this.scene.background = new THREE.Color(0x00ff00);
        // switch to false anatialis and transparent as needed
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha:false});
        //this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        this.renderer.debug.checkShaderErrors=false;

       
         // default camera target object
        this.target = new THREE.Object3D();
        this.target.position.set(0,0,0);
        this.scene.add(this.target);
        
        // STATS
        if ( this.statsEnabled ) {
          this.stats = new Stats();
          $("body").append( this.stats.dom );
        }

        // loading manager
        this.manager = new THREE.LoadingManager();
        this.manager.onProgress = function ( item, loaded, total ) {
        };

        this.manager.onLoad = function ( ) {
          // add objects to scene and set initial 3D states
          APP.webGL.initObjects();
          
          // load backgorund shader 
          if(APP.data.BackgroundFragmentShader && APP.data.BackgroundVertexShader){
              ShaderLoader(APP.data.BackgroundVertexShader,APP.data.BackgroundFragmentShader,APP.webGL.createBackgroundShader);
          }

        };

        // load textures
        var loader = new THREE.TextureLoader(this.manager);
        $.each(APP.data.textures,function(i,t){
          loader.load( t.file, function (object) {
                APP.webGL.textures[t.name] = object;
              });
        });
        window.onresize = this.resize;
        
        
  },


  resize : function(){

    _this = APP.webGL;
    var width = window.innerWidth;
    var height = window.innerHeight;
    _this.camera.aspect = width / height;
    _this.camera.updateProjectionMatrix();
    _this.renderer.setSize( width, height );
    _this.windowHalfX = width/2;
    _this.windowHalfY = height/2;
    _this.backgroundPlane.scale.set(110*_this.camera.aspect, 110, 1 );
    //_this.composer.setSize( width, height );
    _this.backgroundUniforms.iResolution.value.x = width;
    _this.backgroundUniforms.iResolution.value.y = height;
     _this.backgroundUniforms.adj.value = .2 - window.innerHeight/window.innerWidth;

    console.log("resize");  
  },

  createBackgroundShader : function(v,f){
    // console.log("background shader loaded");
     _this = APP.webGL;
    _this.BackgroundVertexShader = v;
    _this.BackgroundFragmentShader = f;

    // create a bakgorund shader plane
    _this.backgroundUniforms = {
          iTime: { type: "f", value: 5212 },
          iResolution: { type: "v2", value: new THREE.Vector2() },
          iMouse: { type: "v2", value: new THREE.Vector2() },
          audio1:{ type:"f",value:0.1 },
          adj:{ type:"f",value:0.1 },
          orbOpacity:{ type:"f",value:0.8 },
          intensity:{ type:"f",value:0.8 },
          iChannel0:  { type: 't', value: _this.textures['tex1'] }
    };
    _this.backgroundUniforms.iResolution.value.x = window.innerWidth;
    _this.backgroundUniforms.iResolution.value.y = window.innerHeight;
    
    _this.backgroundUniforms.adj.value = .2 - window.innerHeight/window.innerWidth;

    

    // create custom shader material
    material = new THREE.ShaderMaterial( {
         uniforms:  _this.backgroundUniforms,
         vertexShader: _this.BackgroundVertexShader,
         fragmentShader: _this.BackgroundFragmentShader

    }); 

    //material = new THREE.MeshNormalMaterial();

    // create object mesh, set size so it fills screen
    // base this on resolution from above
    var aspect = window.innerWidth / window.innerHeight;  
    _this.backgroundPlane = new THREE.Mesh( geometry, material );
   //_this.backgroundPlane.scale.set(110*aspect, 110, 1 );
  

    var geometry = new THREE.PlaneGeometry( 1, 1 );
    _this.backgroundPlane = new THREE.Mesh( geometry, material );
    _this.backgroundPlane.scale.set(110*aspect, 110, 1 );
    _this.scene.add(_this.backgroundPlane);
           
    APP.go('home',false);
  },
      
  showHome : function(){
        // console.log("show home page webgl");
        _this = APP.webGL;
        _this.backgroundPaused = false;
        TweenMax.to(_this.backgroundUniforms.orbOpacity,.8,{value:1,ease:Circ.easeInOut});
        // move camra to home position
        //TweenMax.to(_this.target.position,1,{x:0,y:0,z:0,ease:Expo.easeIn});
        _this.canvas.addEventListener('mousedown', APP.webGL.onMouseDownLanding, false);
  },
    
  hideHome: function(){
    // console.log("hide home page webgl");
    APP.webGL.backgroundPaused = false;
    APP.webGL.canvas.removeEventListener('mousedown', APP.webGL.onMouseDownLanding, false);

  },

  render : function(){
    _this = APP.webGL;
    var scene = _this.scene;
    var camera = _this.camera;
    var target = _this.target;
    var renderer = _this.renderer;
    var d = _this.clock.getDelta()*1;

    if( scene &&  camera && !_this.backgroundPaused && !_this.paused) {  
      if(_this.backgroundUniforms){
        _this.backgroundUniforms.iTime.value += d;
        _this.backgroundUniforms.audio1.value=128.0/48.0+Math.random()*.1;
        _this.backgroundUniforms.iMouse.value = APP.mouse;
        _this.backgroundUniforms.intensity.value = APP.webGL.intensity;
        // console.log("render",_this.backgroundUniforms.iTime.value);
        if(!APP.isMobile){
          for ( var i = 0; i < _this.scene.children.length; i ++ ) {
              var object = scene.children[ i ];
              if ( object instanceof THREE.Points ) {
                object.rotation.y = .01*_this.backgroundUniforms.iTime.value * ( i < 4 ? i + 1 : - ( i + 1 ) );
                // object.rotation.z =  -.03*_this.backgroundUniforms.iTime.value * ( i < 4 ? i + 1 : - ( i + 1 ) );
              }
          }
        }
      }
      if(!APP.isMobile){
        _this.camera.position.x += (-APP.mouse.x*.01 - _this.camera.position.x) * .05;
        _this.camera.position.y += (APP.mouse.y*.01 - _this.camera.position.y) * .05;
        //_this.camera.position.z = _this.camera.position.z + (.02*_this.camera.position.y);
      }
      //camera.lookAt(target.position);
      //console.log("rendering webgl");
      renderer.render(scene,camera ); 

    }

    if ( _this.statsEnabled ) { _this.stats.update(); }
    requestAnimationFrame(_this.render); 
  },

      


  initObjects : function(){
      // console.log("init webgl objects");
      _this = APP.webGL;
      //console.log(_this.textures['sprite1']);

      // ambient sprites
      if(!APP.isMobile) {
        var geometry = new THREE.BufferGeometry();
        var vertices = [];
        var materials = [], parameters;
        for ( var i = 0; i < 600; i ++ ) {
          var x = Math.random() * 60 - 30;
          var y = Math.random() * 60 - 30;
          var z = Math.random() * 60 - 30;
          vertices.push( x, y, z );
        }
        geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        parameters = [
          [[ 0.3, 0.7, 0.9 ], _this.textures['sprite1'], .3 ],
          [[ 0.3, 0.3, 0.8 ], _this.textures['sprite2'], .3 ]
        ];
        for ( var i = 0; i < parameters.length; i ++ ) {
          var color = parameters[ i ][ 0 ];
          var sprite = parameters[ i ][ 1 ];
          var size = parameters[ i ][ 2 ];
          materials[ i ] = new THREE.PointsMaterial( { size: size, map: sprite, blending: THREE.AdditiveBlending, depthTest: false, transparent: true, opacity:.4} );
          materials[ i ].color.setRGB( color[ 0 ], color[ 1 ], color[ 2 ] );
          var particles = new THREE.Points( geometry, materials[ i ] );
          particles.rotation.x = Math.random() * 6;
          particles.rotation.y = Math.random() * 6;
          particles.rotation.z = Math.random() * 6;
          _this.scene.add( particles );
        }
      }

      _this.render();
      
  },



  go : function(state) {
    // handle the state specific aniamtions in the 3D scene
    _this = APP.webGL;
    var camera  = _this.camera;
    var target = _this.target;
    
    //show the webgl canvas
    $(_this.canvas).addClass("show");

    switch ( state ){
      case "home":
        _this.showHome();
        break;
    } 
  },

  get2DPosition : function(obj){
    var obj = app.webGL.models[obj];
    var pos = projectToScreenXY(obj,app.webGL.camera);
    return pos;
  }
}

// Asyncronous shader loader for THREE.js.
// written by Richard Mattka - Render51 Studios.
function ShaderLoader(vertex_url, fragment_url, onLoad, onProgress, onError) {
    var vertex_loader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    vertex_loader.setResponseType('text');
    vertex_loader.load(vertex_url, function (vertex_text) {
        var fragment_loader = new THREE.FileLoader(THREE.DefaultLoadingManager);
        fragment_loader.setResponseType('text');
        fragment_loader.load(fragment_url, function (fragment_text) {
            onLoad(vertex_text, fragment_text);
        });
    }, onProgress, onError);
}

