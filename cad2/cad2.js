"use strict";

var canvas;
var gl;
var program;

var shapes = [];
var maxNumShapes = 7;
var nextShapeId = { "cone" : 1, "cylinder" : 1, "sphere" : 1 };
var currentShape = undefined;

var camera, dLight, pLight;

var axes; //for drawing axis lines

var vBuffer, nBuffer;
var vPosition, vNormal;

var eyeLoc;

var normalMatrixLoc, modelViewMatrixLoc, projectionMatrixLoc;

var ambientProdDLoc, diffuseProdDLoc, specularProdDLoc, 
    ambientProdPLoc, diffuseProdPLoc, specularProdPLoc, 
    dLightPositionLoc, pLightPositionLoc, shininessLoc;


window.onload = function init() {
  setUpWebGL();
  setupGlobalElements();
  setUpShadersAndAttributes();
  initEventHandlers();
  render();
};


// ------------------------------------------------------
//                 WebGL Functionality
// ------------------------------------------------------

function setUpWebGL() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) alert("WebGL isn't available");
  
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 2.0);
}

function setupGlobalElements() {
  axes = [new Xaxis(), new Yaxis(), new Zaxis()];
  camera = new Camera();
  dLight = new Light(0.0, -10.0);
  pLight = new Light(Math.PI, 10.0);
}

function setUpShadersAndAttributes() {
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  vBuffer = gl.createBuffer();
  nBuffer = gl.createBuffer();

  vPosition = gl.getAttribLocation( program, "vPosition" );
  vNormal = gl.getAttribLocation( program, "vNormal" );

  eyeLoc = gl.getUniformLocation(program, "eyePosition");

  modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
  projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
  normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

  ambientProdDLoc = gl.getUniformLocation( program, "ambientProdD" );
  diffuseProdDLoc = gl.getUniformLocation( program, "diffuseProdD" );
  specularProdDLoc = gl.getUniformLocation( program, "specularProdD" );
  ambientProdPLoc = gl.getUniformLocation( program, "ambientProdP" );
  diffuseProdPLoc = gl.getUniformLocation( program, "diffuseProdP" );
  specularProdPLoc = gl.getUniformLocation( program, "specularProdP" );
  shininessLoc = gl.getUniformLocation( program, "shininess" );

  dLightPositionLoc = gl.getUniformLocation( program, "dLightPosition" );
  pLightPositionLoc = gl.getUniformLocation( program, "pLightPosition" );
  
}

