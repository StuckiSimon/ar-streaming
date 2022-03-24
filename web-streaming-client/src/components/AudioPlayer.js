import styles from "./AudioPlayer.module.scss";

function AudioPlayer({ audioRef }) {
  return (
    <audio ref={audioRef} className={styles.root} autoPlay controls></audio>
  );
}

export default AudioPlayer;
