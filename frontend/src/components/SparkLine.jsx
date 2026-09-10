import React, { useMemo } from 'react';

export function SparkLine({
  data, 
  width = 80, 
  height = 24, 
  color = '#00f0ff',
  fill = true, 
  min, 
  max, 
  strokeWidth = 1.5,
}) {
  const points = useMemo(() => {
    if (!data || data.length < 2) return '';
    const lo = min ?? Math.min(...data);
    const hi = max ?? Math.max(...data);
    const range = hi - lo || 1;
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - lo) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [data, width, height, min, max]);

  if (!points) return null;

  const pts = points.split(' ');
  const last = pts[pts.length - 1];
  const safeId = color.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0 overflow-visible">
      <defs>
        <linearGradient id={`sf-${safeId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && (
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={`url(#sf-${safeId})`}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0px 0px 3px ${color})` }}
      />
      {last && (
        <circle
          cx={parseFloat(last.split(',')[0]) || 0}
          cy={parseFloat(last.split(',')[1]) || 0}
          r={2.5} 
          fill={color}
          style={{ filter: `drop-shadow(0px 0px 4px ${color})` }}
        />
      )}
    </svg>
  );
}
