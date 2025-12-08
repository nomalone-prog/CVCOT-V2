
import React from 'react';

interface CircularProgressRingProps {
  percentage: number;
  radius: number;
  strokeWidth: number;
  color: string;
}

export const CircularProgressRing: React.FC<CircularProgressRingProps> = ({
  percentage,
  radius,
  strokeWidth,
  color,
}) => {
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg
      height={radius * 2}
      width={radius * 2}
      viewBox={`0 0 ${radius * 2} ${radius * 2}`}
    >
      <circle
        stroke="#334155" // slate-700 for background
        fill="transparent"
        strokeWidth={strokeWidth}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference + ' ' + circumference}
        style={{ strokeDashoffset }}
        strokeLinecap="round"
        transform={`rotate(-90 ${radius} ${radius})`}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};
