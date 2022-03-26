function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function renderWebGL(canvas, depthData, min, max) {
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
    attribute vec4 a_position;
     
    void main() {
       gl_Position = a_position;
    }
    `;
  const fragmentShaderSource = `
    precision mediump float;

    uniform sampler2D u_texture;
   
    void main() {
      vec4 pos = gl_FragCoord;
      float depth = texture2D(u_texture, vec2(pos.x/256.0, pos.y/192.0)).r;
      gl_FragColor = vec4(0, 0, depth, 1);
    }
    `;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  const program = createProgram(gl, vertexShader, fragmentShader);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // two triangles which form a quad
  const positions = [-1, -1, -1, 1, 1, -1, -1, 1, 1, -1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionAttributeLocation);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  const size = 2; // 2 components per iteration
  const type = gl.FLOAT; // the data is 32bit floats
  const normalize = false; // don't normalize the data
  const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  const offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // texture data
  const textureLocation = gl.getUniformLocation(program, "u_texture");

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);

  const normalizedDepth = depthData.map((depth) => (depth - min) / max);

  // 3x1 pixel 1d texture
  const oneDTextureTexels = new Float32Array(normalizedDepth);

  const width = 256;
  const height = 192;
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

  gl.bindTexture(gl.TEXTURE_2D, tex);

  gl.activeTexture(gl.TEXTURE0);

  gl.uniform1i(textureLocation, 0);

  const primitiveType = gl.TRIANGLES;
  const drawOffset = 0;
  const count = 6;
  gl.drawArrays(primitiveType, drawOffset, count);
}

export default renderWebGL;
