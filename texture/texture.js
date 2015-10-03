"use strict";

var canvas;
var gl;
var program;

var showColor = false;
var showTexture = true;

var currentShape = undefined;

var texSize = 128;
var texture;

var cube, sphere;

var vBuffer, iBuffer, nBuffer, cBuffer, tBuffer;
var vPosition, vNormal, vColor, vTexCoord;

var normalMatrixLoc, modelViewMatrixLoc;

window.onload = function init() {
  setUpWebGL();
  setUpShadersAndAttributes();
  initElements();
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
  gl.clearColor(0.9, 0.9, 0.9, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.0, 2.0);
}

function setUpShadersAndAttributes() {
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  vBuffer = gl.createBuffer();
  iBuffer = gl.createBuffer();
  nBuffer = gl.createBuffer();
  cBuffer = gl.createBuffer();
  tBuffer = gl.createBuffer();

  vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.enableVertexAttribArray( vPosition );
  vNormal = gl.getAttribLocation( program, "vNormal" );
  // gl.enableVertexAttribArray( vNormal );
  vColor = gl.getAttribLocation( program, "vColor" );
  gl.enableVertexAttribArray( vColor );
  vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
  gl.enableVertexAttribArray( vTexCoord );

  modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
  normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
}

function initElements() {
  cube = new Cube();
  sphere = new Sphere();
  texture = new CheckerboardTex();

  currentShape = cube;
}

function initEventHandlers() {

  // Select shape
  document.getElementById("selectCube").addEventListener("click", selectCube);
  document.getElementById("selectSphere").addEventListener("click", selectSphere);

  // Select texture
  document.getElementById("selectCheckered").addEventListener("click", selectCheckered);
  document.getElementById("selectCheckeredSin").addEventListener("click", selectCheckeredSin);
  document.getElementById("selectImage").addEventListener("click", selectImage);

  // Scaling
  document.getElementById("xScale").onchange = updateSizeX;
  document.getElementById("xScale").oninput = updateSizeX;
  document.getElementById("yScale").onchange = updateSizeY;
  document.getElementById("yScale").oninput = updateSizeY;
  document.getElementById("zScale").onchange = updateSizeZ;
  document.getElementById("zScale").oninput = updateSizeZ;

  // Rotation
  document.getElementById("xRot").onchange = updateThetaX;
  document.getElementById("xRot").oninput = updateThetaX;
  document.getElementById("yRot").onchange = updateThetaY;
  document.getElementById("yRot").oninput = updateThetaY;
  document.getElementById("zRot").onchange = updateThetaZ;
  document.getElementById("zRot").oninput = updateThetaZ;

  // Toggle
  document.getElementById("toggleColor").addEventListener("click", toggleColor);
  document.getElementById("toggleTexture").addEventListener("click", toggleTexture);
}


function render() {
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if( currentShape != undefined ) {
    currentShape.render();
  };

  requestAnimFrame( render );
}

function setShapeFromSliders() {
  currentShape.size[0] = document.getElementById("xScale").value;
  currentShape.size[1] = document.getElementById("yScale").value;
  currentShape.size[2] = document.getElementById("zScale").value;

  currentShape.theta[0] = document.getElementById("xRot").value;
  currentShape.theta[1] = document.getElementById("yRot").value;
  currentShape.theta[2] = document.getElementById("zRot").value;
}


// ------------------------------------------------------
//                       Shapes
// ------------------------------------------------------

var Shape = function () {
  this.points = [];
  this.normalPoints = [];
  this.colorPoints = [];
  this.texCoords = [];
  this.indices = [];

  this.theta = [ 180, 180, 180 ];
  this.size = [ 1.0, 1.0, 1.0 ];

  this.render = function() {
    // Position
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );

    // Normal
    // gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    // gl.bufferData( gl.ARRAY_BUFFER, flatten(this.normalPoints), gl.STATIC_DRAW );
    // gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );

    // Color
    var colors = this.colorPoints
    if (!showColor) colors = colors.map(function() { return vec4(1.0, 1.0, 1.0, 1.0);});
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    

    // Texture
    var texs = this.texCoords
    if (!showTexture) texs = texs.map(function() { return vec2(0.0, 0.0);});
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texs), gl.STATIC_DRAW );
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);

    // Index
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, iBuffer );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW );

    // texture.init();

    // Model-view matrix
    var modelView = mat4();
    modelView = mult(modelView, rotate( this.theta[0], [1, 0, 0] ));
    modelView = mult(modelView, rotate( this.theta[1], [0, 1, 0] ));
    modelView = mult(modelView, rotate( this.theta[2], [0, 0, 1] ));
    modelView = mult(modelView, scaleMat3( this.size[0], this.size[1], this.size[2] ));
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( modelView ) );

    // Normal matrix
    var normalMat = transpose( inverseMat3( flatten(modelView) ) );
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten( normalMat ) );

    gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
  };

  this.pushSquare = function(a, b, c, d) {
    this.indices.push(a);
    this.indices.push(b);
    this.indices.push(c);
    this.indices.push(a);
    this.indices.push(c);
    this.indices.push(d);
  };

  this.pushNormals = function(a, b, c, d) {
    // Probably wrong...
    var t1 = subtract(this.points[b], this.points[a]);
    var t2 = subtract(this.points[c], this.points[a]);
    var t3 = subtract(this.points[d], this.points[a]);
    var normal1 = vec4( normalize(cross(t2, t1)) );
    var normal2 = vec4( normalize(cross(t3, t2)) );

    this.normalPoints.push(normal);
    this.normalPoints.push(normal);
    this.normalPoints.push(normal);
  };
}