function initEventHandlers() {
  setLightingHandlers();
  resetSliders();

  // Add shapes
  document.getElementById("addCone").addEventListener("click", addCone);
  document.getElementById("addCylinder").addEventListener("click", addCylinder);
  document.getElementById("addSphere").addEventListener("click", addSphere);

  // Remove shapes
  document.getElementById("removeShape").addEventListener("click", removeShape);
  document.getElementById("clearShapes").addEventListener("click", clearShapes);

  // Scaling
  document.getElementById("xScale").onchange = updateSizeX;
  document.getElementById("xScale").oninput = updateSizeX;
  document.getElementById("yScale").onchange = updateSizeY;
  document.getElementById("yScale").oninput = updateSizeY;
  document.getElementById("zScale").onchange = updateSizeZ;
  document.getElementById("zScale").oninput = updateSizeZ;
  document.getElementById("allScale").oninput = updateSizeAll;
  document.getElementById("allScale").onchange = updateSizeAll;

  // Rotation
  document.getElementById("xRot").onchange = updateThetaX;
  document.getElementById("xRot").oninput = updateThetaX;
  document.getElementById("yRot").onchange = updateThetaY;
  document.getElementById("yRot").oninput = updateThetaY;
  document.getElementById("zRot").onchange = updateThetaZ;
  document.getElementById("zRot").oninput = updateThetaZ;

  // Translation
  document.getElementById("xTrans").onchange = updateDistanceX;
  document.getElementById("xTrans").oninput = updateDistanceX;
  document.getElementById("yTrans").onchange = updateDistanceY;
  document.getElementById("yTrans").oninput = updateDistanceY;
  document.getElementById("zTrans").onchange = updateDistanceZ;
  document.getElementById("zTrans").oninput = updateDistanceZ;

  // Colors
  document.getElementById("ambient").onchange = updateAmbient;
  document.getElementById("ambient").oninput = updateAmbient;
  document.getElementById("diffuse").onchange = updateDiffuse;
  document.getElementById("diffuse").oninput = updateDiffuse;
  document.getElementById("specular").onchange = updateSpecular;
  document.getElementById("specular").oninput = updateSpecular;
  document.getElementById("shininess").onchange = updateShininess;
  document.getElementById("shininess").oninput = updateShininess;

  // Camera
  document.getElementById("thetaCamScale").onchange = updateThetaCam;
  document.getElementById("thetaCamScale").oninput = updateThetaCam;
  document.getElementById("phiCamScale").onchange = updatePhiCam;
  document.getElementById("phiCamScale").oninput = updatePhiCam;
  document.getElementById("rCamScale").onchange = updateRCam;
  document.getElementById("rCamScale").oninput = updateRCam;

  // Lighting
  document.getElementById("ambientD").onchange = updateAmbientD;
  document.getElementById("ambientD").oninput = updateAmbientD;
  document.getElementById("diffuseD").onchange = updateDiffuseD;
  document.getElementById("diffuseD").oninput = updateDiffuseD;
  document.getElementById("specularD").onchange = updateSpecularD;
  document.getElementById("specularD").oninput = updateSpecularD;
  document.getElementById("ambientP").onchange = updateAmbientP;
  document.getElementById("ambientP").oninput = updateAmbientP;
  document.getElementById("diffuseP").onchange = updateDiffuseP;
  document.getElementById("diffuseP").oninput = updateDiffuseP;
  document.getElementById("specularP").onchange = updateSpecularP;
  document.getElementById("specularP").oninput = updateSpecularP;

  document.getElementById("strengthP").onchange = updateStrengthP;
  document.getElementById("strengthP").oninput = updateStrengthP;
  document.getElementById("strengthD").onchange = updateStrengthD;
  document.getElementById("strengthD").oninput = updateStrengthD;

  document.getElementById("toggleD").addEventListener("click", toggleD);
  document.getElementById("toggleP").addEventListener("click", toggleP);

  document.getElementById("distanceP").onchange = updateDistanceP;
  document.getElementById("distanceP").oninput = updateDistanceP;
  document.getElementById("distanceD").onchange = updateDistanceD;
  document.getElementById("distanceD").oninput = updateDistanceD;

  document.getElementById("positionP").onchange = updatePositionP;
  document.getElementById("positionP").oninput = updatePositionP;
  document.getElementById("positionD").onchange = updatePositionD;
  document.getElementById("positionD").oninput = updatePositionD;

  document.getElementById("toggleAnimD").addEventListener("click", toggleAnimationD);
  document.getElementById("toggleAnimP").addEventListener("click", toggleAnimationP);
}


function render() {
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  loadCamera();
  loadLighting();

  axes.forEach(function(axis) {
    renderAxis(axis);
  });

  shapes.forEach(function(shape) {
    renderShape(shape);
  });

  requestAnimFrame( render );
}

function loadCamera() {
  gl.uniform3fv( eyeLoc, flatten( camera.eye() ));
  gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten( camera.ortho() ) );
}

function loadLighting() {
  dLight.move();
  pLight.move();

  document.getElementById("positionD").value = dLight.theta;
  document.getElementById("positionP").value = pLight.theta;

  gl.uniform4fv( dLightPositionLoc, flatten( dLight.position() ) );
  gl.uniform4fv( pLightPositionLoc, flatten( pLight.position() ) );
}

