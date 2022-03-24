import { createMachine } from "xstate";

const p2pMachine = createMachine({
  id: "p2pMachine",
  initial: "signalPending",
  states: {
    signalPending: {
      on: {
        ESTABLISHED: { target: "signalWaiting" },
        ERROR: { target: "failed" },
      },
    },
    signalWaiting: {
      on: {
        ESTABLISHED: { target: "p2pEstablished" },
        ERROR: { target: "failed" },
      },
    },
    p2pEstablished: {
      on: {
        ERROR: { target: "failed" },
      },
    },
    failed: {},
  },
});

export default p2pMachine;
