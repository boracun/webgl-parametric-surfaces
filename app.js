// Constants
const DEGREE_CHANGE_AMOUNT = 15.0;
const ZOOM_CHANGE_AMOUNT = 0.25;
const INITIAL_PROJECTION_CONSTANT = 10.0;

// HTML elements
let thetaOutput;
let phiOutput;
let zoomOutput;

var nRows = 40;
var nColumns = 40;

// data for radial hat function: sin(Pi*r)/(Pi*r)

var a = 1.2; // 1.1 <= a <= 1.3
var b = 3; // 3 <= b <= 16
var c = 1; // 1 <= c <= 2
var j = 2; // 2 <= j <= 12
var k = 1; // 0 <= k <= 3
var l = 1; // 0 <= l <= 3
var m = 0; // -3 <= m <= 3
var R = 1.375; // 1 <= R <= 2
var r = 1; // 1 <= r <= 2
var u = 0; // 0 <= u <= 2*PI
var v = 0; // 0 <= v <= 2*PI

var pointsArray = [];
const black = vec4(0.0, 0.0, 0.0, 1.0);
const white = vec4(1.0, 1.0, 1.0, 1.0);

var canvas;
var gl;

var near = -10;
var far = 10;
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
var eye;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

function updateCameraPosition() {
    eye = vec3(
        radius * Math.cos(radians(theta)) * Math.sin(radians(phi)),
        radius * Math.cos(radians(phi)),
        radius * Math.sin(radians(theta)) * Math.sin(radians(phi))
    );

    modelViewMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
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

    gl.clearColor(1.0, 1.0, 0.0, 1.0);

    // vertex array of data for nRows and nColumns of line strips
    for (var i = 0; i < nRows; i++) {
        v = i * Math.PI / (nRows - 1);

        for (var j = 0; j < nColumns; j++) {
            u = j * Math.PI / (nColumns - 1);

            var x = (R + r * Math.cos(v)) * (Math.pow(a, u) * Math.cos(j * u));
            var y = (R + r * Math.cos(v)) * (-Math.pow(a, u) * Math.sin(j * u));
            var z = (-c) * (b + r * Math.sin(v)) * Math.pow(a, u) * (k * Math.sin(v));

            pointsArray.push(vec4(x, y, z, 1.0));
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

    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    updateCameraPosition();     // Sets the model-view matrix
    updateProjection();         // Sets the projection matrix

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

    document.getElementById("wider-button").onclick = function () {
        left *= 0.9;
        right *= 0.9;
    };

    document.getElementById("narrower-button").onclick = function () {
        left *= 1.1;
        right *= 1.1;
    };

    document.getElementById("higher-button").onclick = function () {
        ytop *= 0.9;
        bottom *= 0.9;
    };

    document.getElementById("shorter-button").onclick = function () {
        ytop *= 1.1;
        bottom *= 1.1;
    };

    thetaOutput = document.getElementById("theta-output");
    phiOutput = document.getElementById("phi-output");
    zoomOutput = document.getElementById("distance-output");

    render();
}

var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

// render columns of data then rows
    /*
        for (var i = 0; i < nRows; i += 4)
            {
                for (var i = 0; i < nColumns; i++) {
                    gl.uniform4fv(vColor, flatten(white));
                    gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
                    gl.uniform4fv(vColor, flatten(black));
                    gl.drawArrays(gl.LINE_STRIP, i, 4);
                }
            }*/

    for (var i = 0; i < nRows; i++) {
        gl.drawArrays(gl.LINE_STRIP, i * nColumns, nColumns);
    }
    for (var i = 0; i < nColumns; i++) {
        gl.drawArrays(gl.LINE_STRIP, i * nRows + pointsArray.length / 2, nRows);
    }

    requestAnimFrame(render);
}