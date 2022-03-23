import styles from "./VideoView.module.scss";

function VideoView({ videoRef }) {
  return (
    <video
      ref={videoRef}
      id="remoteVideo"
      playsInline
      autoPlay
      muted
      className={styles.video}
    ></video>
  );
}

export default VideoView;
