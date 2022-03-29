import styles from "./StatusInfo.module.scss";

const STATUS_TEXT_MAP = {
  signalPending: "Establishing connection to signalling server",
  signalWaiting: "Connected to signalling server, waiting for peer",
  failed: "An error occured, please retry",
};

function StatusInfo({ state }) {
  const text = STATUS_TEXT_MAP[state];
  if (text) {
    return <p className={styles.root}>{text}</p>;
  }
  return null;
}

export default StatusInfo;
