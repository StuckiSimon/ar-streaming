import styles from "./VideoView.module.scss";

function VideoView({ videoRef }) {
  return (
    <video
      ref={videoRef}
      playsInline
      autoPlay
      muted
      className={styles.video}
    ></video>
  );
}

export default VideoView;
