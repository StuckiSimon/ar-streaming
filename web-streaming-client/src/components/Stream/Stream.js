import { useRef } from "react";
import { useMachine } from "@xstate/react";
import p2pMachine from "../../core/p2pMachine";
import AudioPlayer from "../AudioPlayer";
import DepthView from "../DepthView/DepthView";
import { RenderStrategyChooser } from "../RenderStrategy";
import StatusInfo from "../StatusInfo";
import VideoView from "../VideoView";
import SceneReconstruction from "../SceneReconstruction";
import PointCloudView from "../PointCloudView";
import usePeerConnection from "./usePeerConnection";
import useSignallingSocket from "./useSignallingSocket";
import useDepthData from "./useDepthData";
import styles from "./Stream.module.scss";

function Replay() {
  const [connectionState, send] = useMachine(p2pMachine);

  const socketRef = useRef(null);
  const { peerConnectionRef, videoRef, audioRef, depthData, objString } =
    usePeerConnection(socketRef, send);
  useSignallingSocket(socketRef, peerConnectionRef, send);
  const aggregatedDepthData = useDepthData(depthData);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.video}>
          <VideoView videoRef={videoRef} />
        </div>
        <div className={styles.depthView}>
          <DepthView depthData={aggregatedDepthData} />
        </div>
        <div>
          <SceneReconstruction rawObj={objString} />
        </div>
        <div>
          <PointCloudView depthData={aggregatedDepthData} />
        </div>
        <div className={styles.footer}>
          <AudioPlayer audioRef={audioRef} />
          <RenderStrategyChooser />
        </div>
      </div>
      <StatusInfo state={connectionState.value} />
    </>
  );
}

export default Replay;
