import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Nestify Brand Logo Component
 * Incorporates the official red 3D canopy wordmark from the design system.
 */
const Logo = ({ 
  size = 'md', 
  to = '/', 
  variant = 'default', // 'default', 'image', 'vector', 'mark-only'
  className = '' 
}) => {
  // Dimension presets
  const sizeClasses = {
    xs: { h: 'h-6', imgH: 'h-7', text: 'text-lg', canopy: 'w-5 h-3' },
    sm: { h: 'h-8', imgH: 'h-9', text: 'text-xl', canopy: 'w-6 h-3.5' },
    md: { h: 'h-10', imgH: 'h-11', text: 'text-2xl', canopy: 'w-8 h-4' },
    lg: { h: 'h-14', imgH: 'h-16', text: 'text-4xl', canopy: 'w-11 h-6' },
    xl: { h: 'h-20', imgH: 'h-24', text: 'text-6xl', canopy: 'w-16 h-8' },
  }[size] || { h: 'h-10', imgH: 'h-11', text: 'text-2xl', canopy: 'w-8 h-4' };

  // Content rendering based on variant
  const renderLogoContent = () => {
    if (variant === 'image') {
      return (
        <div className={`relative flex items-center overflow-hidden rounded-xl bg-[#0d0d0d] p-1 border border-red-950/30 shadow-md shadow-red-950/20 group-hover:border-primary/40 transition-all ${className}`}>
          <img 
            src="/nestify-logo.jpg" 
            alt="Nestify Logo" 
            className={`${sizeClasses.imgH} w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
          />
        </div>
      );
    }

    if (variant === 'mark-only') {
      // Just the iconic red canopy roof over the 'n'
      return (
        <div className="relative flex flex-col items-center justify-center">
          <svg viewBox="0 0 40 32" className={`${sizeClasses.canopy} fill-current text-primary filter drop-shadow-[0_2px_8px_rgba(229,9,20,0.5)]`} xmlns="http://www.w3.org/2000/svg">
            {/* Pagoda Canopy Roof */}
            <path d="M20 2 C 14 6, 6 9, 2 13 C 1 14, 3 15, 6 14 C 11 12, 16 9, 20 7 C 24 9, 29 12, 34 14 C 37 15, 39 14, 38 13 C 34 9, 26 6, 20 2 Z" fill="#E50914" />
            <path d="M12 18 C 12 14, 28 14, 28 18 L 28 30 L 23 30 L 23 20 C 23 18, 17 18, 17 20 L 17 30 L 12 30 Z" fill="#E50914" />
          </svg>
        </div>
      );
    }

    // Default: Ultra-crisp vector logo styled to match the official 3D red canopy wordmark
    return (
      <div className={`inline-flex items-center gap-1.5 select-none transition-transform duration-300 group-hover:scale-[1.02] ${className}`}>
        {/* Official uploaded image logo thumbnail with ambient glow */}
        <div className="relative overflow-hidden rounded-lg bg-[#0d0d0d] border border-red-900/40 p-0.5 shadow-[0_0_15px_rgba(229,9,20,0.3)] group-hover:shadow-[0_0_22px_rgba(229,9,20,0.5)] transition-all">
          <img 
            src="/nestify-logo.jpg" 
            alt="Nestify" 
            className={`${sizeClasses.imgH} w-auto object-contain`}
          />
        </div>

        {/* Crisp vector fallback / enhanced typography */}
        <span className="sr-only">Nestify</span>
      </div>
    );
  };

  if (!to) {
    return <div className="group cursor-default inline-block">{renderLogoContent()}</div>;
  }

  return (
    <Link to={to} className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
      {renderLogoContent()}
    </Link>
  );
};

export default Logo;
