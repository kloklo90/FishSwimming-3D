//Author:Khady Lo Seck
//cse92020@cse.yorku.ca

var canvas;
var gl;

var program ;

var near = -100;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ctm;
var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MVS = [] ; // The modelview matrix stack
var TIME = 0.0 ; // Realtime
var resetTimerFlag = true ;
var animFlag = false ;

function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse) ;

    Cube.init(program);
    Cylinder.init(9,program);
    Cone.init(9,program) ;
    Sphere.init(36,program) ;

    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );

    
    document.getElementById("sliderXi").onchange = function() {
        RX = this.value ;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderYi").onchange = function() {
        RY = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderZi").onchange = function() {
        RZ =  this.value;
        window.requestAnimFrame(render);
    };

    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
        console.log(animFlag) ;
    };

    
    render();
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;
    
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV() ;
    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV() ;
    Sphere.draw() ;
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV() ;
    Cylinder.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV() ;
    Cone.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x,y,z) {
    modelViewMatrix = mult(modelViewMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta,x,y,z) {
    modelViewMatrix = mult(modelViewMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx,sy,sz) {
    modelViewMatrix = mult(modelViewMatrix,scale(sx,sy,sz)) ;
}

// Pops MVS and stores the result as the current modelViewMatrix
function gPop() {
    modelViewMatrix = MVS.pop() ;
}

// pushes the current modelViewMatrix in the stack MVS
function gPush() {
    MVS.push(modelViewMatrix) ;
}

var prevTime = 0.0 ;
//Function render contains all my added code.
function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    eye = vec3(0,0,10);
    MVS = [] ; // Initialize modelviewmatrix stack
    
    modelViewMatrix = mat4() ;
    
    modelViewMatrix = mult(modelViewMatrix,lookAt(eye, at , up));
    
    
    
    gRotate(RZ,0,0,1) ;
    gRotate(RY,0,1,0) ;
    gRotate(RX,1,0,0) ;
    
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    
    setAllMatrices() ;
    
    var curTime ;
    if( animFlag )
    {
        curTime = (new Date()).getTime() /1000 ;
        if( resetTimerFlag ) {
            prevTime = curTime ;
            resetTimerFlag = false ;
        }
        TIME = TIME + curTime - prevTime ;
        prevTime = curTime ;
    }
   
    gPush() ;
    {   
    	//I first create the fish then move lower to place the first rock.
    	fishcreator();
    	gTranslate(0,-1.3,0) ;
    	gScale(0.5,0.5,0.5)
    	setColor(vec4(0.5,0.5,0.5,0.5)) ;
        drawSphere();
        
        //I place the second sphere half as big as the first one on the left 
        //of the first one -1.5 in the x-axis with a translation of -0.5 
        //in the y-axis to get it on the floor
        gTranslate(-1.5,-0.5,0) ;
    	gScale(0.5,0.5,0.5)
    	setColor(vec4(0.5,0.5,0.5,0.5)) ;
        drawSphere();
        
        //I finally place the left and right seaweed column on the sides 
        //of the sphere starting in the middle
        gTranslate(1,0.0,-0.5) ;
        seaweed();
        gTranslate(4,0.0,-0.5) ;
        seaweed();
        
        //I finally place the middle seaweed column and make it rotate with 
        //a phase of 2*pi to recreate the movement. 
        gTranslate(-2,2,0.0) ;
        gRotate(4*Math.cos(TIME + (2*3.14159)), 0, 0, 1);
        seaweed();
     }
    gPop() ;


//Sea Floor box creation. With a y translation of -2 below origin. Scaled 
//to be 10 times bigger in length (x-axis) and 0.2 time smaller in thickness 
//(y-axis). A scale of 40 is used for the depth of the floor.  
MVS.push(modelViewMatrix) ;
   {
        gTranslate(0,-2,0) ;
        gScale(10,-0.2,40)
        setColor(vec4(0.2,0.6,0.3,0.0)) ;
        drawCube() ;
    }
    modelViewMatrix = MVS.pop() ;
    
//These are helper functions created in their own reference coordinate system 
//and then later adjusted to the main coordinate system when they are called
function fishcreator()
{
    gPush() ;
    {
    gRotate(-TIME*180/(2*3.14159),0,1,0) ;
       gTranslate(2.5,Math.cos(TIME),2) ;
       gPush();
       {
       	       //The face of the fish is first created with an off-white color 
       	       //and affine scale of 0.5 to make it smaller. 
       	       gScale(0.5, 0.5, 0.5);
       	       setColor(vec4(0.9,0.9,0.9,0.9)) ;
       	       drawCone() ;
       	       //The body of the fish is completed with a tummy in the shape 
       	       //of a cone placed at the end of the fish face and rotated 
       	       //180 degrees in the x-axis. 
       	       gTranslate(0,0,-2) ;
       	       gScale(1, 1, 3);
       	       gRotate(180,1,0,0) ; 
       	       setColor(vec4(1.0,0.0,0.0,1.0)) ;
       	       drawCone() ;
       	       
       	       // The fish fins are finally added with proper translation, 
       	       //rotation, scale and sinusoidal animation for the tail wiggle. 
       	       gTranslate(0,0,0.5);
       	       gRotate(180,1,0,0) ;
       	       gScale(0.3,0.3,0.3);
       	       gRotate(50*Math.cos(10*TIME), 0, 1, 0);
       	       fishfins();
       }
       gPop();
       
       //The fish is composed of two eyeballs. I scaled them down to fit 
       //the face of the fish and translated them to be positionned at each side
      gScale(0.12, 0.12, 0.12);
      gTranslate(2,1.2,0)
      fisheyes();
      gTranslate(-4.25,0,0)
      fisheyes();
    }
   gPop() ;
 }
 
 //A fish eye is composed of a white sphere with another black sphere 
 //in the front +1 z-axis to represent the pupil.
 function fisheyes()
 {
 	 gPush();
 	 {
 	 	 setColor(vec4(1.0,1.0,1.0,1.0)) ;
 	 	 drawSphere();    
 	 	 gTranslate(0,0,1);
 	 	 gScale(0.4, 0.4, 0.4);
 	 	 setColor(vec4(0.0,0.0,0.0,0.0)) ;
 	 	 drawSphere();    
 	 }
 	 gPop();
 }
 
 //The same procedure as the fish body is used to create a fin.
 function fin()
 {
 	gPush();	 
 	gScale(0.5, 0.5, 0.5);
       setColor(vec4(0.9,0.9,0.9,0.9)) ;
       drawCone() ;
       
       gTranslate(0,0,-2) ;
       gScale(1, 1, 3);
       gRotate(180,1,0,0) ; 
       setColor(vec4(1.0,0.0,0.0,1.0)) ;
       drawCone() ;
       gPop();
 }
 
 //The first fin is rotated in the x-axis by 60 degrees and then scaled in 
 //z -axis to make it longer. The second fin is rotated -45 degrees in the x-axis
 function fishfins()
 {
     gPush();
     {	 
     	     gRotate(60, 1,0,0);
     	     gScale(1,1,2);
     	     fin();
     }
     gPop(); 
        gPush();
     {	 
     	     gRotate(-45, 1,0,0);
     	     fin();
     }
     gPop();      
}

//Method to create a single seaweed leaf. Scaled to be thinner on the x and 
//z-axis and green color. 
function seaweedcreator() 
{    
    gPush() ;
    {
        gScale(0.3,1,0.2)
        setColor(vec4(0.0,1.0,0.0,0.5)) ;
        drawSphere();
    }
    gPop() ;
}

//Method to create a seaweed column of 10 leaves with a cosine z-rotation 
//of each leaf having a phase shift compared to each other to recreate the 
//wiggle. We also translate the next leaf to be positioned +2 in the y-axis 
//to have the column.
function seaweed()
{
    gPush() ;
    {   
    	 for(i=0; i<10; i++)
    	 {
    	 	 gTranslate(0,2,0);	
    	 	 gRotate(10*Math.cos(TIME + (i*0.4*3.14159)), 0, 0, 1);
    	 	 seaweedcreator(); 	    
    	 }
    }
    gPop() ;
  }
   
    if( animFlag )
        window.requestAnimFrame(render);
}
