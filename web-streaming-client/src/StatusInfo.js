import styles from "./StatusInfo.module.scss";

function StatusInfo({ state }) {
  return ["signalPending", "signalWaiting", "failed"].includes(state) ? (
    <p className={styles.root}>{state}</p>
  ) : null;
}

export default StatusInfo;
