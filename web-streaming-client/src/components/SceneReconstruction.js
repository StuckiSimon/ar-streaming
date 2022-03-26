import { Suspense, useEffect, useState } from "react";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import styles from "./SceneReconstruction.module.scss";

function SceneReconstruction({ rawObj }) {
  const [mesh, setMesh] = useState(null);
  useEffect(() => {
    if (rawObj) {
      const loader = new OBJLoader();
      const parsedObject = loader.parse(rawObj);
      setMesh(parsedObject);
    }
  }, [rawObj]);
  return (
    <Canvas className={styles.root}>
      <Suspense fallback={null}>
        {mesh ? <primitive object={mesh} /> : null}
        <OrbitControls />
      </Suspense>
    </Canvas>
  );
}

export default SceneReconstruction;
