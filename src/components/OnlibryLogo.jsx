// src/components/OnlibryLogo.jsx
// Pure CSS Onlibry Logo - Pencil Tip EXACTLY at Circle Center

import React from 'react';

const OnlibryLogo = ({ size = 'md', showText = false, className = '' }) => {
  // Size configurations
  const sizes = {
    sm: {
      container: 'w-10 h-10',
      ring: 'border-[2px]',
      innerRing: 'border-[1.5px]',
      pencil: 'w-3',
      pencilCap: 'h-2',
      pencilShaft: 'h-3',
      pencilPoint: 'h-3',
      tip: 'w-1.5 h-1',
      // Tip ko center mein laane ke liye top position
      topOffset: 'top-[calc(50%-4px)]',
    },
    md: {
      container: 'w-14 h-14',
      ring: 'border-[3px]',
      innerRing: 'border-[2px]',
      pencil: 'w-4',
      pencilCap: 'h-2.5',
      pencilShaft: 'h-4',
      pencilPoint: 'h-4',
      tip: 'w-2 h-1.5',
      topOffset: 'top-[calc(50%-5.5px)]',
    },
    lg: {
      container: 'w-20 h-20',
      ring: 'border-[4px]',
      innerRing: 'border-[3px]',
      pencil: 'w-5',
      pencilCap: 'h-3',
      pencilShaft: 'h-6',
      pencilPoint: 'h-5',
      tip: 'w-2.5 h-2',
      topOffset: 'top-[calc(50%-7px)]',
    },
    xl: {
      container: 'w-28 h-28',
      ring: 'border-[5px]',
      innerRing: 'border-[4px]',
      pencil: 'w-6',
      pencilCap: 'h-3.5',
      pencilShaft: 'h-7',
      pencilPoint: 'h-6',
      tip: 'w-3 h-2.5',
      topOffset: 'top-[calc(50%-8.5px)]',
    }
  };

  const config = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo Container */}
      <div className={`relative ${config.container} cursor-pointer transition-transform duration-300 hover:scale-105 group`}>
        
        {/* Outer Rings */}
        <div className={`absolute inset-0 rounded-full border ${config.ring} border-[#d4ff9d] box-border transition-all duration-300 group-hover:border-[#e8ffb0]`}></div>
        
        {/* Middle Ring */}
        <div className={`absolute rounded-full border ${config.ring} border-[#d4ff9d] box-border transition-all duration-300 group-hover:border-[#e8ffb0]`} style={{ width: '78%', height: '78%', top: '11%', left: '11%' }}></div>
        
        {/* Inner Circle */}
        <div className={`absolute rounded-full bg-gray-400 border ${config.innerRing} border-[#d4ff9d] box-border transition-all duration-300 group-hover:border-[#e8ffb0]`} style={{ width: '56%', height: '56%', top: '22%', left: '22%' }}></div>

        {/* 🔥 Pencil - Tip exactly at center */}
        <div 
          className={`absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center ${config.pencil}`}
          style={{ top: config.topOffset }}
        >
          {/* Pencil Top Cap */}
          <div className={`w-full ${config.pencilCap} bg-[#d4ff9d] rounded-t-[50px] rounded-b-[4px] mb-0.5 transition-colors duration-300 group-hover:bg-[#e8ffb0]`}></div>
          
          {/* Pencil Shaft */}
          <div className={`w-full ${config.pencilShaft} flex justify-between gap-[2px]`}>
            <div className={`w-[7px] bg-[#d4ff9d] h-full rounded-[2px] transition-colors duration-300 group-hover:bg-[#e8ffb0]`}></div>
            <div className={`w-[7px] bg-[#d4ff9d] h-full rounded-[2px] transition-colors duration-300 group-hover:bg-[#e8ffb0]`} style={{ marginTop: '-2px', height: `calc(100% + 2px)` }}></div>
            <div className={`w-[7px] bg-[#d4ff9d] h-full rounded-[2px] transition-colors duration-300 group-hover:bg-[#e8ffb0]`}></div>
          </div>
          
          {/* Pencil Point - Tip yahan se start hota hai */}
          <div className={`relative w-full ${config.pencilPoint} bg-[#d4ff9d] clip-path-polygon mt-[-2px] transition-colors duration-300 group-hover:bg-[#e8ffb0]`}>
            {/* Black Tip */}
            <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${config.tip} bg-gradient-to-br from-gray-800 to-black clip-path-polygon-sm rounded-b-[1px]`}></div>
          </div>
        </div>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="text-center mt-2">
          <div className={`font-extrabold bg-gradient-to-r from-[#d4ff9d] to-[#a8e063] bg-clip-text text-transparent tracking-[2px] text-xs`}>
            ONLIBRY
          </div>
          <div className={`tracking-[3px] text-gray-500 font-medium text-[6px]`}>
            LEARN ANYTIME, ANYWHERE
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlibryLogo;