import * as THREE from "three";
import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    sphere_gltf: THREE.Mesh;
  };
  materials: {
    yellow_bricks: THREE.MeshStandardMaterial;
  };
};

export default function Logo({ ...props }: JSX.IntrinsicElements["group"]) {
  const group = useRef<THREE.Group>() as React.MutableRefObject<THREE.Group>;
  const { nodes, materials } = useGLTF("/yellow.gltf") as GLTFResult;
  return (
    <group ref={group} {...props} dispose={null} scale={3}>
      <mesh
        geometry={nodes.sphere_gltf.geometry}
        material={materials.yellow_bricks}
      />
    </group>
  );
}
