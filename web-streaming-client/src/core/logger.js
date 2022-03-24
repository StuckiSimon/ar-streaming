import { createContext, useContext, useEffect, useMemo, useRef } from "react";

export const LOG_LEVEL_DEBUG = "LOG_LEVEL_DEBUG";
export const LOG_LEVEL_INFO = "LOG_LEVEL_INFO";
export const LOG_LEVEL_ERROR = "LOG_LEVEL_ERROR";

export const LogLevelContext = createContext(LOG_LEVEL_ERROR);

export const useLogger = () => {
  const level = useContext(LogLevelContext);
  const logLevel = useRef(level);
  useEffect(() => {
    logLevel.current = level;
  }, [level]);
  const logger = useMemo(
    () => ({
      debug: (...data) => {
        if (logLevel.current === LOG_LEVEL_DEBUG) {
          console.log(...data);
        }
      },
      log: (...data) => {
        if (
          logLevel.current === LOG_LEVEL_INFO ||
          logLevel.current === LOG_LEVEL_DEBUG
        ) {
          console.log(...data);
        }
      },
      error: (...data) => {
        console.error(...data);
      },
    }),
    []
  );
  return logger;
};