var Cube = function() {
  Shape.call(this);

  var verts = [
            // Front face
            vec4( -0.5, -0.5,  0.5, 1.0 ), vec4( 0.5,  -0.5,  0.5, 1.0 ), vec4( 0.5,  0.5,  0.5, 1.0 ), vec4( -0.5, 0.5,  0.5, 1.0 ),
            // Back face
            vec4( -0.5, -0.5, -0.5, 1.0 ), vec4( -0.5,  0.5, -0.5, 1.0 ), vec4( 0.5,  0.5, -0.5, 1.0 ), vec4( 0.5, -0.5, -0.5, 1.0 ),
            // Top face
            vec4( -0.5,  0.5, -0.5, 1.0 ), vec4( -0.5, 0.5,  0.5, 1.0 ), vec4( 0.5,  0.5,  0.5, 1.0 ), vec4( 0.5,  0.5, -0.5, 1.0 ),
            // Bottom face
            vec4( -0.5, -0.5, -0.5, 1.0 ), vec4( 0.5, -0.5, -0.5, 1.0 ), vec4( 0.5,  -0.5,  0.5, 1.0 ), vec4( -0.5, -0.5,  0.5, 1.0 ),
            // Right face
            vec4( 0.5, -0.5, -0.5, 1.0 ), vec4( 0.5,  0.5, -0.5, 1.0 ), vec4( 0.5,  0.5,  0.5, 1.0 ), vec4( 0.5,  -0.5,  0.5, 1.0 ),
            // Left face
            vec4( -0.5, -0.5, -0.5, 1.0 ), vec4( -0.5, -0.5,  0.5, 1.0 ), vec4( -0.5, 0.5,  0.5, 1.0 ), vec4( -0.5,  0.5, -0.5, 1.0 ),
        ];

  var texs = [vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 1.0), // Front face
              vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 1.0), vec2(0.0, 0.0), // Back face
              vec2(0.0, 1.0), vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(1.0, 1.0), // Top face
              vec2(1.0, 1.0), vec2(0.0, 1.0), vec2(0.0, 0.0), vec2(1.0, 0.0), // Bottom face
              vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 1.0), vec2(0.0, 0.0), // Right face
              vec2(0.0, 0.0), vec2(1.0, 0.0), vec2(1.0, 1.0), vec2(0.0, 1.0), // Left face
             ];

  for (var i = 0; i < verts.length; i++) {
    this.points.push( verts[i] );
    this.colorPoints.push( randomColor() );
    this.texCoords.push( texs[i] );
  }

  this.pushSquare( 0, 1, 2, 3 );
  this.pushSquare( 4, 5, 6, 7 );
  this.pushSquare( 8, 9, 10, 11 );
  this.pushSquare( 12, 13, 14, 15 );
  this.pushSquare( 16, 17, 18, 19 );
  this.pushSquare( 20, 21, 22, 23 );
}

var Sphere = function() {
  Shape.call(this);

  var radius = 0.5;
  var lats = 30;
  var longs = 30;

  for (var latN = 0; latN <= lats; latN++) {
    var theta = latN * Math.PI / lats;
    var sinTheta = sin(theta);
    var cosTheta = cos(theta);

    for (var longN = 0; longN <= longs; longN++) {
      var color = randomColor();
      var phi = longN * 2 * Math.PI / longs;
      var sinPhi = sin(phi);
      var cosPhi = cos(phi);

      var x = cosPhi * sinTheta;
      var y = cosTheta;
      var z = sinPhi * sinTheta;

      var u = 1 - (longN / longs);
      var v = 1 - (latN / lats);

      this.points.push( vec4(radius * x, radius * y, radius * z, 1.0) );
      this.normalPoints.push( vec4(x, y, z, 1.0) );
      this.colorPoints.push( color );
      this.texCoords.push( vec2(u, v) );
    }
  }

  for (var latN = 0; latN < lats; latN++) {
    for (var longN = 0; longN < longs; longN++) {
      var first = (latN * (longs + 1)) + longN;
      var second = first + longs + 1;
      this.indices.push(first);
      this.indices.push(second);
      this.indices.push(first + 1);

      this.indices.push(second);
      this.indices.push(second + 1);
      this.indices.push(first + 1);
    }
  }
}


Sphere.prototype = Object.create(Shape.prototype);
Sphere.prototype.constructor = Sphere;


