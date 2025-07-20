"use client";
import React, { useState, useEffect, useRef } from "react";
import { Mic, Square, Play } from "lucide-react";
import Navbar from "@/components/Navbar";

const WobblyCircle = ({ isAnimating }: { isAnimating: boolean }) => {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!isAnimating || !pathRef.current) return;

    let animationId: number | undefined;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;

      // Create multiple sine waves with much larger amplitudes for dramatic wobbling
      const wobble1 = Math.sin(elapsed * 2.5) * 45;
      const wobble2 = Math.sin(elapsed * 3.7 + Math.PI / 3) * 35;
      const wobble3 = Math.sin(elapsed * 1.8 + Math.PI / 2) * 55;
      const wobble4 = Math.sin(elapsed * 4.2 + Math.PI) * 40;
      const wobble5 = Math.sin(elapsed * 5.1 + Math.PI / 4) * 30;
      const wobble6 = Math.sin(elapsed * 2.9 + Math.PI * 1.5) * 38;

      // Additional chaotic movements
      const chaos1 = Math.sin(elapsed * 6.3) * 25;
      const chaos2 = Math.cos(elapsed * 4.7) * 20;

      // Base circle with dramatic wobbling control points
      const centerX = 190;
      const centerY = 190;
      const baseRadius = 150;

      // Create 8 points around the circle for more complex wobbling
      const points = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const wobbleX = Math.sin(elapsed * (2.5 + i * 0.3)) * (30 + i * 5);
        const wobbleY = Math.cos(elapsed * (3.2 + i * 0.4)) * (25 + i * 4);

        points.push({
          x: centerX + Math.cos(angle) * (baseRadius + wobbleX),
          y: centerY + Math.sin(angle) * (baseRadius + wobbleY),
        });
      }

      // Create a smooth path through all wobbling points
      let path = `M ${points[0].x + wobble1} ${points[0].y + wobble2}`;

      for (let i = 0; i < points.length; i++) {
        const current = points[i];
        const next = points[(i + 1) % points.length];
        const controlPoint1X = current.x + wobble3 + chaos1;
        const controlPoint1Y = current.y + wobble4 + chaos2;
        const controlPoint2X = next.x + wobble5 - chaos1;
        const controlPoint2Y = next.y + wobble6 - chaos2;

        path += ` C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${
          next.x + wobble1
        } ${next.y + wobble2}`;
      }

      path += " Z";

      if (pathRef.current) {
        pathRef.current.setAttribute("d", path);
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isAnimating]);

  return (
    <svg width="380" height="380" className="absolute inset-0">
      <path
        ref={pathRef}
        d="M 340 190 C 340 107 273 40 190 40 C 107 40 40 107 40 190 C 40 273 107 340 190 340 C 273 340 340 273 340 190"
        fill="none"
        stroke="#000000"
        strokeWidth="3"
        opacity="0.05"
      />
    </svg>
  );
};

const AgentPage = () => {
  const [isRecording, setIsRecording] = useState(false);

  const handleMicClick = () => {
    setIsRecording(true);
  };

  const handleStopClick = () => {
    setIsRecording(false);
  };

  return (
    <div className="min-h-screen max-h-screen flex flex-col bg-white w-full">
      <Navbar />
      <div className="flex flex-col justify-center items-center w-full flex-1 gap-8">
        {/* Circle Container  #aef398 #d9d9d9 #fe6363 */}
        <div className="relative w-[380px] h-[380px] flex justify-center items-center rounded-full bg-[#fe6363] opacity-5 border-3 border-black">
          <WobblyCircle isAnimating={isRecording} />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-6">
          <button
            onClick={handleMicClick}
            disabled={isRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? "bg-gray-300 cursor-not-allowed opacity-50"
                : "bg-black hover:bg-gray-800 active:scale-95"
            }`}
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            <Mic className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={handleStopClick}
            disabled={!isRecording}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              !isRecording
                ? "bg-gray-300 cursor-not-allowed opacity-50"
                : "bg-red-600 hover:bg-red-700 active:scale-95"
            }`}
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            <Square className="w-6 h-6 text-white fill-current" />
          </button>
        </div>
      </div>

      <div className="h-28 w-12 rounded-l-xl self-end bg-[#2B2B2B] absolute top-[40%] flex justify-center items-center">
        <Play className="w-6 h-6 text-white fill-current transform rotate-180" />
      </div>
    </div>
  );
};

export default AgentPage;
