"use strict";

var canvas;
var gl;
var program;

var shapes = [];
var maxNumShapes = 7;
var nextShapeId = { "cone" : 1, "cylinder" : 1, "sphere" : 1 };
var currentShape = undefined;

var l = 0.3; // unit length
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var cBuffer;
var vColor;
var vBuffer;
var vPosition;

var sizeLoc;
var thetaLoc;
var distanceLoc;


window.onload = function init() {
  setUpWebGL();
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
  gl.clearColor(0.95, 0.95, 0.95, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 2.0);
}

function setUpShadersAndAttributes() {
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  cBuffer = gl.createBuffer();
  vBuffer = gl.createBuffer();

  vColor = gl.getAttribLocation( program, "vColor" );
  vPosition = gl.getAttribLocation( program, "vPosition" );

  sizeLoc = gl.getUniformLocation(program, "size");
  thetaLoc = gl.getUniformLocation(program, "theta");
  distanceLoc = gl.getUniformLocation(program, "distance");
}

function initEventHandlers() {
  // Reset sliders
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

  // Other options
  document.getElementById("toggleWireframe").addEventListener("click", toggleWireframe);
  document.getElementById("toggleColors").addEventListener("click", toggleColors);
}


function render() {
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  shapes.forEach(function(shape) {
    loadData(shape);
    gl.drawArrays( gl.TRIANGLES, 0, shape.points.length );

    if( shape.showWireframe ) {
      loadWireFrameData(shape);
      gl.drawArrays( gl.LINE_LOOP, 0, shape.points.length );
    }
  });

  requestAnimFrame( render );
}

function loadData(shape) {
  var colorPoints;

  if( shape.showColors ) {
    colorPoints = shape.colorPoints;
  } else {
    colorPoints = shape.points.map(function() {
      return vec4( 1.0, 1.0, 1.0, 1.0);
    });
  }

  gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(colorPoints), gl.STATIC_DRAW );
  gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );

  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(shape.points), gl.STATIC_DRAW );
  gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  gl.uniform3fv(sizeLoc, shape.size);
  gl.uniform3fv(thetaLoc, shape.theta);
  gl.uniform3fv(distanceLoc, shape.distance);
}

function loadWireFrameData(shape) {
  gl.lineWidth(1);
  var wireFramePoints = shape.points.map(function() {
    return vec4( 0.0, 0.0, 0.0, 1.0);
  });

  gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(wireFramePoints), gl.STATIC_DRAW );
  gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );
}

function resetSliders() {
  var shape = new Shape();
  setScaleSliders(shape);
  setRotSliders(shape);
  setTransSliders(shape);
  document.getElementById("allScale").value = shape.size[1.0];
}
function setSliders(shape) {
  setScaleSliders(shape);
  setRotSliders(shape);
  setTransSliders(shape);
}

function setScaleSliders(shape) {
  document.getElementById("xScale").value = shape.size[xAxis];
  document.getElementById("yScale").value = shape.size[yAxis];
  document.getElementById("zScale").value = shape.size[zAxis];
}

function setRotSliders(shape) {
  document.getElementById("xRot").value = shape.theta[xAxis];
  document.getElementById("yRot").value = shape.theta[yAxis];
  document.getElementById("zRot").value = shape.theta[zAxis];
}

function setTransSliders(shape) {
  document.getElementById("xTrans").value = shape.distance[xAxis];
  document.getElementById("yTrans").value = shape.distance[xAxis];
  document.getElementById("zTrans").value = shape.distance[xAxis];
}


// ------------------------------------------------------
//                       Shapes
// ------------------------------------------------------

var Shape = function () {
  this.name = undefined;
  this.points = [];
  this.colorPoints = [];
  this.distance = [ 0.0, 0.0, 0.0 ];
  this.theta = [ 180, 180, 180 ];
  this.size = [ 1.0, 1.0, 1.0 ];
  this.distanceLoc;
  this.thetaLoc;
  this.sizeLoc;
  this.showWireframe = true;
  this.showColors = true;

  this.makeCircle = function(height) {
    var steps = 32;
    var phi = 2.0 * Math.PI / steps;
    var vecs = [];

    for (var i = 0; i < steps; i++) {
      var angle = i * phi;
      vecs.push(vec4( l * cos(angle), height, l * sin(angle), 1.0 ));
    }
    vecs.push(vecs[0]);

    return vecs;
  };

  this.pushCircle = function(vecs, mid) {
    var c = randomColor();
    for (var i = 0; i < vecs.length - 1; i++) {
      this.pushPoints( [vecs[i], mid, vecs[i + 1]], c );
    }
  };

  this.pushSquare = function(a, b, c, d) {
    var color = randomColor();
    this.pushPoints( [a, b, c], color);
    this.pushPoints( [a, c, d], color);
  };

  this.pushTriangle = function(a, b, c) {
    this.pushPoints( [a, b, c], randomColor() );
  };

  this.pushPoints = function(ps, color) {
    for ( var i = 0; i < ps.length; ++i ) {
      this.points.push( ps[i] );
      this.colorPoints.push(randomColor());
    }
  };
}