// ------------------------------------------------------
//                       Textures
// ------------------------------------------------------

var Texture = function() {
  this.image;

  this.configureTexture = function() {
    var tex = gl.createTexture();
    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, tex );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    // gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

var CheckerboardTex = function() {
  Texture.call(this);

  // Create a checkerboard pattern using floats
  var cb = new Array();

  for (var i = 0; i < texSize; i++)  cb[i] = new Array();
  for (var i = 0; i < texSize; i++) 
      for ( var j = 0; j < texSize; j++) 
         cb[i][j] = new Float32Array(4);

  for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
      var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
      cb[i][j] = [c, c, c, 1];
    }
  }

  // Convert floats to ubytes for texture
  this.image = new Uint8Array( 4 * texSize * texSize );
  for ( var i = 0; i < texSize; i++ ) 
    for ( var j = 0; j < texSize; j++ ) 
      for( var k = 0; k < 4; k++ ) 
        this.image[4 * texSize * i + 4 * j + k] = 255 * cb[i][j][k];

  this.configureTexture();
}

CheckerboardTex.prototype = Object.create(Texture.prototype);
CheckerboardTex.prototype.constructor = CheckerboardTex;


var CheckerboardSinusoidalTex = function() {
  Texture.call(this);

  // Create a checkerboard pattern using floats
  var cb = new Array();

  for (var i = 0; i < texSize; i++)  cb[i] = new Array();
  for (var i = 0; i < texSize; i++) 
      for ( var j = 0; j < texSize; j++) 
         cb[i][j] = new Float32Array(4);

  for (var i = 0; i < texSize; i++) {
    for (var j = 0; j < texSize; j++) {
      var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
      cb[i][j] = [c, c, c, 1];
    }
  }

  // Convert floats to ubytes for texture
  this.image = new Uint8Array( 4 * texSize * texSize );
  for ( var i = 0; i < texSize; i++ ) {
    for ( var j = 0; j < texSize; j++ ) {
       this.image[4 * i * texSize + 4 * j] = 127 + 127 * sin(0.1 * i * j);
       this.image[4 * i * texSize + 4 * j + 1] = 127 + 127 * sin(0.1 * i * j);
       this.image[4 * i * texSize + 4 * j + 2] = 127 + 127 * sin(0.1 * i * j);
       this.image[4 * i * texSize + 4 * j + 3] = 222;
     }
  }

  this.configureTexture();
}

CheckerboardSinusoidalTex.prototype = Object.create(Texture.prototype);
CheckerboardSinusoidalTex.prototype.constructor = CheckerboardSinusoidalTex;

var ImageTex = function() {
  Texture.call(this);

  var tex = gl.createTexture();

  function configureTex() {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tex.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.bindTexture(gl.TEXTURE_2D, null);
  }
  
  tex.image = new Image();
  tex.image.addEventListener('load', configureTex, false);
  tex.image.src = "map.jpg"
}

ImageTex.prototype = Object.create(Texture.prototype);
ImageTex.prototype.constructor = ImageTex;


function isPowerOfTwo(x) {
  return (x & (x - 1)) == 0;
}
 
function nextHighestPowerOfTwo(x) {
  --x;
  for (var i = 1; i < 32; i <<= 1) {
      x = x | x >> i;
  }
  return x + 1;
}

// ------------------------------------------------------
//                     Select Shape
// ------------------------------------------------------

function selectCube() {
  currentShape = cube;
  setShapeFromSliders();
}

function selectSphere() {
  currentShape = sphere;
  setShapeFromSliders();
}


// ------------------------------------------------------
//                   Select Texture
// ------------------------------------------------------

function selectCheckered() {
  texture = new CheckerboardTex();
}

function selectCheckeredSin() {
  texture = new CheckerboardSinusoidalTex();
}

function selectImage() {
  texture = new ImageTex();
}


// ------------------------------------------------------
//                  Transform Shape
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

function updateThetaX(e) {
  updateTheta(0, (e.target || e.srcElement).value);
}

function updateThetaY(e) {
  updateTheta(1, (e.target || e.srcElement).value);
}

function updateThetaZ(e) {
  updateTheta(2, (e.target || e.srcElement).value);
}

function updateSize(axis, value) {
  if(currentShape != undefined) updateTransformation(currentShape.size, axis, value);
}

function updateTheta(axis, value) {
  if(currentShape != undefined) updateTransformation(currentShape.theta, axis, value);
}

function updateTransformation(transformation, axis, value) {
  transformation[axis] = value;
}

function toggleColor(e) {
  showColor = !showColor;
}

function toggleTexture(e) {
  showTexture = !showTexture;
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

function scaleVec4( s, u )
{
    if ( !Array.isArray(u) ) {
        throw "scale: second parameter " + u + " is not a vector";
    }
    return vec4(s * u[0], s * u[1], s * u[2], 1.0);
}

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

function randomColor() {
  return [Math.random(), Math.random(), Math.random(), 1.0];
}
