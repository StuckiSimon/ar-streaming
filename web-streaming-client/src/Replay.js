import { useEffect, useRef, useState } from "react";
import DepthView from "./DepthView";
import styles from "./Replay.module.scss";
import VideoView from "./VideoView";

let timeout = null;
function Replay() {
  const [depthData, setDepthData] = useState(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  useEffect(() => {
    // Create WebSocket connection.
    const socket = new WebSocket("ws://localhost:8080");
    // Connection opened
    socket.addEventListener("open", () => {
      console.log("opened connection to signalling server");
    });

    const configuration = {};
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
    peerConnection.addEventListener("iceconnectionstatechange", (e) =>
      console.log("ice change", peerConnection.iceConnectionState)
    );
    peerConnection.addEventListener("track", (e) => {
      switch (e.track.kind) {
        case "video":
          videoRef.current.srcObject = e.streams[0];
          console.log("connected to video");
          break;
        case "audio":
          audioRef.current.srcObject = e.streams[0];
          console.log("connected to audio");
          break;
        default:
          console.log(`unknown track kind ${e.track.kind}`);
          break;
      }
    });

    peerConnection.addEventListener("datachannel", (e) => {
      console.info("got a data channel", e, e.channel.addEventListener);
      const channel = e.channel;
      channel.addEventListener("open", () => {
        console.log("data channel opened");
      });
      channel.addEventListener("close", () => {
        console.log("data channel closed");
      });
      channel.addEventListener("message", (e) => {
        // console.log(e);
        window.depthData = e.data;
        // TODO: this should be debounced...
        console.log("received dataframe");
        if (!timeout) {
          timeout = setTimeout(() => {
            setDepthData(Array.from(new Float32Array(e.data)));
            timeout = null;
          }, 500);
        }
        //const decoder = new TextDecoder("utf-8");
        //console.log(decoder.decode(e.data));
      });
      channel.addEventListener("error", (e) => {
        console.error("data channel error", e);
      });
    });

    console.log("peerConnection setRemoteDescription start");
    // Listen for messages
    socket.addEventListener("message", function (event) {
      (async () => {
        const text = await event.data.text();
        const json = JSON.parse(text);

        if (json.payload.type === "offer") {
          console.log("apply remote session description");
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
            console.error("create answer error", e);
          }
        } else {
          // ice candidate
          peerConnection.addIceCandidate(json.payload);
        }
      })();
    });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.video}>
        <VideoView videoRef={videoRef} />
      </div>
      <div className={styles.depthMap}>
        {/*<DepthView depthData={depthData} />*/}
        <DepthView depthData={depthData} />
      </div>
      <div className={styles.audio}>
        <audio ref={audioRef} id="audio2" autoPlay controls></audio>
      </div>
    </div>
  );
}

export default Replay;
