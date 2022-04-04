import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { FlyControls } from "@react-three/drei";
import styles from "./PointCloudView.module.scss";

function PointCloud({ depthData }) {
  const [mesh, setMesh] = useState(null);

  useEffect(() => {
    if (depthData) {
      const geometry = new THREE.BufferGeometry();

      const positions = [];
      const colors = [];

      const color = new THREE.Color();

      depthData.data.forEach((depth, index) => {
        // 256 x 192
        const x = index % 256;
        const y = Math.floor(index / 256);
        const z = depth;

        const normalizedX = (x / 255) * 2 - 1;
        const normalizedY = (y / 192) * 2 - 1;

        positions.push(normalizedX * -1, normalizedY * -1, z);

        const normalizedDepth = (depth - depthData.min) / depthData.max;

        color.setRGB(0.0, 1 - normalizedDepth, 0.2);

        colors.push(color.r, color.g, color.b);
      });

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3)
      );

      geometry.computeBoundingSphere();

      const material = new THREE.PointsMaterial({
        size: 0.01,
        vertexColors: true,
      });

      const points = new THREE.Points(geometry, material);
      setMesh(points);
    }
  }, [depthData]);

  const camera = useThree(({ camera }) => {
    return camera;
  });

  useEffect(() => {
    camera.position.z = -2;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
  }, [camera]);

  return (
    <Suspense fallback={null}>
      {mesh ? <primitive object={mesh} /> : null}
      <FlyControls
        movementSpeed={4.0}
        rollSpeed={0.5}
        autoForward={false}
        dragToLook={true}
      />
    </Suspense>
  );
}

function PointCloudView({ depthData }) {
  return (
    <Canvas className={styles.root}>
      <PointCloud depthData={depthData} />
    </Canvas>
  );
}

export default PointCloudView;
