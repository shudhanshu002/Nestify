import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Nestify Brand Logo Component
 * Renders ONLY the isolated 3D red canopy wordmark with transparent background,
 * naturally matching whatever background color the website / navbar has.
 * No photographic background box or border.
 */
const Logo = ({ 
  size = 'md', 
  to = '/', 
  className = '',
  imgClassName = ''
}) => {
  // Height presets for the wordmark
  const heightClasses = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-9 sm:h-10',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20',
  }[size] || 'h-9 sm:h-10';

  const logoContent = (
    <div className={`relative inline-flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${className}`}>
      <img 
        src="/nestify-wordmark.png" 
        alt="Nestify" 
        className={`${heightClasses} w-auto object-contain select-none drop-shadow-[0_2px_10px_rgba(229,9,20,0.4)] group-hover:drop-shadow-[0_4px_16px_rgba(229,9,20,0.65)] transition-all ${imgClassName}`}
        loading="eager"
      />
    </div>
  );

  if (!to) {
    return <div className="group cursor-default inline-block">{logoContent}</div>;
  }

  return (
    <Link 
      to={to} 
      className="group inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
    >
      {logoContent}
    </Link>
  );
};

export default Logo;
