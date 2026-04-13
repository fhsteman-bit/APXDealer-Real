import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Copy, Check } from 'lucide-react';

export default function LogoDrafts() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getSvgString = (id: string) => {
    const svgElement = document.getElementById(id);
    if (!svgElement) return '';
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    return source;
  };

  const downloadSVG = (id: string, filename: string) => {
    const source = getSvgString(id);
    if (!source) return;
    const blob = new Blob([source], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  };

  const copySVG = (id: string) => {
    const source = getSvgString(id);
    if (!source) return;
    navigator.clipboard.writeText(source).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      alert("Clipboard access denied. Please try downloading or opening the app in a new tab.");
    });
  };

  const LogoCard = ({ id, title, filename, delay, children }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-[#111] border border-white/10 p-12 flex flex-col items-center justify-center aspect-video group hover:border-white/30 transition-colors relative"
    >
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
        <button 
          onClick={() => copySVG(id)}
          className="p-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-full transition-colors"
          title="Copy SVG Code"
        >
          {copiedId === id ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <button 
          onClick={() => downloadSVG(id, filename)}
          className="p-2 bg-white/10 hover:bg-white text-white hover:text-black rounded-full transition-colors"
          title="Download SVG File"
        >
          <Download size={16} />
        </button>
      </div>
      {children}
      <p className="mt-6 text-[10px] text-gray-500 tracking-[0.2em] uppercase">{title}</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12 uppercase tracking-[0.2em] text-xs font-medium">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        
        <div className="mb-16">
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.1em] uppercase mb-4">Logo Concepts</h1>
          <p className="text-gray-400 font-light tracking-wide max-w-2xl">
            10 minimalist, high-end logo drafts designed for APX Dealer. Each concept focuses on exclusivity, global reach, and automotive excellence.
          </p>
          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded text-sm text-gray-300 max-w-2xl">
            <strong>Note:</strong> If the download button doesn't work in this preview window, use the <strong>Copy</strong> button to copy the SVG code directly, or open the website in a new tab to download the files.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <LogoCard id="logo-1" title="01. The Minimalist" filename="APX_Logo_Minimalist.svg" delay={0.1}>
            <svg id="logo-1" viewBox="0 0 200 100" className="w-full h-full fill-white">
              <text x="100" y="55" fontFamily="sans-serif" fontWeight="bold" fontSize="36" letterSpacing="0.1em" textAnchor="middle">APX</text>
              <text x="100" y="75" fontFamily="sans-serif" fontSize="10" letterSpacing="0.5em" textAnchor="middle">DEALER</text>
            </svg>
          </LogoCard>

          <LogoCard id="logo-2" title="02. The Apex" filename="APX_Logo_Apex.svg" delay={0.2}>
            <svg id="logo-2" viewBox="0 0 200 100" className="w-full h-full fill-white">
              <path d="M100 20 L130 80 L115 80 L100 50 L85 80 L70 80 Z" />
              <text x="100" y="95" fontFamily="sans-serif" fontSize="12" letterSpacing="0.4em" textAnchor="middle">APX DEALER</text>
            </svg>
          </LogoCard>

          <LogoCard id="logo-3" title="03. The Monogram" filename="APX_Logo_Monogram.svg" delay={0.3}>
            <svg id="logo-3" viewBox="0 0 200 100" className="w-full h-full stroke-white" fill="none" strokeWidth="2">
              <circle cx="100" cy="45" r="25" />
              <path d="M90 60 L100 30 L110 60" />
              <path d="M95 45 L105 45" />
              <text x="100" y="90" fontFamily="sans-serif" fontSize="10" letterSpacing="0.3em" textAnchor="middle" fill="white" stroke="none">APX DEALER</text>
            </svg>
          </LogoCard>

          <LogoCard id="logo-4" title="04. The Speed Line" filename="APX_Logo_SpeedLine.svg" delay={0.4}>
            <svg id="logo-4" viewBox="0 0 200 100" className="w-full h-full fill-white">
              <text x="100" y="60" fontFamily="sans-serif" fontStyle="italic" fontWeight="900" fontSize="40" letterSpacing="0.05em" textAnchor="middle">APX</text>
              <path d="M40 65 L160 65 L150 70 L30 70 Z" />
            </svg>
          </LogoCard>

          <LogoCard id="logo-5" title="05. The Crest" filename="APX_Logo_Crest.svg" delay={0.5}>
            <svg id="logo-5" viewBox="0 0 200 100" className="w-full h-full stroke-white" fill="none" strokeWidth="2">
              <path d="M85 20 L115 20 L115 50 C115 65 100 75 100 75 C100 75 85 65 85 50 Z" />
              <text x="100" y="45" fontFamily="sans-serif" fontSize="14" fontWeight="bold" textAnchor="middle" fill="white" stroke="none">A</text>
              <text x="100" y="95" fontFamily="sans-serif" fontSize="10" letterSpacing="0.2em" textAnchor="middle" fill="white" stroke="none">APX DEALER</text>
            </svg>
          </LogoCard>

          <LogoCard id="logo-6" title="06. The Horizon" filename="APX_Logo_Horizon.svg" delay={0.6}>
            <svg id="logo-6" viewBox="0 0 200 100" className="w-full h-full fill-white">
              <text x="100" y="50" fontFamily="sans-serif" fontWeight="300" fontSize="32" letterSpacing="0.2em" textAnchor="middle">APX</text>
              <line x1="60" y1="60" x2="140" y2="60" stroke="white" strokeWidth="1" />
              <text x="100" y="75" fontFamily="sans-serif" fontSize="8" letterSpacing="0.4em" textAnchor="middle">GLOBAL LOGISTICS</text>
            </svg>
          </LogoCard>

          <LogoCard id="logo-7" title="07. The Geometric X" filename="APX_Logo_GeometricX.svg" delay={0.7}>
            <svg id="logo-7" viewBox="0 0 200 100" className="w-full h-full fill-white">
              <path d="M90 30 L110 70 M110 30 L90 70" stroke="white" strokeWidth="4" strokeLinecap="round" />
              <text x="70" y="55" fontFamily="sans-serif" fontSize="24" fontWeight="bold" textAnchor="end">AP</text>
              <text x="100" y="90" fontFamily="sans-serif" fontSize="10" letterSpacing="0.3em" textAnchor="middle">DEALER</text>
            </svg>
          </LogoCard>

          <LogoCard id="logo-8" title="08. The Global Orbit" filename="APX_Logo_GlobalOrbit.svg" delay={0.8}>
            <svg id="logo-8" viewBox="0 0 200 100" className="w-full h-full stroke-white" fill="none">
              <ellipse cx="100" cy="50" rx="40" ry="15" strokeWidth="1" opacity="0.5" />
              <text x="100" y="56" fontFamily="sans-serif" fontSize="24" fontWeight="bold" letterSpacing="0.1em" textAnchor="middle" fill="white" stroke="none">APX</text>
            </svg>
          </LogoCard>

          <LogoCard id="logo-9" title="09. The Brutalist" filename="APX_Logo_Brutalist.svg" delay={0.9}>
            <svg id="logo-9" viewBox="0 0 200 100" className="w-full h-full fill-white">
              <text x="100" y="55" fontFamily="monospace" fontSize="36" letterSpacing="0.1em" textAnchor="middle">[APX]</text>
              <text x="100" y="75" fontFamily="monospace" fontSize="10" letterSpacing="0.2em" textAnchor="middle">AUTOMOTIVE</text>
            </svg>
          </LogoCard>

          <LogoCard id="logo-10" title="10. The Emblem" filename="APX_Logo_Emblem.svg" delay={1.0}>
            <svg id="logo-10" viewBox="0 0 200 100" className="w-full h-full fill-white">
              <rect x="80" y="20" width="40" height="40" fill="none" stroke="white" strokeWidth="2" transform="rotate(45 100 40)" />
              <text x="100" y="45" fontFamily="sans-serif" fontSize="14" fontWeight="bold" textAnchor="middle">A</text>
              <text x="100" y="85" fontFamily="sans-serif" fontSize="10" letterSpacing="0.3em" textAnchor="middle">APX DEALER</text>
            </svg>
          </LogoCard>
        </div>
      </div>
    </div>
  );
}
