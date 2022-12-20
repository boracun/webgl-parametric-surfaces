// Constants
const DEGREE_CHANGE_AMOUNT = 15.0;
const ZOOM_CHANGE_AMOUNT = 0.25;
const INITIAL_PROJECTION_CONSTANT = 10.0;

const DEFAULT = 0
const PER_VERTEX_OPTION = 1;
const PER_FRAGMENT_OPTION = 2;
const REALISTIC_OPTION = 3;

const lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
const lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
const lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
const lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

const materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
const materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
const materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
const materialShininess = 20.0;

// HTML elements
let thetaOutput;
let phiOutput;
let zoomOutput;

var nRows = 40;
var nColumns = 40;

// data for radial hat function: sin(Pi*r)/(Pi*r)

var a = 1.2; // 1.1 <= a <= 1.3
var b = 7; // 3 <= b <= 16
var c = 1; // 1 <= c <= 2
var j = 2; // 2 <= j <= 12
var k = 1; // 0 <= k <= 3
var l = 1; // 0 <= l <= 3
var m = 0; // -3 <= m <= 3
var R = 1.375; // 1 <= R <= 2
var r = 1; // 1 <= r <= 2
//var u = 0; // 0 <= u <= 2*PI
//var v = 0; // 0 <= v <= 2*PI

var pointsArray = [];
var normalsArray = [];      // TODO: Normals array needs to be calculated
const black = vec4(0.0, 0.0, 0.0, 1.0);
const white = vec4(1.0, 1.0, 1.0, 1.0);

var canvas;
var gl;

var near = -100;
var far = 100;
var radius = 1.0;
var theta = 0.0;    // Theta determines the degree between: x-axis - the center of the sphere - the camera position
var phi = 90.0;     // Phi determines the degree between: the top of the sphere - the center of the sphere - the camera position

var left = -INITIAL_PROJECTION_CONSTANT;
var right = INITIAL_PROJECTION_CONSTANT;
var ytop = INITIAL_PROJECTION_CONSTANT;
var bottom = -INITIAL_PROJECTION_CONSTANT;

var zoomAmount = 0.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var normalMatrix, normalMatrixLoc;
var eye;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

let shadingOption = DEFAULT;

function updateCameraPosition() {
    eye = vec3(
        radius * Math.cos(radians(theta)) * Math.sin(radians(phi)),
        radius * Math.cos(radians(phi)),
        radius * Math.sin(radians(theta)) * Math.sin(radians(phi))
    );

    modelViewMatrix = lookAt(eye, at, up);
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));
}

