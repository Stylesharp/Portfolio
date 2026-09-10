import React from 'react';

export function GaugeArc({
  value, min = 0, max, redline, warnline,
  size = 120, color = '#00f0ff', warnColor = '#facc15', criticalColor = '#ff003c',
  label, unit, strokeWidth = 5, decimals = 0
}) {
  const r = (size - strokeWidth * 2) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startA = Math.PI * 0.75;
  const endA = Math.PI * 2.25;
  const sweep = endA - startA;

  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const curA = startA + pct * sweep;

  const p2c = (a) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });

  const arc = (s, e) => {
    const sp = p2c(e), ep = p2c(s);
    return `M ${sp.x} ${sp.y} A ${r} ${r} 0 ${e - s <= Math.PI ? 0 : 1} 0 ${ep.x} ${ep.y}`;
  };

  const isRed = redline !== undefined && value >= redline;
  const isWarn = !isRed && warnline !== undefined && value >= warnline;
  const fill = isRed ? criticalColor : isWarn ? warnColor : color;

  const uid = `g-${(label || 'x').replace(/\W/g, '')}-${size}`;

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={fill} stopOpacity="1" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.3" />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Track */}
        <path d={arc(startA, endA)} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} strokeLinecap="round" />

        {/* Redline zone */}
        {redline !== undefined && (
          <path
            d={arc(startA + ((redline - min) / (max - min)) * sweep, endA)}
            fill="none" stroke="rgba(255, 0, 60, 0.2)" strokeWidth={strokeWidth} strokeLinecap="round"
          />
        )}
        
        {/* Warnline zone */}
        {warnline !== undefined && redline !== undefined && (
          <path
            d={arc(startA + ((warnline - min) / (max - min)) * sweep, startA + ((redline - min) / (max - min)) * sweep)}
            fill="none" stroke="rgba(250, 204, 21, 0.15)" strokeWidth={strokeWidth} strokeLinecap="round"
          />
        )}

        {/* Value arc */}
        {pct > 0.005 && (
          <path
            d={arc(startA, curA)}
            fill="none" stroke={`url(#${uid})`} strokeWidth={strokeWidth} strokeLinecap="round"
            className="transition-all duration-200 ease-out"
            filter={`url(#glow-${uid})`}
          />
        )}

        {/* Endpoint dot */}
        {pct > 0.01 && (() => {
          const pt = p2c(curA);
          return <circle cx={pt.x} cy={pt.y} r={strokeWidth / 2 + 1} fill={fill} opacity={0.9} filter={`url(#glow-${uid})`} />;
        })()}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-mono font-bold text-holo leading-none"
          style={{ fontSize: size > 100 ? '1.5rem' : '1rem', color: fill, textShadow: `0 0 10px ${fill}` }}>
          {decimals > 0 ? value.toFixed(decimals) : Math.round(value)}
        </span>
        {(unit || label) && (
          <span className="text-[10px] font-medium tracking-[0.1em] uppercase text-gray-400 mt-1">
            {unit || label}
          </span>
        )}
      </div>
    </div>
  );
}
