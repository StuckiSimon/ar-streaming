import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { FlyControls } from "@react-three/drei";
import styles from "./PointCloudView.module.scss";

function PointCloud({ depthData }) {
  const [mesh, setMesh] = useState(null);
  const cameraRef = useRef(null);
  const counter = useRef(0);

  useEffect(() => {
    if (depthData) {
      const geometry = new THREE.BufferGeometry();

      const positions = [];
      const colors = [];

      const color = new THREE.Color();

      depthData.data.forEach((depth, index) => {
        // 256 x 192
        const downScale = 5;
        const x = (index % 256) / downScale;
        const y = Math.floor(index / 256) / downScale;
        const z = depth * 100;

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
      counter.current++;
      setMesh(points);
    }
  }, [depthData]);

  useThree(({ camera }) => {
    cameraRef.current = camera;
  });

  useEffect(() => {
    if (!mesh || counter.current > 1) {
      return;
    }
    // look at center of plane
    const middle = new THREE.Vector3();
    const pointsGeometry = mesh.geometry;

    pointsGeometry.computeBoundingBox();

    middle.x =
      (pointsGeometry.boundingBox.max.x + pointsGeometry.boundingBox.min.x) / 2;
    middle.y =
      (pointsGeometry.boundingBox.max.y + pointsGeometry.boundingBox.min.y) / 2;
    middle.z =
      (pointsGeometry.boundingBox.max.z + pointsGeometry.boundingBox.min.z) / 2;

    cameraRef.current?.lookAt(middle);
  }, [mesh]);

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
