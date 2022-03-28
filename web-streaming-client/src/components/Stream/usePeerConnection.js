import { useEffect, useRef, useState } from "react";
import { useLogger } from "../../core/logger";

const STUN_SERVERS = [
  "stun:stun.l.google.com:19302",
  "stun:stun1.l.google.com:19302",
  "stun:stun2.l.google.com:19302",
  "stun:stun3.l.google.com:19302",
  "stun:stun4.l.google.com:19302",
];

function addIceCandidate(socket, e) {
  // When there are no more candidates at all to be expected during the current negotiation exchange
  // an end - of - candidates notification is sent by delivering a RTCIceCandidate whose candidate
  // property is null. This message does not need to be sent to the remote peer.
  // It's a legacy notification of a state which can be detected instead by watching for the
  // iceGatheringState to change to complete, by watching for the icegatheringstatechange event.
  if (e.candidate) {
    // sdp, sdpMLineIndex, sdpMid
    const { candidate, sdpMLineIndex, sdpMid } = e.candidate;
    socket.send(
      new Blob(
        [
          JSON.stringify({
            type: "IceCandidate",
            payload: {
              sdp: candidate,
              sdpMLineIndex,
              sdpMid,
            },
          }),
        ],
        { type: "application/json" }
      )
    );
  }
}

function usePeerConnection(socketRef, send) {
  const logger = useLogger();
  const peerConnectionRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const [depthData, setDepthData] = useState(null);
  const [objString, setObjString] = useState(null);

  useEffect(() => {
    const configuration = {
      iceServers: [
        {
          urls: STUN_SERVERS,
        },
      ],
    };
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;
    peerConnection.addEventListener("icecandidate", (e) => {
      addIceCandidate(socketRef.current, e);
    });
    peerConnection.addEventListener("iceconnectionstatechange", (e) => {
      logger.log("ice change", peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === "disconnected") {
        send("ERROR");
      }
    });
    peerConnection.addEventListener("track", (e) => {
      send("ESTABLISHED");
      switch (e.track.kind) {
        case "video":
          videoRef.current.srcObject = e.streams[0];
          logger.log("connected to video");
          break;
        case "audio":
          audioRef.current.srcObject = e.streams[0];
          logger.log("connected to audio");
          break;
        default:
          logger.log(`unknown track kind ${e.track.kind}`);
          break;
      }
    });

    peerConnection.addEventListener("datachannel", (e) => {
      logger.log("received data channel");
      const channel = e.channel;
      channel.addEventListener("open", () => {
        logger.log("data channel opened");
      });
      channel.addEventListener("close", () => {
        logger.log("data channel closed");
      });
      channel.addEventListener("message", (e) => {
        const meta = new Uint8Array(e.data.slice(0, 2));
        const messageType = String.fromCharCode(meta[0], meta[1]);
        switch (messageType) {
          case "DM":
            // DepthMap
            setDepthData(Array.from(new Float32Array(e.data.slice(2))));
            break;
          case "MS":
            // Mesh
            const decoder = new TextDecoder();
            const rawObjString = decoder.decode(e.data.slice(2));
            setObjString(rawObjString);
            break;
          default:
            logger.error("unknown message type", messageType);
        }
      });
      channel.addEventListener("error", (e) => {
        logger.error("data channel error", e);
      });
    });
  }, [logger, send, setDepthData, setObjString, socketRef]);
  return { peerConnectionRef, audioRef, videoRef, depthData, objString };
}

export default usePeerConnection;