function renderAxis(axis) {
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(axis.points), gl.STATIC_DRAW );
  gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  var modelView = camera.lookAt();
  gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( modelView ) );
  var normalMatrix = [
    vec3(modelView[0][0], modelView[0][1], modelView[0][2]),
    vec3(modelView[1][0], modelView[1][1], modelView[1][2]),
    vec3(modelView[2][0], modelView[2][1], modelView[2][2])];

  gl.uniformMatrix3fv(normalMatrixLoc, false, flatten( normalMatrix ) );

  gl.uniform4fv( ambientProdDLoc,flatten( axis.color ) );
  gl.uniform4fv( diffuseProdDLoc,flatten( vec4( 0.0, 0.0, 0.0, 1.0) ) );
  gl.uniform4fv( specularProdDLoc,flatten( vec4( 0.0, 0.0, 0.0, 1.0) ) );
  gl.uniform4fv( ambientProdPLoc,flatten( axis.color ) );
  gl.uniform4fv( diffuseProdPLoc,flatten( vec4( 0.0, 0.0, 0.0, 1.0) ) );
  gl.uniform4fv( specularProdPLoc,flatten( vec4( 0.0, 0.0, 0.0, 1.0) ) );
  gl.uniform1f( shininessLoc, 0.0 );

  gl.drawArrays( gl.LINES, 0, 2 );
}

function renderShape(shape) {
  // Position
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(shape.points), gl.STATIC_DRAW );
  gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  // Normal
  gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData( gl.ARRAY_BUFFER, flatten(shape.normalPoints), gl.STATIC_DRAW );
  gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vNormal );

  // Model view matrix
  var modelView = camera.lookAt();
  modelView = mult(modelView, translate(shape.distance));
  modelView = mult(modelView, rotate( shape.theta[0], [1, 0, 0] ));
  modelView = mult(modelView, rotate( shape.theta[1], [0, 1, 0] ));
  modelView = mult(modelView, rotate( shape.theta[2], [0, 0, 1] ));
  modelView = mult(modelView, scaleMat3( shape.size[0], shape.size[1], shape.size[2] ));
  gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( modelView ) );

  // Normal matrix
  var normalMat = transpose( inverseMat3( flatten(modelView) ) );
  gl.uniformMatrix3fv(normalMatrixLoc, false, flatten( normalMat ) );

  // Lighting
  gl.uniform4fv( ambientProdDLoc,flatten( dLight.ambientProduct(shape.ambient) ) );
  gl.uniform4fv( diffuseProdDLoc,flatten( dLight.diffuseProduct(shape.diffuse) ) );
  gl.uniform4fv( specularProdDLoc,flatten( dLight.specularProduct(shape.specular) ) );
  gl.uniform4fv( ambientProdPLoc,flatten( pLight.ambientProduct(shape.ambient) ) );
  gl.uniform4fv( diffuseProdPLoc,flatten( pLight.diffuseProduct(shape.diffuse) ) );
  gl.uniform4fv( specularProdPLoc,flatten( pLight.specularProduct(shape.specular) ) );
  gl.uniform1f( shininessLoc, shape.shininess );

  // Draw
  for (var i = 0; i < shape.points.length; i += 3 ) {
    gl.drawArrays( gl.TRIANGLES, i, 3 );
  }
}

function setLightingHandlers() {
  document.getElementById("ambientD").value = colorVec4ToHex(dLight.ambient);
  document.getElementById("diffuseD").value = colorVec4ToHex(dLight.diffuse);
  document.getElementById("specularD").value = colorVec4ToHex(dLight.specular);
  document.getElementById("ambientP").value = colorVec4ToHex(pLight.ambient);
  document.getElementById("diffuseP").value = colorVec4ToHex(pLight.diffuse);
  document.getElementById("specularP").value = colorVec4ToHex(pLight.specular);
  
  document.getElementById("strengthD").value = dLight.strength;
  document.getElementById("strengthP").value = pLight.strength;
  document.getElementById("positionD").value = dLight.theta;
  document.getElementById("positionP").value = pLight.theta;
  document.getElementById("distanceD").value = -dLight.xOffset;
  document.getElementById("distanceP").value = pLight.xOffset;
}

function resetSliders() {
  var shape = new Shape();
  setScaleSliders(shape);
  document.getElementById("allScale").value = shape.size[1.0];

  setRotSliders(shape);
  setTransSliders(shape);
  setColorSliders(shape);
}

