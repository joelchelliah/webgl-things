"use strict";

var canvas;
var gl;
var points = [];
var thetaLoc;

var numSubdivisions;
var theta;
var scale = 0.7;

window.onload = function init() {
  numSubdivisions = document.getElementById("divisions-slider").value;
  theta = document.getElementById("theta-slider").value;

  setUpWebGL();
  initEventHandlers();
  render();
};


function setUpWebGL() {
  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) alert("WebGL isn't available");
  
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
}

function initEventHandlers() {
  document.getElementById("theta-slider").onchange = function(e) {
    var target = e.target || e.srcElement;
    theta = target.value;
    render();
  };
  document.getElementById("divisions-slider").onchange = function(e) {
    var target = e.target || e.srcElement;
    numSubdivisions = target.value;
    render();
  };
  document.getElementById("tri-radio").onchange = render;
  document.getElementById("sqr-radio").onchange = render;
  document.getElementById("str-radio").onchange = render;
  document.getElementById("flw-radio").onchange = render;
}

function render() {
  createPoints();
  setUpShadersAndLoadData();
  
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(thetaLoc, theta);
  gl.drawArrays(gl.TRIANGLES, 0, points.length);
}


function createPoints() {
  points = [];
  if (document.getElementById("sqr-radio").checked) {
    createSquarePoints();
  } else if (document.getElementById("str-radio").checked) {
    createStarPoints();
  } else if (document.getElementById("flw-radio").checked) {
    createFlowerPoints();
  } else {
    createTrianglePoints();
  }
}

function createTrianglePoints() {
  var l = 1.0 * scale;
  
  divideTriangle(vec2(-l, -l), vec2(0, l), vec2(l, -l), numSubdivisions);
}

function createSquarePoints() {
  var l = 1.0 * scale;
  
  divideSquare(vec2(-l, -l), vec2(-l, l), vec2(l, l), vec2(l, -l), numSubdivisions);
}

function createStarPoints() {
  var l1 = 1.0 * scale;
  var l2 = 0.25 * scale;

  divideStar(vec2(-l1, 0), vec2(-l2, -l2), vec2(0, -l1), 
   vec2(l2, -l2), vec2(l1, 0), vec2(l2, l2), 
   vec2(0, l1), vec2(-l2, l2), numSubdivisions);
}

function createFlowerPoints() {
  var l1 = 1.0 * scale;
  var l2 = 0.4 * scale;
  var l3 = 0.6 * scale;
  var l4 = 0.25 * scale;

  var outerVecs = [[vec2(-l1, -l2), vec2(-l3, -l3), vec2(-l2, 0)],
  [vec2(-l3, -l3), vec2(-l2, -l1), vec2(0, -l2)],
  [vec2(0, -l2), vec2(l2, -l1), vec2(l3, -l3)],
  [vec2(l3, -l3), vec2(l1, -l2), vec2(l2, 0)],
  [vec2(l2, 0), vec2(l1, l2), vec2(l3, l3)],
  [vec2(l3, l3), vec2(l2, l1), vec2(0, l2)],
  [vec2(0, l2), vec2(-l2, l1), vec2(-l3, l3)],
  [vec2(-l3, l3), vec2(-l1, l2), vec2(-l2, 0)]];

  var innerVecs = [[vec2(-l2, 0), vec2(0, -l2), vec2(0, -l4), vec2(-l4, 0)],
  [vec2(0, -l2), vec2(l2, 0), vec2(l4, 0), vec2(0, -l4)],
  [vec2(l2, 0), vec2(0, l2), vec2(0, l4), vec2(l4, 0)],
  [vec2(0, l2), vec2(-l2, 0), vec2(-l4, 0), vec2(0, l4)]];

  outerVecs.forEach(function(vecs) {
    divideTriangle(vecs[0], vecs[1], vecs[2], numSubdivisions);
  });
  innerVecs.forEach(function(vecs) {
    divideSquare(vecs[0], vecs[1], vecs[2], vecs[3], numSubdivisions);
  });
}

function divideTriangle(a, b, c, count) {
  if (count < 1) {
    points.push(a, b, c);
  } else {
    var ab = mix(a, b, 0.5);
    var ac = mix(a, c, 0.5);
    var bc = mix(b, c, 0.5);

    --count;
    divideTriangle(a, ab, ac, count);
    divideTriangle(c, ac, bc, count);
    divideTriangle(b, bc, ab, count);
    divideTriangle(ab, bc, ac, count);
  }
}

function divideSquare(a, b, c, d, count) {
  if (count < 1) {
    points.push(a, b, d);
    points.push(b, c, d);
  } else {
    var ab = mix(a, b, 0.5);
    var ad = mix(a, d, 0.5);
    var cb = mix(c, b, 0.5);
    var cd = mix(c, d, 0.5);
    var mid = mix(ab, cd, 0.5);

    --count;
    divideSquare(a, ab, mid, ad, count);
    divideSquare(ab, b, cb, mid, count);
    divideSquare(mid, cb, c, cd, count);
    divideSquare(ad, mid, cd, d, count);
  }
}

function divideStar(a, b, c, d, e, f, g, h, count) {
  divideTriangle(a, b, h, count);
  divideTriangle(b, c, d, count);
  divideTriangle(d, e, f, count);
  divideTriangle(h, f, g, count);
  divideSquare(b, d, f, h, count);
}

function setUpShadersAndLoadData() {
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var bufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
  
  thetaLoc = gl.getUniformLocation( program, "theta" );
}