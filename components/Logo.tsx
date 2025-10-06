import React from 'react';

/**
 * Inlined SVG component for the BrewFlow logo.
 * This approach is used to fix rendering issues where the external logo.svg file was not displaying.
 * The design combines a hop cone and a liquid drop using the app's accent color.
 */
export const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path 
      d="M50 2 C25 2 10 30 10 50 C10 75 50 98 50 98 S90 75 90 50 C90 30 75 2 50 2 Z" 
      fill="#fd7e14" 
    />
    <g fill="#FFFFFF" fillOpacity="0.75">
      <path d="M50 25 C42 35 42 45 50 55 C58 45 58 35 50 25 Z" />
      <path d="M50 50 C38 60 38 70 50 80 C62 70 62 60 50 50 Z" />
      <path d="M39 38 C34 48 39 58 49 63 C44 53 44 43 39 38 Z" />
      <path d="M61 38 C66 48 61 58 51 63 C56 53 56 43 61 38 Z" />
    </g>
  </svg>
);
