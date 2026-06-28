import { cn } from '@/lib/utils';

export const CHART_COLORS = [
  'hsl(221 83% 53%)', // primary blue
  'hsl(152 60% 40%)', // green
  'hsl(32 95% 50%)', // amber
  'hsl(280 65% 60%)', // violet
  'hsl(199 89% 48%)', // sky
  'hsl(0 72% 60%)', // red
  'hsl(215 16% 55%)', // slate
];

interface Datum {
  label: string;
  value: number;
}

/** Donut chart with a centered total and a legend. Pure SVG, no dependencies. */
export function DonutChart({
  data,
  size = 180,
  thickness = 26,
  className,
}: {
  data: Datum[];
  size?: number;
  thickness?: number;
  className?: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn('flex flex-col items-center gap-5 sm:flex-row sm:gap-8', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {data.map((d, i) => {
            const frac = d.value / total;
            const dash = frac * circ;
            const seg = (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return seg;
          })}
        </g>
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          className="fill-foreground text-2xl font-bold"
          dominantBaseline="middle"
        >
          {total}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          className="fill-muted-foreground text-[11px]"
          dominantBaseline="middle"
        >
          total
        </text>
      </svg>
      <ul className="grid w-full grid-cols-1 gap-2 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              {d.label}
            </span>
            <span className="font-medium tabular-nums text-foreground">
              {d.value}
              <span className="ml-1 text-xs text-muted-foreground">
                ({Math.round((d.value / total) * 100)}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal-friendly vertical bar chart. Pure SVG. */
export function BarChart({
  data,
  height = 200,
  className,
}: {
  data: Datum[];
  height?: number;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((d, i) => (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-2">
            <span className="text-xs font-medium tabular-nums text-foreground">{d.value}</span>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: `${(d.value / max) * (height - 40)}px`,
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                minHeight: 4,
              }}
            />
            <span className="line-clamp-1 text-center text-[11px] text-muted-foreground">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Simple area/line chart from a list of values. Pure SVG. */
export function LineChart({
  values,
  labels,
  height = 200,
  className,
}: {
  values: number[];
  labels?: string[];
  height?: number;
  className?: string;
}) {
  const w = 480;
  const h = height;
  const pad = 28;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(values.length - 1, 1);
  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn('w-full', className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lineFill)" />
      <path d={line} fill="none" stroke="hsl(221 83% 53%)" strokeWidth={2.5} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="hsl(221 83% 53%)" />
      ))}
      {labels &&
        labels.map((l, i) => (
          <text
            key={l + i}
            x={pad + i * stepX}
            y={h - 8}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {l}
          </text>
        ))}
    </svg>
  );
}
