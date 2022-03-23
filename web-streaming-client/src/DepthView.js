import { useEffect } from "react";

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function DepthView({
  depthData = JSON.parse(localStorage.getItem("depthData")).data,
}) {
  useEffect(() => {
    /*const canvas = document.querySelector("#glCanvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl");

    // Only continue if WebGL is available and working
    if (gl === null) {
      alert(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
      return;
    }

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);*/
    // const depthData = JSON.parse(window.localStorage.getItem("depthData")).data;
    if (!depthData) {
      return;
    }
    console.log("start painting");
    performance.mark("startPaint");
    const max = depthData.reduce(
      (max, curr) => (max > curr ? max : curr),
      -Infinity
    );
    const min = depthData.reduce(
      (min, curr) => (min < curr ? min : curr),
      Infinity
    );
    console.log(max, min);

    // slow canvas
    /*
    const canvas = document.querySelector("#glCanvas");
    const context = canvas.getContext("2d");
    const id = context.createImageData(1, 1);
    const d = id.data;

    for (let i = 0; i <= depthData.length; i++) {
      let depth = depthData[i];
      d[0] = 0;
      d[1] = ((depth - min) / max) * 255;
      d[2] = 0;
      d[3] = 255;
      const x = i % 256;
      const y = Math.floor(i / 256);
      context.putImageData(id, x, y);
    }
    */

    // fast canvas
    const canvas = document.querySelector("#glCanvas");
    const context = canvas.getContext("2d");
    const id = context.createImageData(256, 192);
    const d = id.data;

    for (let i = 0; i <= depthData.length; i++) {
      let depth = depthData[i];

      const baseOffset = i * 4;
      d[baseOffset] = 0;
      d[baseOffset + 1] = ((depth - min) / max) * 255;
      d[baseOffset + 2] = 0;
      d[baseOffset + 3] = 255;
    }
    context.putImageData(id, 0, 0);

    // WebGL approach
    /*
    const canvas = document.querySelector("#glCanvas");
    // Initialize the GL context
    const gl = canvas.getContext("webgl2");

    // Only continue if WebGL is available and working
    if (gl === null) {
      alert(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
      return;
    }

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertexShaderSource = `
    // an attribute will receive data from a buffer
    //attribute vec4 a_position;
   
    // all shaders have a main function
    //void main() {
   
      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      //gl_Position = a_position;
    //}
    attribute vec4 a_position;
    // attribute vec2 a_texcoord;
     
    // uniform mat4 u_matrix;
     
    // varying vec2 v_texcoord;
     
    void main() {
       //gl_Position = u_matrix * a_position;
       gl_Position = a_position;
       //v_texcoord = a_texcoord;
    }
    
    `;
    const fragmentShaderSource = `
    // fragment shaders don't have a default precision so we need
    // to pick one. mediump is a good default
    precision mediump float;

    //varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    //uniform float
   
    void main() {
      // gl_FragColor is a special variable a fragment shader
      // is responsible for setting
      //float shit = texture2D(u_texture, vec2(0, 0)).r;
      //float merde = 0.0;
      //gl_FragColor = vec4(shit);
      // gl_FragColor = vec4(merde + shit, 0, 0.5, 1);
      vec4 pos = gl_FragCoord;
      float depth = texture2D(u_texture, vec2(pos.x/256.0, pos.y/192.0)).r;
      //gl_FragColor = vec4(pos.x/256.0, pos.y/192.0, depth, 1);
      gl_FragColor = vec4(0, 0, depth, 1);
    }
    `;

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource
    );

    var program = createProgram(gl, vertexShader, fragmentShader);

    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // two triangles which form a quad
    var positions = [-1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionAttributeLocation);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2; // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
      positionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    // texture data
    var textureLocation = gl.getUniformLocation(program, "u_texture");

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);

    const normalizedDepth = depthData.map((depth) => (depth - min) / max);

    // 3x1 pixel 1d texture
    var oneDTextureTexels = new Float32Array(normalizedDepth);

    //var width = 3;
    //var height = 1;
    var width = 256;
    var height = 192;
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R32F, // RED float32
      width,
      height,
      0,
      gl.RED, // mapping as per https://www.khronos.org/registry/webgl/specs/latest/2.0/#TEXTURE_TYPES_FORMATS_FROM_DOM_ELEMENTS_TABLE
      gl.FLOAT,
      oneDTextureTexels
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.activeTexture(gl.TEXTURE0);

    gl.uniform1i(textureLocation, 0);

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);*/

    performance.mark("endPaint");
    const { duration } = performance.measure(
      "paintingTime",
      "startPaint",
      "endPaint"
    );
    console.log(`painting took ${duration} ms`);
  }, [depthData]);
  return <canvas id="glCanvas" width="256" height="192"></canvas>;
}

export default DepthView;