function setSliders(shape) {
  setScaleSliders(shape);
  setRotSliders(shape);
  setTransSliders(shape);
  setColorSliders(shape);
}

function setScaleSliders(shape) {
  document.getElementById("xScale").value = shape.size[0];
  document.getElementById("yScale").value = shape.size[1];
  document.getElementById("zScale").value = shape.size[2];
}

function setRotSliders(shape) {
  document.getElementById("xRot").value = shape.theta[0];
  document.getElementById("yRot").value = shape.theta[1];
  document.getElementById("zRot").value = shape.theta[2];
}

function setTransSliders(shape) {
  document.getElementById("xTrans").value = shape.distance[0];
  document.getElementById("yTrans").value = shape.distance[1];
  document.getElementById("zTrans").value = shape.distance[2];
}

function setColorSliders(shape) {
  document.getElementById("ambient").value = colorVec4ToHex(shape.ambient);
  document.getElementById("diffuse").value = colorVec4ToHex(shape.diffuse);
  document.getElementById("specular").value = colorVec4ToHex(shape.specular);
  document.getElementById("shininess").value = 505 - shape.shininess;
}


// ------------------------------------------------------
//                       Shapes
// ------------------------------------------------------

var Shape = function () {
  this.name = undefined;
  this.points = [];
  this.normalPoints = [];

  this.distance = [ 0.0, 0.0, 0.0 ];
  this.theta = [ 180, 180, 180 ];
  this.size = [ 1.0, 1.0, 1.0 ];

  this.color = randomColor(); // random default color
  this.ambient = randomColor();
  this.diffuse = randomColor();
  this.specular = randomColor();
  this.shininess = 200;
  
  this.makeCircle = function(height) {
    var steps = 64;
    var phi = 2.0 * Math.PI / steps;
    var vecs = [];

    for (var i = 0; i < steps; i++) {
      var angle = i * phi;
      vecs.push(vec4( 1.0 * cos(angle), height, 1.0 * sin(angle), 1.0 ));
    }
    vecs.push(vecs[0]);

    return vecs;
  };

  this.pushCircle = function(vecs, mid) {
    for (var i = 0; i < vecs.length - 1; i++) {
      this.pushTriangle( vecs[i], vecs[i + 1], mid );
    }
  };

  this.pushSquare = function(a, b, c, d) {
    this.pushTriangle( a, b, c );
    this.pushTriangle( a, c, d );
  };

  this.pushTriangle = function(a, b, c) {
    var t1 = subtract(b, a);
    var t2 = subtract(c, a);
    var normal = vec4( normalize(cross(t2, t1)) );
    this.pushPoints( a, b, c, normal );
  };

  this.pushPoints = function(a, b, c, normal) {
    this.points.push(a);
    this.points.push(b);
    this.points.push(c);

    this.normalPoints.push(normal);
    this.normalPoints.push(normal);
    this.normalPoints.push(normal);
  };
}

var Cone = function() {
  Shape.call(this);
  this.name = "Cone" + nextShapeId["cone"]++;

  var vTop = vec4( 0.0,  1.0, 0.0, 1.0);
  var vBot = vec4( 0.0, -1.0, 0.0, 1.0);
  var vecs = this.makeCircle(-1.0);

  this.pushCircle(vecs, vTop);
  this.pushCircle(vecs.reverse(), vBot);
}

Cone.prototype = Object.create(Shape.prototype);
Cone.prototype.constructor = Cone;


var Cylinder = function() {
  Shape.call(this);
  this.name = "Cylinder" + nextShapeId["cylinder"]++;

  var vTop = vec4( 0.0,  1.0, 0.0, 1.0);
  var vBot = vec4( 0.0, -1.0, 0.0, 1.0);
  var vecsTop = this.makeCircle(1.0);
  var vecsBot = this.makeCircle(-1.0);

  for (var i = 0; i < vecsTop.length - 1; i++) {
    this.pushSquare( vecsTop[i + 1], vecsTop[i], vecsBot[i], vecsBot[i + 1] );
  }
  this.pushCircle(vecsTop, vTop);
  this.pushCircle(vecsBot.reverse(), vBot);
}

