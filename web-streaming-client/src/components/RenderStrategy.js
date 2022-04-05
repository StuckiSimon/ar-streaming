import { createContext, useContext, useMemo, useState } from "react";
import { Select } from "antd";

export const RENDER_CANVAS_OPTIMIZED = "RENDER_CANVAS_OPTIMIZED";
export const RENDER_CANVAS_SLOW = "RENDER_CANVAS_SLOW";
export const RENDER_WEBGL = "RENDER_WEBGL";

const RenderStrategyContext = createContext(null);

export function RenderStrategyProvider({ children }) {
  const [value, setValue] = useState(RENDER_CANVAS_OPTIMIZED);
  const state = useMemo(() => ({ value, setValue }), [value, setValue]);
  return (
    <RenderStrategyContext.Provider value={state}>
      {children}
    </RenderStrategyContext.Provider>
  );
}

function useRenderStrategyContext() {
  const state = useContext(RenderStrategyContext);
  if (state === null) {
    throw new Error(
      "RenderStrategyContext is not provided, make sure to use RenderStrategyProvider"
    );
  }
  return state;
}

export function useRenderStrategy() {
  const state = useRenderStrategyContext();
  return state.value;
}

export function RenderStrategyChooser() {
  const { value, setValue } = useRenderStrategyContext();
  return (
    <label>
      Render strategy{" "}
      <Select
        value={value}
        onChange={(value) => {
          setValue(value);
        }}
      >
        <Select.Option value={RENDER_CANVAS_OPTIMIZED}>
          Canvas optimized
        </Select.Option>
        <Select.Option value={RENDER_CANVAS_SLOW}>Canvas slow</Select.Option>
        <Select.Option value={RENDER_WEBGL}>WebGL</Select.Option>
      </Select>
    </label>
  );
}
