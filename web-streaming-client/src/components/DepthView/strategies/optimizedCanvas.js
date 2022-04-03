function renderFastCanvas(canvas, depthData, min, max) {
  const context = canvas.getContext("2d");
  const id = context.createImageData(256, 192);
  const d = id.data;

  for (let i = 0; i <= depthData.length; i++) {
    let depth = depthData[i];

    const baseOffset = i * 4;
    d[baseOffset] = 0;
    d[baseOffset + 1] = 255 - ((depth - min) / max) * 255;
    d[baseOffset + 2] = 51;
    d[baseOffset + 3] = 255;
  }
  context.putImageData(id, 0, 0);
}

export default renderFastCanvas;
