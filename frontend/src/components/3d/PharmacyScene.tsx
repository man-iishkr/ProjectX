import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Lightformer, ContactShadows, Environment, Sphere, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

const Pill = () => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
            groupRef.current.rotation.y += 0.005;
            groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            <Float
                speed={2} // Animation speed
                rotationIntensity={0.5} // XYZ rotation intensity
                floatIntensity={2} // Up/down float intensity
            >
                {/* Top Half of Pill */}
                <group position={[0, 0.5, 0]}>
                    {/* Top Dome */}
                    <Sphere args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} position={[0, 1, 0]}>
                        <meshStandardMaterial color="#3b82f6" roughness={0.1} metalness={0.8} />
                    </Sphere>
                    {/* Top Cylinder */}
                    <Cylinder args={[1, 1, 1, 32]} position={[0, 0.5, 0]}>
                        <meshStandardMaterial color="#3b82f6" roughness={0.1} metalness={0.8} />
                    </Cylinder>
                </group>

                {/* Bottom Half of Pill */}
                <group position={[0, -0.5, 0]}>
                    {/* Bottom Cylinder */}
                    <Cylinder args={[1, 1, 1, 32]} position={[0, -0.5, 0]}>
                        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
                    </Cylinder>
                    {/* Bottom Dome */}
                    <Sphere args={[1, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} position={[0, -1, 0]}>
                        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
                    </Sphere>
                </group>

                {/* A glowing ring around the middle */}
                <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1.05, 0.05, 16, 100]} />
                    <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={2} toneMapped={false} />
                </mesh>
            </Float>
        </group>
    );
};

// Abstract fluid-like aesthetic setup
export const PharmacyScene: React.FC = () => {
    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
            {/* Dark moody fluid background using CSS */}
            <div className="absolute inset-0 bg-slate-950">
                <div className="absolute inset-0 opacity-40 mix-blend-screen"
                    style={{
                        background: 'radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.4), transparent 50%), radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.4), transparent 50%)',
                        filter: 'blur(60px)',
                        animation: 'pulse-slow 8s ease-in-out infinite alternate'
                    }}
                />
            </div>

            <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 2]}>
                <color attach="background" args={['transparent']} />

                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />

                {/* The 3D Pharmacy Object */}
                <Pill />

                {/* Subtle reflections */}
                <Environment resolution={256}>
                    <group rotation={[-Math.PI / 2, 0, 0]}>
                        <Lightformer intensity={1} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
                        <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 0.1, 1]} />
                        <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[5, 1, -1]} scale={[20, 0.5, 1]} />
                        <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 1, 1]} />
                    </group>
                </Environment>

                {/* Contact shadow for depth */}
                <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={20} blur={2} far={4} color="#000000" />
            </Canvas>
        </div>
    );
};

export default PharmacyScene;
