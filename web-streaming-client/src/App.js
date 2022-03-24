import Replay from "./components/Replay";
import { LOG_LEVEL_INFO, LogLevelContext } from "./core/logger";

function App() {
  return (
    <LogLevelContext.Provider value={LOG_LEVEL_INFO}>
      <Replay />
    </LogLevelContext.Provider>
  );
}

export default App;