Cylinder.prototype = Object.create(Shape.prototype);
Cylinder.prototype.constructor = Cylinder;


var Sphere = function() {
  Shape.call(this);
  this.name = "Sphere" + nextShapeId["sphere"]++;

  this.divideTriangle = function (a, b, c, num) {
    if ( num == 0 ) {
      this.pushTriangle( a, b, c );
    } else {
      var ab = mix(a, b, 0.5);
      var ac = mix(a, c, 0.5);
      var bc = mix(b, c, 0.5);

      ab = normalize(ab, true);
      ac = normalize(ac, true);
      bc = normalize(bc, true);

      --num;
      this.divideTriangle(a, ab, ac, num);
      this.divideTriangle(ab, b, bc, num);
      this.divideTriangle(bc, c, ac, num);
      this.divideTriangle(ab, bc, ac, num);
    }
  };

  var a = vec4(0.0, 0.0, -1.0,1);
  var b = vec4(0.0, 0.942809, 0.333333, 1);
  var c = vec4(-0.816497, -0.471405, 0.333333, 1);
  var d = vec4(0.816497, -0.471405, 0.333333,1);
  var n = 5;
  
  this.divideTriangle(a, b, c, n);
  this.divideTriangle(d, c, b, n);
  this.divideTriangle(a, d, b, n);
  this.divideTriangle(a, c, d, n);
}

Sphere.prototype = Object.create(Shape.prototype);
Sphere.prototype.constructor = Sphere;


var Xaxis = function() {
  Shape.call(this);
  this.name = "X";
  this.color = vec4( 1.0, 0.0, 0.0, 0.8 );
  this.points = [ vec4( -100.0, 0.0, 0.0, 1.0 ), vec4( 100.0, 0.0, 0.0, 1.0 ) ];
}

Xaxis.prototype = Object.create(Shape.prototype);
Xaxis.prototype.constructor = Xaxis;


var Yaxis = function() {
  Shape.call(this);
  this.name = "Y";
  this.color = vec4( 0.0, 1.0, 0.0, 0.8 );
  this.points = [ vec4( 0.0, -100.0, 0.0, 1.0 ), vec4( 0.0, 100.0, 0.0, 1.0 ) ];
}

Yaxis.prototype = Object.create(Shape.prototype);
Yaxis.prototype.constructor = Yaxis;


var Zaxis = function() {
  Shape.call(this);
  this.name = "Z";
  this.color = vec4( 0.0, 0.0, 1.0, 0.8 );
  this.points = [ vec4( 0.0, 0.0, -100.0, 1.0 ), vec4( 0.0, 0.0, 100.0, 1.0 ) ];
}

Zaxis.prototype = Object.create(Shape.prototype);
Zaxis.prototype.constructor = Zaxis;


// ------------------------------------------------------
//                        Camera
// ------------------------------------------------------

var Camera = function () {
  this.near = -10;
  this.far = 10;
  this.radius = 6.0;
  this.theta  = 0.0;
  this.phi    = 0.0;

  this.at = vec3(0.0, 0.0, 0.0);
  this.up = vec3(0.0, 1.0, 0.0);

  this.left = -3.0;
  this.right = 3.0;
  this.ytop = 3.0;
  this.bottom = -3.0;

  this.eye = function() {
    return vec3( this.radius * sin(this.theta) * cos(this.phi), 
                 this.radius * sin(this.theta) * sin(this.phi), 
                 this.radius * cos(this.theta) );
  };

  this.lookAt = function() {
    return lookAt( this.eye(), this.at, this.up );
  };

  this.ortho = function() {
    return ortho( this.left, this.right, this.bottom, this.ytop, this.near, this.far )
  };
}


// ------------------------------------------------------
//                      Lighting
// ------------------------------------------------------