function updateProjection() {
    left = -INITIAL_PROJECTION_CONSTANT + zoomAmount;
    right = INITIAL_PROJECTION_CONSTANT - zoomAmount;
    ytop = INITIAL_PROJECTION_CONSTANT - zoomAmount;
    bottom = -INITIAL_PROJECTION_CONSTANT + zoomAmount;

    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.2, 0.2, 0.2, 1.0);

    // vertex array of data for nRows and nColumns of line strips
    for (var i = 0; i < nRows - 1; i++) {
		let u1 = i * 2 * Math.PI / (nRows - 1);	
		let u2 = (i + 1) * 2 * Math.PI / (nRows - 1);
        
		//v = i * Math.PI / (nRows - 1);

        for (var index = 0; index < nColumns - 1; index++) {
			let v1 = index * 2 * Math.PI / (nColumns - 1);
			let v2 = (index + 1) * 2 * Math.PI / (nColumns - 1);

			// v1 u1
			var x1 = (R + r * Math.cos(v1)) * (Math.pow(a, u1) * Math.cos(j * u1));
			var y1 = (R + r * Math.cos(v1)) * (-Math.pow(a, u1) * Math.sin(j * u1));
			var z1 = -c * (b + r * Math.sin(v1)) * Math.pow(a, u1) * k + 10;
			
			// v1 u2
			var x2 = (R + r * Math.cos(v1)) * (Math.pow(a, u2) * Math.cos(j * u2));
			var y2 = (R + r * Math.cos(v1)) * (-Math.pow(a, u2) * Math.sin(j * u2));
			var z2 = -c * (b + r * Math.sin(v1)) * Math.pow(a, u2) * k + 10;
			
			// v2 u2
			var x3 = (R + r * Math.cos(v2)) * (Math.pow(a, u2) * Math.cos(j * u2));
			var y3 = (R + r * Math.cos(v2)) * (-Math.pow(a, u2) * Math.sin(j * u2));
			var z3 = -c * (b + r * Math.sin(v2)) * Math.pow(a, u2) * k + 10;
			
			// v2 u1
			var x4 = (R + r * Math.cos(v2)) * (Math.pow(a, u1) * Math.cos(j * u1));
			var y4 = (R + r * Math.cos(v2)) * (-Math.pow(a, u1) * Math.sin(j * u1));
			var z4 = -c * (b + r * Math.sin(v2)) * Math.pow(a, u1) * k + 10;
			
			pointsArray.push(vec4(x1, y1, z1, 1.0)); // v1 u1
			pointsArray.push(vec4(x2, y2, z2, 1.0)); // v1 u2
			pointsArray.push(vec4(x3, y3, z3, 1.0)); // v2 u2
			pointsArray.push(vec4(x4, y4, z4, 1.0)); // v2 u1
			
			/*
			console.log("v and u: ", v1, u1); // v1 u1
			console.log("point 1: ", vec4(x1, y1, z1, 1.0));
			console.log("v and u: ", v1, u2);
			console.log("point 2: ", vec4(x3, y3, z3, 1.0)); // v1 u2
			console.log("v and u: ", v2, u2);
			console.log("point 3: ", vec4(x2, y2, z2, 1.0)); // v2 u2
			console.log("v and u: ", v2, u1);
			console.log("point 4: ", vec4(x4, y4, z4, 1.0)); // v2 u1*/
			
			
        }
    }

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    updateCameraPosition();     // Sets the model-view matrix
    updateProjection();         // Sets the projection matrix

    let ambientProduct = mult(lightAmbient, materialAmbient);
    let diffuseProduct = mult(lightDiffuse, materialDiffuse);
    let specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    document.getElementById("increase-theta-button").onclick = function () {
        theta += DEGREE_CHANGE_AMOUNT;
        thetaOutput.innerHTML = `The theta angle: ${theta % 360} degrees`;
        updateCameraPosition();
    };

    document.getElementById("decrease-theta-button").onclick = function () {
        theta -= DEGREE_CHANGE_AMOUNT;
        if (theta < 0)
            theta += 360;
        thetaOutput.innerHTML = `The theta angle: ${theta % 360} degrees`;
        updateCameraPosition();
    };

    document.getElementById("increase-phi-button").onclick = function () {
        if (phi >= 180 - DEGREE_CHANGE_AMOUNT)
            return;
        phi += DEGREE_CHANGE_AMOUNT;
        phiOutput.innerHTML = `The phi angle: ${phi} degrees`;
        updateCameraPosition();
    };

    document.getElementById("decrease-phi-button").onclick = function () {
        if (phi <= DEGREE_CHANGE_AMOUNT)
            return;
        phi -= DEGREE_CHANGE_AMOUNT;
        phiOutput.innerHTML = `The phi angle: ${phi} degrees`;
        updateCameraPosition();
    };

    document.getElementById("zoom-in-button").onclick = function () {
        if (zoomAmount >= INITIAL_PROJECTION_CONSTANT - ZOOM_CHANGE_AMOUNT)
            return;
        zoomAmount += ZOOM_CHANGE_AMOUNT;

        zoomOutput.innerHTML = `The zoom amount: ${zoomAmount}`;
        updateProjection();
    };

    document.getElementById("zoom-out-button").onclick = function () {
        zoomAmount -= ZOOM_CHANGE_AMOUNT;

        zoomOutput.innerHTML = `The zoom amount: ${zoomAmount}`;
        updateProjection();
    };

    document.getElementById("wireframe-button").onclick = function () {
        shadingOption = DEFAULT;
        gl.uniform1f(gl.getUniformLocation(program, "shadingOption"), shadingOption);
    };

    document.getElementById("per-vertex-button").onclick = function () {
        shadingOption = PER_VERTEX_OPTION;
        gl.uniform1f(gl.getUniformLocation(program, "shadingOption"), shadingOption);
    };

    document.getElementById("per-fragment-button").onclick = function () {
        shadingOption = PER_FRAGMENT_OPTION;
        gl.uniform1f(gl.getUniformLocation(program, "shadingOption"), shadingOption);
    };

    thetaOutput = document.getElementById("theta-output");
    phiOutput = document.getElementById("phi-output");
    zoomOutput = document.getElementById("distance-output");

    render();
}

var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// render columns of data then rows
    
        for (var i = 0; i < pointsArray.length; i += 4) {
            gl.drawArrays(gl.LINE_LOOP, i, 4);  
        }
/*
    for (let i = 0; i < nRows; i++) {

        gl.drawArrays(gl.LINE_LOOP, i * nColumns, nColumns);
    }
    for (let i = 0; i < nColumns; i++) {
		
        gl.drawArrays(gl.LINE_LOOP, i * nRows + pointsArray.length / 2, nRows);
    }*/

    requestAnimFrame(render);
}