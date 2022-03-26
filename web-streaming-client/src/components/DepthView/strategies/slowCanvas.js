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

export default renderSlowCanvas;