var Light = function (theta, xOffset) {
  this.ambient = vec4( 0.2, 0.2, 0.2, 1.0); //randomColor();
  this.diffuse = randomColor();
  this.specular = randomColor();
  this.strength = 0.8;

  this.theta  = theta;
  this.xOffset = xOffset;
  this.phi    = 0.0;
  this.radius = 10.0;
  this.step = Math.PI / 200;

  this.show = true;
  this.animate = true;

  this.ambientProduct = function(material) {
    if( this.show ) {
      return multVec4withInt( mult(this.ambient, material), this.strength);
    } else return vec4( 0.0, 0.0, 0.0, 1.0 );
  };

  this.diffuseProduct = function(material) {
    if( this.show ) {
      return multVec4withInt( mult(this.diffuse, material), this.strength);
    } else return vec4( 0.0, 0.0, 0.0, 1.0 );
  };

  this.specularProduct = function(material) {
    if( this.show ) {
      return multVec4withInt( mult(this.specular, material), this.strength);
    } else return vec4( 0.0, 0.0, 0.0, 1.0 );
  };

  this.position = function() {
    return vec4( this.xOffset, 
                 this.radius * cos(this.theta),
                 this.radius * sin(this.theta) * cos(this.phi),
                 0.0 );
  };

  this.move = function() {
    if( this.animate ) {
      var fullCircle = 2 * Math.PI;

      this.theta += this.step;
      if( this.theta > fullCircle) {
        this.theta -= fullCircle
      }
    }
  };

  this.updateAmbient = function(color) {
    this.ambient[0] = hexToR( color );
    this.ambient[1] = hexToG( color );
    this.ambient[2] = hexToB( color );
  }

  this.updateDiffuse = function(color) {
    this.diffuse[0] = hexToR( color );
    this.diffuse[1] = hexToG( color );
    this.diffuse[2] = hexToB( color );
  }

  this.updateSpecular = function(color) {
    this.specular[0] = hexToR( color );
    this.specular[1] = hexToG( color );
    this.specular[2] = hexToB( color );
  }

  this.toggle = function() {
    this.show = !this.show;
  }

  this.toggleAnimation = function() {
    this.animate = !this.animate;
    if (this.animate) this.theta = 0.0;
  }
}

// ------------------------------------------------------
//            Add / Remove / Select Shapes
// ------------------------------------------------------

function addCone() {
  addShape(new Cone());
}

function addCylinder() {
  addShape(new Cylinder());
}

function addSphere() {
  addShape(new Sphere());
}

function addShape(shape) {
  if (shapes.length < maxNumShapes) {
    shapes.push(shape);
    currentShape = shape;

    addShapeChoiceToEditor(shape);
    initShapeChoiceEventHandler(shape);
    setSliders(shape);
  }
}

function removeShape() {
  removeCurrentShape();

  document.getElementById(currentShape.name).parentElement.remove();

  var remainingShapeDivs = document.getElementsByClassName("shape");

  if (remainingShapeDivs.length == 0) {
    removeAllShapesAndHideRemoveButtons();
  } else {
    setCurrentShapeTo(remainingShapeDivs[0].children[0].id);
  }
}

function clearShapes() {
  document.getElementById("existingShapes").innerHTML = "<label>Selected shape</label>";
  removeAllShapesAndHideRemoveButtons();

  console.log("direct: " + dLight.position());
  console.log("point: " + pLight.position());
}

function removeCurrentShape() {
  var newShapes = [];
  shapes.forEach(function(shape) {
    if (shape.name != currentShape.name) newShapes.push(shape);
  });
  shapes = newShapes;
}

function setCurrentShapeTo(name) {
  shapes.forEach(function(shape) {
    if (shape.name == name) {
      currentShape = shape;
      setSliders(shape);
    }
  });
}

function removeAllShapesAndHideRemoveButtons() {
  document.getElementById("existingShapes").className += " hidden";
  document.getElementById("removeShapes").className += " hidden";
  currentShape = undefined;
  nextShapeId = { "cone" : 1, "cylinder" : 1, "sphere" : 1 };
  shapes = [];
  resetSliders();
}

