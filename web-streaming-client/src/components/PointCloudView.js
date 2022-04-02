import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import styles from "./PointCloudView.module.scss";

function PointCloudView({ depthData }) {
  const [mesh, setMesh] = useState(null);

  useEffect(() => {
    if (depthData) {
      const geometry = new THREE.BufferGeometry();

      const positions = [];
      const colors = [];

      const color = new THREE.Color();

      depthData.forEach((depth, index) => {
        // 256 x 192
        const downScale = 5;
        const x = (index % 256) / downScale;
        const y = Math.floor(index / 256) / downScale;
        const z = depth * 10;

        positions.push(x, y, z);

        color.setRGB(0.8, 0.2, z / 3);

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
        size: 0.3,
        vertexColors: true,
      });

      const points = new THREE.Points(geometry, material);
      setMesh(points);
    }
  }, [depthData]);
  return (
    <Canvas className={styles.root}>
      <Suspense fallback={null}>
        {mesh ? <primitive object={mesh} /> : null}
        <OrbitControls />
      </Suspense>
    </Canvas>
  );
}

export default PointCloudView;
