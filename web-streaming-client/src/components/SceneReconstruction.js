import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import styles from "./SceneReconstruction.module.scss";

function SceneReconstruction({ rawObj }) {
  const [mesh, setMesh] = useState(null);

  useEffect(() => {
    if (rawObj) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xb8b8b8,
        side: THREE.DoubleSide,
      });
      const loader = new OBJLoader();
      const parsedObject = loader.parse(rawObj);
      setMesh(parsedObject);
      for (let child of parsedObject.children) {
        child.material = material;
      }
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