function addShapeChoiceToEditor(shape) {
  var shapeChoice = "<input id='" + shape.name + "' type='radio' name='shape' value='" + shape.name + "' checked='true'>";
  shapeChoice += "<span>'" + shape.name + "'</span>";

  var shapeNode = document.createElement("span");
  shapeNode.className = "shape";
  shapeNode.innerHTML = shapeChoice;
  
  var existingShapes = document.getElementById("existingShapes");
  existingShapes.appendChild(shapeNode);
  existingShapes.className = "option";
  document.getElementById("removeShapes").className = "option";
}

function initShapeChoiceEventHandler(shape) {
  document.getElementById(shape.name).onchange = function() {
    currentShape = shape;
    setSliders(shape);
  };
}


// ------------------------------------------------------
//                  Transform Shapes
// ------------------------------------------------------

function updateSizeX(e) {
  updateSize(0, (e.target || e.srcElement).value);
}

function updateSizeY(e) {
  updateSize(1, (e.target || e.srcElement).value);
}

function updateSizeZ(e) {
  updateSize(2, (e.target || e.srcElement).value);
}

function updateSizeAll(e) {
  updateSizeX(e);
  updateSizeY(e);
  updateSizeZ(e);

  if(currentShape != undefined) setScaleSliders(currentShape);
}

function updateThetaX(e) {
  updateTheta(0, (e.target || e.srcElement).value);
}

function updateThetaY(e) {
  updateTheta(1, (e.target || e.srcElement).value);
}

function updateThetaZ(e) {
  updateTheta(2, (e.target || e.srcElement).value);
}

function updateDistanceX(e) {
  updateDistance(0, (e.target || e.srcElement).value);
}

function updateDistanceY(e) {
  updateDistance(1, (e.target || e.srcElement).value);
}

function updateDistanceZ(e) {
  updateDistance(2, (e.target || e.srcElement).value);
}

function updateSize(axis, value) {
  if(currentShape != undefined) updateTransformation(currentShape.size, axis, value);
}

function updateTheta(axis, value) {
  if(currentShape != undefined) updateTransformation(currentShape.theta, axis, value);
}

function updateDistance(axis, value) {
  if(currentShape != undefined) updateTransformation(currentShape.distance, axis, value);
}

function updateTransformation(transformation, axis, value) {
  transformation[axis] = value;
}

function updateAmbient(e) {
  if(currentShape != undefined) {
    var hexColor = (e.target || e.srcElement).value;

    currentShape.ambient[0] = hexToR( hexColor );
    currentShape.ambient[1] = hexToG( hexColor );
    currentShape.ambient[2] = hexToB( hexColor );
  }
}

function updateDiffuse(e) {
  if(currentShape != undefined) {
    var hexColor = (e.target || e.srcElement).value;

    currentShape.diffuse[0] = hexToR( hexColor );
    currentShape.diffuse[1] = hexToG( hexColor );
    currentShape.diffuse[2] = hexToB( hexColor );
  }
}

function updateSpecular(e) {
  if(currentShape != undefined) {
    var hexColor = (e.target || e.srcElement).value;

    currentShape.specular[0] = hexToR( hexColor );
    currentShape.specular[1] = hexToG( hexColor );
    currentShape.specular[2] = hexToB( hexColor );
  }
}

function updateShininess(e) {
  if(currentShape != undefined) currentShape.shininess = 505 - (e.target || e.srcElement).value;
}

// ------------------------------------------------------
//                       Camera
// ------------------------------------------------------

function updateThetaCam(e) {
  camera.theta = (e.target || e.srcElement).value;
}

function updatePhiCam(e) {
  camera.phi = (e.target || e.srcElement).value;
}

function updateRCam(e) {
  camera.radius = (e.target || e.srcElement).value;
}

// ------------------------------------------------------
//                       Lighting
// ------------------------------------------------------

function updateAmbientD(e) {
  dLight.updateAmbient( (e.target || e.srcElement).value );
}

function updateDiffuseD(e) {
  dLight.updateDiffuse( (e.target || e.srcElement).value );
}

function updateSpecularD(e) {
  dLight.updateSpecular( (e.target || e.srcElement).value );
}

function updateAmbientP(e) {
  pLight.updateAmbient( (e.target || e.srcElement).value );
}

