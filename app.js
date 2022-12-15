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
var theta = -Math.PI / 4;
var phi = 0.0;
var dr = 5.0 * Math.PI / 180.0;

var left = -10.0;
var right = 10.0;
var ytop = 10.0;
var bottom = -10.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

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

    // buttons for moving viewer and changing size
    document.getElementById("Button1").onclick = function () {
        near *= 1.1;
        far *= 1.1;
    };
    document.getElementById("Button2").onclick = function () {
        near *= 0.9;
        far *= 0.9;
    };
    document.getElementById("Button3").onclick = function () {
        radius *= 2.0;
    };
    document.getElementById("Button4").onclick = function () {
        radius *= 0.5;
    };
    document.getElementById("Button5").onclick = function () {
        theta += dr;
    };
    document.getElementById("Button6").onclick = function () {
        theta -= dr;
    };
    document.getElementById("Button7").onclick = function () {
        phi += dr;
    };
    document.getElementById("Button8").onclick = function () {
        phi -= dr;
    };
    document.getElementById("Button9").onclick = function () {
        left *= 0.9;
        right *= 0.9;
    };
    document.getElementById("Button10").onclick = function () {
        left *= 1.1;
        right *= 1.1;
    };
    document.getElementById("Button11").onclick = function () {
        ytop *= 0.9;
        bottom *= 0.9;
    };
    document.getElementById("Button12").onclick = function () {
        ytop *= 1.1;
        bottom *= 1.1;
    };

    render();
}

var render = function () {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.sin(theta) * Math.sin(phi), radius * Math.cos(theta));

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

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