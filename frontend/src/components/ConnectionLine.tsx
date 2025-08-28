import React from 'react';

interface ConnectionLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  isDragging?: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({ from, to, isDragging = false }) => {
  const controlPointOffset = Math.min(Math.abs(to.x - from.x) / 2, 100);
  
  const path = `M ${from.x},${from.y} C ${from.x + controlPointOffset},${from.y} ${to.x - controlPointOffset},${to.y} ${to.x},${to.y}`;

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <path
        d={path}
        stroke={isDragging ? "#3b82f6" : "#6b7280"}
        strokeWidth={isDragging ? "3" : "2"}
        fill="none"
        strokeDasharray={isDragging ? "5,5" : "none"}
        className={isDragging ? "animate-pulse" : ""}
      />
      
      {/* Arrow head */}
      <defs>
        <marker
          id={isDragging ? "arrowhead-dragging" : "arrowhead"}
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
          fill={isDragging ? "#3b82f6" : "#6b7280"}
        >
          <polygon points="0 0, 10 3.5, 0 7" />
        </marker>
      </defs>
      
      <path
        d={path}
        stroke="transparent"
        strokeWidth="2"
        fill="none"
        markerEnd={`url(#${isDragging ? "arrowhead-dragging" : "arrowhead"})`}
      />
    </svg>
  );
};