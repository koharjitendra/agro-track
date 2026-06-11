import React from 'react';

const Loader = ({ fullPage = false, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'loader-sm' : size === 'lg' ? 'loader-lg' : '';

  if (fullPage) {
    return (
      <div className="loader-full-page">
        <div className={`loader-spinner ${sizeClass}`}></div>
      </div>
    );
  }

  return (
    <div className="loader-container">
      <div className={`loader-spinner ${sizeClass}`}></div>
    </div>
  );
};

export const Skeleton = ({ variant = 'text', width, height, className = '' }) => {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`skeleton skeleton-${variant} ${className}`.trim()}
      style={style}
    />
  );
};

export default Loader;
