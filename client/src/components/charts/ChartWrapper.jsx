import React from 'react';
import { ResponsiveContainer } from 'recharts';

const ChartWrapper = ({ title, height = 300, children }) => {
  return (
    <div className="chart-container glass-card">
      {title && <h3 className="chart-title">{title}</h3>}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartWrapper;
