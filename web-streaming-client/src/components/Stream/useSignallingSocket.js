import { useEffect } from "react";
import { useLogger } from "../../core/logger";
import { SIGNALLING_SERVER_URL } from "./Stream";

async function applyOffer(peerConnection, socket, remoteDescription) {
  await peerConnection.setRemoteDescription(remoteDescription);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
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
}

function useSignallingSocket(socketRef, peerConnectionRef, send) {
  const logger = useLogger();
  useEffect(() => {
    const socket = new WebSocket(SIGNALLING_SERVER_URL);
    socketRef.current = socket;

    socket.addEventListener("open", () => {
      logger.log("opened connection to signalling server");
      send("ESTABLISHED");
    });

    socket.addEventListener("message", function (event) {
      (async () => {
        const text = await event.data.text();
        const json = JSON.parse(text);

        if (json.payload.type === "offer") {
          logger.log("apply remote session description");
          await applyOffer(peerConnectionRef.current, socket, json.payload);
        } else {
          // ice candidate
          peerConnectionRef.current.addIceCandidate(json.payload);
        }
      })();
    });
  }, [send, logger, peerConnectionRef, socketRef]);
}

export default useSignallingSocket;
