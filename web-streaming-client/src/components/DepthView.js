import { useEffect, useRef } from "react";
import { useLogger } from "../core/logger";
import {
  RENDER_CANVAS_OPTIMIZED,
  RENDER_CANVAS_SLOW,
  RENDER_WEBGL,
  useRenderStrategy,
} from "./RenderStrategy";

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

function renderSlowCanvas(canvas, depthData, min, max) {
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
}

function renderFastCanvas(canvas, depthData, min, max) {
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
}

function DepthView({
  depthData = JSON.parse(localStorage.getItem("depthData")).data,
}) {
  const logger = useLogger();
  const strategy = useRenderStrategy();
  const canvasRef = useRef(null);
  logger.debug("active rendering strategy", strategy);
  useEffect(() => {
    if (!depthData) {
      return;
    }
    const max = depthData.reduce(
      (max, curr) => (max > curr ? max : curr),
      -Infinity
    );
    const min = depthData.reduce(
      (min, curr) => (min < curr ? min : curr),
      Infinity
    );
    logger.debug("start painting", min, max);
    performance.mark("startPaint");

    switch (strategy) {
      case RENDER_CANVAS_OPTIMIZED:
        renderFastCanvas(canvasRef.current, depthData, min, max);
        break;
      case RENDER_CANVAS_SLOW:
        renderSlowCanvas(canvasRef.current, depthData, min, max);
        break;
      case RENDER_WEBGL:
        renderWebGL(canvasRef.current, depthData, min, max);
        break;
      default:
        logger.error(`unknown strategy provided ${strategy}`);
    }

    performance.mark("endPaint");
    const { duration } = performance.measure(
      "paintingTime",
      "startPaint",
      "endPaint"
    );
    logger.debug(`painting took ${duration} ms`);
  }, [depthData, logger, strategy]);
  // pass strategy as key to ensure creating new canvas instances on strategy change
  return (
    <canvas key={strategy} ref={canvasRef} width="256" height="192"></canvas>
  );
}

export default DepthView;