function updateDiffuseP(e) {
  pLight.updateDiffuse( (e.target || e.srcElement).value );
}

function updateSpecularP(e) {
  pLight.updateSpecular( (e.target || e.srcElement).value );
}

function updateStrengthP(e) {
  pLight.strength = (e.target || e.srcElement).value;
  if (!pLight.show) pLight.toggle();
}

function updateStrengthD(e) {
  dLight.strength = (e.target || e.srcElement).value;
  if (!dLight.show) dLight.toggle();
}

function toggleD() {
  dLight.toggle();
  if (!dLight.show) {
    dLight.strength = 0;
    document.getElementById("strengthD").value = dLight.strength;
  }
}

function toggleAnimationD() {
  dLight.toggleAnimation();
}

function toggleP() {
  pLight.toggle();
  if (!pLight.show) {
    pLight.strength = 0;
    document.getElementById("strengthP").value = pLight.strength;
  }
}

function toggleAnimationP() {
  pLight.toggleAnimation();
}

function updatePositionD(e) {
  dLight.animate = false;
  dLight.theta = (e.target || e.srcElement).value;
}

function updatePositionP(e) {
  pLight.animate = false;
  pLight.theta = (e.target || e.srcElement).value;
}

function updateDistanceD(e) {
  dLight.xOffset = -(e.target || e.srcElement).value;
}

function updateDistanceP(e) {
  pLight.xOffset = (e.target || e.srcElement).value;
}

// ------------------------------------------------------
//                         Misc
// ------------------------------------------------------

function sin(x) {
  return Math.sin(x);
}

function cos(x) {
  return Math.cos(x);
}

function inverseMat3(a) {
  var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
      a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
      a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
      a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

      b00 = a00 * a11 - a01 * a10,
      b01 = a00 * a12 - a02 * a10,
      b02 = a00 * a13 - a03 * a10,
      b03 = a01 * a12 - a02 * a11,
      b04 = a01 * a13 - a03 * a11,
      b05 = a02 * a13 - a03 * a12,
      b06 = a20 * a31 - a21 * a30,
      b07 = a20 * a32 - a22 * a30,
      b08 = a20 * a33 - a23 * a30,
      b09 = a21 * a32 - a22 * a31,
      b10 = a21 * a33 - a23 * a31,
      b11 = a22 * a33 - a23 * a32,

      // Calculate the determinant
      det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det) return null; 

  det = 1.0 / det;

  var out = mat3();
  out[0][0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1][1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[2][2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

  out[1][0] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[1][1] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[1][2] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

  out[2][0] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[2][1] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[2][2] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

  return out;
};

function scaleMat3( x, y, z )
{
    if ( Array.isArray(x) && x.length == 3 ) {
        z = x[2];
        y = x[1];
        x = x[0];
    }

    var result = mat4();
    result[0][0] = x;
    result[1][1] = y;
    result[2][2] = z;

    return result;
};

function multVec4withInt(v, i) {
  return vec4(v[0] * i, v[1] * i, v[2] * i, v[3]);
}

function randomColor() {
  return [Math.random(), Math.random(), Math.random(), 1.0];
}

function colorVec4ToHex(color) {
  return '#' + rgbToHex( Math.floor(color[0] * 255), Math.floor(color[1] * 255), Math.floor(color[2] * 255) );
}

function hexToR(h) { return parseInt((cutHex(h)).substring(0, 2), 16) / 255 }
function hexToG(h) { return parseInt((cutHex(h)).substring(2, 4), 16) / 255 }
function hexToB(h) { return parseInt((cutHex(h)).substring(4, 6), 16) / 255 }
function cutHex(h) { return (h.charAt(0) == "#") ? h.substring(1, 7) : h }

function rgbToHex(R,G,B) { return toHex(R) + toHex(G) + toHex(B) }
function toHex(n) {
  n = parseInt(n,10);
  if (isNaN(n)) return "00";
  n = Math.max(0,Math.min(n,255));
  return "0123456789ABCDEF".charAt((n-n%16)/16) + "0123456789ABCDEF".charAt(n%16);
}