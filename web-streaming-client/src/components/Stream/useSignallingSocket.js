import { useEffect } from "react";
import { useLogger } from "../../core/logger";
import { SIGNALLING_SERVER_URL } from "./Stream";

function useSignallingSocket(socketRef, peerConnectionRef, send) {
  const logger = useLogger();
  useEffect(() => {
    // Create WebSocket connection.
    const socket = new WebSocket(SIGNALLING_SERVER_URL);
    socketRef.current = socket;
    // Connection opened
    socket.addEventListener("open", () => {
      logger.log("opened connection to signalling server");
      send("ESTABLISHED");
    });

    // Listen for messages
    socket.addEventListener("message", function (event) {
      (async () => {
        const text = await event.data.text();
        const json = JSON.parse(text);

        if (json.payload.type === "offer") {
          logger.log("apply remote session description");
          await peerConnectionRef.current.setRemoteDescription(json.payload);
          try {
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);
            socket.send(
              new Blob(
                [
                  JSON.stringify({
                    type: "SessionDescription",
                    payload: answer,
                  }),
                ],
                { type: "application/json" }
              )
            );
          } catch (e) {
            logger.error("create answer error", e);
          }
        } else {
          // ice candidate
          peerConnectionRef.current.addIceCandidate(json.payload);
        }
      })();
    });
  }, [send, logger, peerConnectionRef, socketRef]);
}

export default useSignallingSocket;
