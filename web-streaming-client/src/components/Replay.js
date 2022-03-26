import { useEffect, useRef, useState } from "react";
import { useMachine } from "@xstate/react";
import { useLogger } from "../core/logger";
import p2pMachine from "../core/p2pMachine";
import AudioPlayer from "./AudioPlayer";
import DepthView from "./DepthView/DepthView";
import { RenderStrategyChooser } from "./RenderStrategy";
import StatusInfo from "./StatusInfo";
import VideoView from "./VideoView";
import SceneReconstruction from "./SceneReconstruction";
import styles from "./Replay.module.scss";

function Replay() {
  const [connectionState, send] = useMachine(p2pMachine);
  const logger = useLogger();

  const [depthData, setDepthData] = useState(null);
  const [objString, setObjString] = useState(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  useEffect(() => {
    // Create WebSocket connection.
    const socket = new WebSocket(process.env.REACT_APP_SIGNALLING_SERVER_URL);
    // Connection opened
    socket.addEventListener("open", () => {
      logger.log("opened connection to signalling server");
      send("ESTABLISHED");
    });

    const configuration = {
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302",
            "stun:stun3.l.google.com:19302",
            "stun:stun4.l.google.com:19302",
          ],
        },
      ],
    };
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnection.addEventListener("icecandidate", (e) => {
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
      logger.log("got a data channel", e);
      const channel = e.channel;
      channel.addEventListener("open", () => {
        logger.log("data channel opened");
      });
      channel.addEventListener("close", () => {
        logger.log("data channel closed");
      });
      channel.addEventListener("message", (e) => {
        window.depthData = e.data;
        const meta = new Uint8Array(e.data.slice(0, 2));
        const messageType = String.fromCharCode(meta[0], meta[1]);
        switch (messageType) {
          case "DM":
            // DepthMap
            setDepthData(Array.from(new Float32Array(e.data.slice(2))));
            break;
          case "MS":
            // Mesh
            const decoder = new TextDecoder("ascii");
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

    logger.log("peerConnection setRemoteDescription start");
    // Listen for messages
    socket.addEventListener("message", function (event) {
      (async () => {
        const text = await event.data.text();
        const json = JSON.parse(text);

        if (json.payload.type === "offer") {
          logger.log("apply remote session description");
          await peerConnection.setRemoteDescription(json.payload);
          try {
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
          } catch (e) {
            logger.error("create answer error", e);
          }
        } else {
          // ice candidate
          peerConnection.addIceCandidate(json.payload);
        }
      })();
    });
  }, [send, logger, setObjString]);

  return (
    <>
      <StatusInfo state={connectionState.value} />
      <div className={styles.container}>
        <div className={styles.video}>
          <VideoView videoRef={videoRef} />
        </div>
        <div className={styles.depthMap}>
          <SceneReconstruction rawObj={objString} />
          <DepthView depthData={depthData} />
        </div>
        <div className={styles.footer}>
          <AudioPlayer audioRef={audioRef} />
          <RenderStrategyChooser />
        </div>
      </div>
    </>
  );
}

export default Replay;
