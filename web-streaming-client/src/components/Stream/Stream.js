import { useRef } from "react";
import { useMachine } from "@xstate/react";
import p2pMachine from "../../core/p2pMachine";
import AudioPlayer from "../AudioPlayer";
import DepthView from "../DepthView/DepthView";
import { RenderStrategyChooser } from "../RenderStrategy";
import StatusInfo from "../StatusInfo";
import VideoView from "../VideoView";
import SceneReconstruction from "../SceneReconstruction";
import usePeerConnection from "./usePeerConnection";
import useSignallingSocket from "./useSignallingSocket";
import styles from "./Stream.module.scss";

function Replay() {
  const [connectionState, send] = useMachine(p2pMachine);

  const socketRef = useRef(null);
  const { peerConnectionRef, videoRef, audioRef, depthData, objString } =
    usePeerConnection(socketRef, send);
  useSignallingSocket(socketRef, peerConnectionRef, send);

  return (
    <>
      <StatusInfo state={connectionState.value} />
      <div className={styles.container}>
        <div className={styles.video}>
          <VideoView videoRef={videoRef} />
        </div>
        <div className={styles.panel}>
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
