import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const gridColor = "#1c1e24";
const axisColor = "#5c6067";

const tooltipStyle = {
  background: "#17191e",
  border: "1px solid #23262c",
  borderRadius: 8,
  fontSize: 12,
  color: "#e9eaec",
};

export function ActivityChart({ data }: { data: { date: string; success: number; failed: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3ecf8e" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#3ecf8e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e5636a" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#e5636a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridColor} vertical={false} />
        <XAxis dataKey="date" stroke={axisColor} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis stroke={axisColor} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="success" stroke="#3ecf8e" fill="url(#successGrad)" strokeWidth={2} name="Successful" />
        <Area type="monotone" dataKey="failed" stroke="#e5636a" fill="url(#failedGrad)" strokeWidth={2} name="Failed" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MetricLineChart({ data, dataKey, color, height = 200 }: {
  data: { step: number; value: number }[]; dataKey?: string; color?: string; height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} vertical={false} />
        <XAxis dataKey="step" stroke={axisColor} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis stroke={axisColor} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="value" name={dataKey ?? "value"} stroke={color ?? "#5b8def"} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MultiRunLineChart({ data, lines }: {
  data: Record<string, number | string>[];
  lines: { key: string; color: string; label: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} vertical={false} />
        <XAxis dataKey="step" stroke={axisColor} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis stroke={axisColor} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11.5, color: "#93979f" }} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.label} stroke={l.color} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CompareBarChart({ data, bars }: {
  data: Record<string, number | string>[];
  bars: { key: string; color: string; label: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} vertical={false} />
        <XAxis dataKey="name" stroke={axisColor} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis stroke={axisColor} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={34} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1a1c21" }} />
        <Legend wrapperStyle={{ fontSize: 11.5, color: "#93979f" }} />
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

const pieColors = ["#5b8def", "#f2b84b", "#3ecf8e", "#9b8cf2", "#e8a23c"];

export function DistributionPie({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} stroke="#0a0b0d" strokeWidth={2} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11.5, color: "#93979f" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function FeatureBar({ name, value, max = 1 }: { name: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 shrink-0 truncate text-[12px] text-text-muted">{name}</div>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-track" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-10 shrink-0 text-right font-mono text-[11.5px] text-text-faint">{value.toFixed(2)}</div>
    </div>
  );
}
