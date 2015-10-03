"use strict";

var canvas;
var gl;

var bufferId;
var colorBufferId;

var maxNumVertices  = 2000;

var index = 0;
var numIndices = [0];

var colorIndex = 0;
var colors = [
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
];

var point;
var numCurves = 0;
var curveStart = [0];

var mouseDown = false;

// To get the positioning right.
var canvasBrushOffset = [0, 0];


window.onload = function init() {
  setUpWebGL();
  setUpShadersAndLoadData();
  initEventHandlers();

  gl.lineWidth(3);
  gl.clear(gl.COLOR_BUFFER_BIT);
};


function setUpWebGL() {
  canvas = document.getElementById("gl-canvas");
  canvasBrushOffset[0] = 2 * (-8) / canvas.width - 1;
  canvasBrushOffset[1] = 2 * 56 / canvas.height - 1;

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) alert("WebGL isn't available");
  
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.6, 0.6, 0.6, 1.0);
}


function setUpShadersAndLoadData() {
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  bufferId = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
  gl.bufferData( gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.STATIC_DRAW );

  var vPos = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPos, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPos );

  colorBufferId = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, colorBufferId );
  gl.bufferData( gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW );

  var vColor = gl.getAttribLocation( program, "vColor" );
  gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vColor );
}


function initEventHandlers() {
  document.getElementById("thickness-slider").onchange = function(e) {
    var target = e.target || e.srcElement;
    gl.lineWidth(target.value);
    render();
  };

  document.getElementById("red-radio").onchange = function() { colorIndex = 0 };
  document.getElementById("green-radio").onchange = function() { colorIndex = 1 };
  document.getElementById("blue-radio").onchange = function() { colorIndex = 2 };
  document.getElementById("black-radio").onchange = function() { colorIndex = 3 };

  document.getElementById("clearBoard").addEventListener("click", function() {
    index = 0;
    numIndices = [0];
    numCurves = 0;
    curveStart = [0];
    render();
  });

  canvas.addEventListener("mousedown", function(event) {
    mouseDown = true;

    numIndices[numCurves] = 0;
    curveStart[numCurves] = index;
  });

  canvas.addEventListener("mouseup", function(event) {
    mouseDown = false;

    numCurves++;
  });

  canvas.addEventListener("mousemove", function(event) {
    if(mouseDown) {
      point  = vec2(2 * event.clientX / canvas.width + canvasBrushOffset[0], 2 * (canvas.height - event.clientY) / canvas.height + canvasBrushOffset[1]);
      gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
      gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, flatten(point));

      point = vec4(colors[colorIndex]);
      gl.bindBuffer( gl.ARRAY_BUFFER, colorBufferId );
      gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(point));

      numIndices[numCurves]++;
      index++;
      render();
    }
  });
}


function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  for(var i = 0; i <= numCurves; i ++) {
    gl.drawArrays( gl.LINE_STRIP, curveStart[i], numIndices[i] );
  }
}
