import { useMemo } from "react";

function useDepthData(depthData) {
  return useMemo(() => {
    if (depthData) {
      const max = depthData.reduce(
        (max, curr) => (max > curr ? max : curr),
        -Infinity
      );
      const min = depthData.reduce(
        (min, curr) => (min < curr ? min : curr),
        Infinity
      );
      return {
        min,
        max,
        data: depthData,
      };
    }
  }, [depthData]);
}

export default useDepthData;
