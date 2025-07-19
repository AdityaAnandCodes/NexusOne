"use client"
import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Mail,
  Github,
  FileText,
  Layers,
  CheckCircle,
  ArrowRight,
  Zap,
  Users,
  Clock,
  Play,
} from "lucide-react";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const integrationIcons = [
    { icon: Mail, name: "Email Integration" },
    { icon: Github, name: "GitHub Sync" },
    { icon: FileText, name: "Notion & Jira" },
  ];

  const stats = [
    { value: "50%", label: "Faster Onboarding", icon: Zap },
    { value: "4+", label: "App Integrations", icon: Layers },
    { value: "24/7", label: "AI Assistant", icon: Clock },
  ];

  return (
    <section className="relative flex gap-12 items-center min-h-screen px-8 py-0.5 overflow-hidden">
      {/* Background Elements */}
      {/* <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gray-900 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-600 rounded-full blur-3xl"></div>
      </div> */}

      {/* Animated Grid Background */}
      {/* <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #374151 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div> */}

      <div className="flex-1 space-y-10 relative z-10">
        {/* Main Heading */}
        <div
          className={`space-y-8 transform transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
            <span
              className="text-sm font-semibold tracking-wide"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              NEXUS - ALL IN ONE AGENT
            </span>
          </div>

          <h1
            className="text-7xl leading-18 font-black tracking-tight"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Transform Your
            <br />
            <div className="flex gap-2">
              <span className="relative inline-block">Workspace</span>
              <img className="w-8 h-8" src="./Stars.png" />
            </div>
            <span className="">
              with <span className="text-gray-800">Nexus</span>
            </span>
          </h1>

          <p
            className="text-xl leading-relaxed opacity-80 max-w-2xl"
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              color: "#0E0E0E",
            }}
          >
            Nexus One is an intelligent AI agent that revolutionizes company
            onboarding and streamlines your workflow through seamless
            integrations with Mail, GitHub, Notion, Jira, and other WorkOS
            applications.
          </p>
        </div>

        {/* Enhanced Feature Tags */}
        <div
          className={`space-y-8 transform transition-all duration-1000 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Enhanced Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              className="group relative px-8 py-4 bg-black text-white font-semibold rounded-xl hover:bg-gray-900 transition-all duration-300 overflow-hidden"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </button>

            <button
              className="group relative px-8 py-4 border-2 border-gray-300 font-semibold rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all duration-300"
              style={{
                fontFamily: "Inter, system-ui, sans-serif",
                color: "#0E0E0E",
              }}
            >
              <span className="flex items-center gap-2">
                Watch Demo
                <div className="w-8 h-8 rounded-full border-2 border-gray-400 group-hover:border-gray-900 flex items-center justify-center transition-all">
                  <Play className="w-3 h-3 fill-current" />
                </div>
              </span>
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div
          className={`flex items-center gap-6 pt-4 transform transition-all duration-1000 delay-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-gray-700" />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              Enterprise Ready
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-gray-700" />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              SOC 2 Compliant
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-gray-700" />
            <span style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
              GDPR Ready
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Right Side */}
      <div className="flex flex-col gap-0">
        <img className="w-[600px] h-auto" src="./HeroImage.png" />

        <div className="flex flex-wrap ml-16 self-bottom gap-4">
          {integrationIcons.map((item, index) => (
            <div
              key={index}
              className="group flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <item.icon className="w-4 h-4 text-gray-700 group-hover:text-black transition-colors" />
              <span
                className="text-sm font-semibold group-hover:text-black transition-colors"
                style={{
                  fontFamily: "Inter, system-ui, sans-serif",
                  color: "#374151",
                }}
              >
                {item.name}
              </span>
              <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