var Cone = function() {
  Shape.call(this);
  this.name = "Cone" + nextShapeId["cone"]++;

  var vTop = vec4( 0.0,  l, 0.0, 1.0);
  var vBot = vec4( 0.0, -l, 0.0, 1.0);
  var vecs = this.makeCircle(-l);

  for (var i = 0; i < vecs.length - 1; i++) {
    this.pushTriangle( vecs[i], vTop, vecs[i + 1] );
  }
  this.pushCircle(vecs, vBot);
}

Cone.prototype = Object.create(Shape.prototype);
Cone.prototype.constructor = Cone;


var Cylinder = function() {
  Shape.call(this);
  this.name = "Cylinder" + nextShapeId["cylinder"]++;

  var vTop = vec4( 0.0,  l, 0.0, 1.0);
  var vBot = vec4( 0.0, -l, 0.0, 1.0);
  var vecsTop = this.makeCircle(l);
  var vecsBot = this.makeCircle(-l);

  for (var i = 0; i < vecsTop.length - 1; i++) {
    this.pushSquare( vecsTop[i + 1], vecsTop[i], vecsBot[i], vecsBot[i + 1] );
  }
  this.pushCircle(vecsTop, vTop);
  this.pushCircle(vecsBot, vBot);
}

Cylinder.prototype = Object.create(Shape.prototype);
Cylinder.prototype.constructor = Cylinder;


var Sphere = function() {
  Shape.call(this);
  this.name = "Sphere" + nextShapeId["sphere"]++;

  this.divideTriangle = function (a, b, c, num) {
    if ( num == 0 ) {
      this.pushTriangle( a, b, c);
    } else {
      var ab = normalizeVec(mix(a, b, 0.5));
      var ac = normalizeVec(mix(a, c, 0.5));
      var bc = normalizeVec(mix(b, c, 0.5));

      --num;
      this.divideTriangle(a, ab, ac, num);
      this.divideTriangle(c, ac, bc, num);
      this.divideTriangle(b, bc, ab, num);
      this.divideTriangle(ab, bc, ac, num);
    }
  };

  var v0 = vec4( 0.0, l, 0.0, 1.0 );
  var v1 = vec4( 0.0, 0.0, l, 1.0 );
  var v2 = vec4( l, 0.0, 0.0, 1.0 );
  var v3 = vec4( 0.0, 0.0, -l, 1.0 );
  var v4 = vec4( -l, 0.0, 0.0, 1.0 );
  var v5 = vec4( 0.0, -l, 0.0, 1.0 );
  var steps = 3;

  this.divideTriangle( v0, v1, v2, steps );
  this.divideTriangle( v0, v2, v3, steps );
  this.divideTriangle( v0, v3, v4, steps );
  this.divideTriangle( v0, v4, v1, steps );
  this.divideTriangle( v5, v1, v2, steps );
  this.divideTriangle( v5, v2, v3, steps );
  this.divideTriangle( v5, v3, v4, steps );
  this.divideTriangle( v5, v4, v1, steps );
}

Sphere.prototype = Object.create(Shape.prototype);
Sphere.prototype.constructor = Sphere;


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
    resetSliders();
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
  updateSize(xAxis, (e.target || e.srcElement).value);
}

function updateSizeY(e) {
  updateSize(yAxis, (e.target || e.srcElement).value);
}

function updateSizeZ(e) {
  updateSize(zAxis, (e.target || e.srcElement).value);
}

function updateSizeAll(e) {
  updateSizeX(e);
  updateSizeY(e);
  updateSizeZ(e);

  if(currentShape != undefined) setScaleSliders(currentShape);
}

function updateThetaX(e) {
  updateTheta(xAxis, (e.target || e.srcElement).value);
}

function updateThetaY(e) {
  updateTheta(yAxis, (e.target || e.srcElement).value);
}

function updateThetaZ(e) {
  updateTheta(zAxis, (e.target || e.srcElement).value);
}

function updateDistanceX(e) {
  updateDistance(xAxis, (e.target || e.srcElement).value);
}

function updateDistanceY(e) {
  updateDistance(yAxis, (e.target || e.srcElement).value);
}

function updateDistanceZ(e) {
  updateDistance(zAxis, (e.target || e.srcElement).value);
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


// ------------------------------------------------------
//                     Other options
// ------------------------------------------------------

function toggleWireframe() {
  if(currentShape != undefined) currentShape.showWireframe = !currentShape.showWireframe
}

function toggleColors() {
  if(currentShape != undefined) currentShape.showColors = !currentShape.showColors
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

function normalizeVec(vec) {
  var len = vecLength(vec) / l;
  return vec4(vec[0] / len, vec[1] / len, vec[2] / len, vec[3]);
}

function vecLength(vec) {
  return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
}

function randomColor() {
  return [Math.random(), Math.random(), Math.random(), 1.0];
}
