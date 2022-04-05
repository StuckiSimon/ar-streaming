import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { FlyControls } from "@react-three/drei";
import { Button, Tooltip } from "antd";
import { CameraOutlined } from "@ant-design/icons";
import styles from "./PointCloudView.module.scss";

function PointCloud({ depthData, cameraResetRef }) {
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

        // 1.3 = scale difference between x and y (256/192)
        // normalized = close to -1 and 1 range
        const normalizedX = ((x / 255) * 2 - 1) * 1.3;
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

  const resetCamera = useCallback(() => {
    camera.position.z = -1.2;
    camera.position.x = 0;
    camera.position.y = 0;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
  }, [camera]);

  cameraResetRef.current = resetCamera;

  useEffect(() => {
    resetCamera();
  }, [resetCamera]);

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
  const cameraResetRef = useRef(() => {});
  return (
    <div className={styles.root}>
      <div className={styles.canvas}>
        <Canvas>
          <PointCloud depthData={depthData} cameraResetRef={cameraResetRef} />
        </Canvas>
      </div>
      <div>
        {depthData ? (
          <Tooltip title="reset camera viewport">
            <Button
              type="ghost"
              shape="circle"
              icon={<CameraOutlined />}
              onClick={() => {
                cameraResetRef.current();
              }}
            />
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}

export default PointCloudView;
