import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { KpiMetric } from '../../types';

interface KpiCardProps {
  metric: KpiMetric;
  icon?: React.ComponentType<{ className?: string }>;
}

export const KpiCard: React.FC<KpiCardProps> = ({ metric, icon: Icon }) => {
  const isPositive = metric.change_percentage > 0;
  const isNeutral = metric.change_percentage === 0;

  // Split numeric prefix and text suffix (e.g., "96.8 / 100" -> main: "96.8", suffix: "/ 100"; "4 Executed" -> main: "4", suffix: "Executed")
  const parseValue = (raw: string) => {
    if (!raw) return { main: '0', suffix: '' };
    const parts = raw.trim().split(' ');
    if (parts.length > 1) {
      return {
        main: parts[0],
        suffix: parts.slice(1).join(' '),
      };
    }
    return { main: raw, suffix: '' };
  };

  const { main: mainVal, suffix: subVal } = parseValue(metric.value);

  // Generate smooth curved SVG sparkline with area gradient fill
  const renderSparkline = () => {
    if (!metric.sparkline || metric.sparkline.length < 2) return null;
    const min = Math.min(...metric.sparkline);
    const max = Math.max(...metric.sparkline);
    const range = max - min || 1;
    const width = 100;
    const height = 32;

    // Normalize points
    const pts = metric.sparkline.map((val, idx) => {
      const x = (idx / (metric.sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return { x, y };
    });

    // Create SVG smooth path (Catmull-Rom or bezier smoothing)
    const dPath = pts.reduce((acc, pt, i, arr) => {
      if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      const prev = arr[i - 1];
      const cpX1 = (prev.x + (pt.x - prev.x) / 2).toFixed(1);
      const cpX2 = cpX1;
      return `${acc} C ${cpX1} ${prev.y.toFixed(1)}, ${cpX2} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }, '');

    const areaPath = `${dPath} L ${width} ${height} L 0 ${height} Z`;

    const strokeColor =
      metric.status === 'positive'
        ? '#16A34A'
        : metric.status === 'warning'
        ? '#D97706'
        : metric.status === 'critical'
        ? '#DC2626'
        : '#C5855A';

    const gradId = `spark-grad-${metric.title.replace(/\s+/g, '-').toLowerCase()}`;

    return (
      <div className="w-20 sm:w-24 h-8 shrink-0">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} />
          <path d={dPath} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  };

  return (
    <div className="auren-card auren-card-hover p-4 sm:p-5 flex flex-col justify-between h-full relative overflow-hidden transition-all shadow-sm border border-[#E2DAD0] rounded-2xl bg-[#FAF8F5]">
      {/* Card Header: Title + Icon */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] leading-snug line-clamp-2">
          {metric.title}
        </span>
        {Icon && (
          <div className="p-1.5 rounded-xl bg-[#EFECE6] border border-[#DDD5CA] text-[#8E5633] shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Main Metric Value + Smooth Sparkline */}
      <div className="mt-3.5 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1C1917] font-display">
            {mainVal}
          </span>
          {subVal && (
            <span className="text-[11px] font-semibold text-[#78716C] tracking-normal">
              {subVal}
            </span>
          )}
        </div>
        {renderSparkline()}
      </div>

      {/* Footer / Delta & Timeframe */}
      <div className="mt-3.5 flex items-center justify-between text-xs pt-2.5 border-t border-[#E2DAD0]/70">
        <div className="flex items-center space-x-1 font-semibold text-[11px]">
          {isNeutral ? (
            <span className="flex items-center text-[#78716C] font-mono">
              <Minus className="w-3 h-3 mr-0.5" /> 0.0%
            </span>
          ) : isPositive ? (
            <span className="flex items-center text-[#16A34A] font-mono">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> +{metric.change_percentage}%
            </span>
          ) : (
            <span className="flex items-center text-[#DC2626] font-mono">
              <ArrowDownRight className="w-3 h-3 mr-0.5" /> {metric.change_percentage}%
            </span>
          )}
          <span className="text-[10px] font-normal text-[#78716C] pl-1 truncate max-w-[90px] sm:max-w-none">
            {metric.time_range}
          </span>
        </div>
      </div>
    </div>
  );
};
