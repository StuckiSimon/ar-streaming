import { useEffect, useRef } from "react";
import { useLogger } from "../../core/logger";
import {
  RENDER_CANVAS_OPTIMIZED,
  RENDER_CANVAS_SLOW,
  RENDER_WEBGL,
  useRenderStrategy,
} from "../RenderStrategy";
import renderFastCanvas from "./strategies/optimizedCanvas";
import renderSlowCanvas from "./strategies/slowCanvas";
import renderWebGL from "./strategies/webgl";

const STRATEGY_RENDER_MAP = {
  [RENDER_CANVAS_OPTIMIZED]: renderFastCanvas,
  [RENDER_CANVAS_SLOW]: renderSlowCanvas,
  [RENDER_WEBGL]: renderWebGL,
};

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

    const renderer = STRATEGY_RENDER_MAP[strategy];
    if (renderer) {
      renderer(canvasRef.current, depthData, min, max);
    } else {
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
