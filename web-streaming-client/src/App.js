import { RenderStrategyProvider } from "./components/RenderStrategy";
import Stream from "./components/Stream/Stream";
import { LOG_LEVEL_INFO, LogLevelContext } from "./core/logger";

function App() {
  return (
    <LogLevelContext.Provider value={LOG_LEVEL_INFO}>
      <RenderStrategyProvider>
        <Stream />
      </RenderStrategyProvider>
    </LogLevelContext.Provider>
  );
}

export default App;
