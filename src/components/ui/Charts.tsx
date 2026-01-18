import React from 'react';
import { motion } from 'framer-motion';

interface ChartProps {
    data: number[];
    labels: string[];
    color?: string;
    height?: number;
    className?: string;
}

export const LineChart: React.FC<ChartProps> = ({ data, labels, color = '#6366f1', height = 200, className }) => {
    // Handle empty data
    if (!data || data.length === 0) {
        return (
            <div className={`w-full relative flex items-center justify-center text-zinc-500 ${className}`} style={{ height }}>
                <p className="text-sm">No data available</p>
            </div>
        );
    }

    const max = Math.max(...data, 100);
    const min = 0;
    const range = max - min || 1; // Prevent division by zero

    // Calculate points - handle single data point
    const points = data.map((val, i) => {
        const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return [x, Math.max(5, Math.min(95, y))]; // Keep points visible
    });

    // Generate path
    const pathD = points.reduce((acc, point, i, arr) => {
        if (i === 0) return `M ${point[0]},${point[1]}`;
        const prev = arr[i - 1];
        // Simple smoothing
        const cp1x = prev[0] + (point[0] - prev[0]) / 2;
        const cp1y = prev[1];
        const cp2x = prev[0] + (point[0] - prev[0]) / 2;
        const cp2y = point[1];
        return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point[0]},${point[1]}`;
    }, '');

    return (
        <div className={`w-full relative ${className}`} style={{ height }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                {[0, 25, 50, 75, 100].map(y => (
                    <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" className="text-white" />
                ))}

                {/* Gradient Definition */}
                <defs>
                    <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area Fill */}
                <motion.path
                    d={`${pathD} L 100,100 L 0,100 Z`}
                    fill={`url(#gradient-${color})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                />

                {/* Line Path */}
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {/* Dots */}
                {points.map((point, i) => (
                    <motion.circle
                        key={i}
                        cx={point[0]}
                        cy={point[1]}
                        r="2"
                        fill="#09090b"
                        stroke={color}
                        strokeWidth="2"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + i * 0.1 }}
                        className="hover:scale-150 transition-transform cursor-pointer"
                    >
                        <title>{`${labels[i]}: ${data[i]}%`}</title>
                    </motion.circle>
                ))}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                {labels.map((label, i) => (
                    <span key={i}>{label}</span>
                ))}
            </div>
        </div>
    );
};

export const BarChart: React.FC<ChartProps> = ({ data, labels, color = '#10b981', height = 200, className }) => {
    // Handle empty data
    if (!data || data.length === 0) {
        return (
            <div className={`w-full flex items-center justify-center text-zinc-500 ${className}`} style={{ height }}>
                <p className="text-sm">No data available</p>
            </div>
        );
    }

    // Check if all values are zero
    const allZero = data.every(v => v === 0);

    return (
        <div className={`w-full ${className}`} style={{ height }}>
            <div className="h-full flex items-end justify-between gap-2">
                {data.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full relative h-full flex items-end bg-white/[0.03] rounded-t-lg overflow-hidden">
                            <motion.div
                                className="w-full rounded-t-lg relative group-hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: allZero ? `${color}40` : color }}
                                initial={{ height: 0 }}
                                animate={{ height: allZero ? '5%' : `${Math.max(val, 2)}%` }}
                                transition={{ duration: 1, delay: i * 0.1, ease: 'backOut' }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {val}%
                                </div>
                            </motion.div>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider truncate w-full text-center">
                            {labels[i]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const HeatmapChart: React.FC<{ data: { x: string; y: string; value: number }[]; height?: number; className?: string }> = ({ data, height = 300, className }) => {
    // Basic heatmap implementation
    // Assuming data is for a standard grid like Days x Hours or similar
    // For this generalized version, we'll assume a 7x5ish grid or auto-detect based on unique X and Y

    const uniqueX = Array.from(new Set(data.map(d => d.x)));
    const uniqueY = Array.from(new Set(data.map(d => d.y)));

    const getIntensityColor = (value: number) => {
        // Simple scale from 0 to 100
        if (value === 0) return 'bg-zinc-900';
        if (value < 20) return 'bg-indigo-900/40';
        if (value < 40) return 'bg-indigo-800/60';
        if (value < 60) return 'bg-indigo-600/80';
        if (value < 80) return 'bg-indigo-500';
        return 'bg-indigo-400';
    };

    return (
        <div className={`w-full ${className} flex flex-col`} style={{ height }}>
            {/* Header X-Axis */}
            <div className="flex ml-12 mb-2">
                {uniqueX.map((x, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                        {x}
                    </div>
                ))}
            </div>

            <div className="flex-1 flex flex-col justify-between">
                {uniqueY.map((y, rowIdx) => (
                    <div key={rowIdx} className="flex items-center flex-1 gap-1">
                        {/* Y-Axis Label */}
                        <div className="w-12 text-right pr-2 text-[10px] text-zinc-500 font-medium">{y}</div>

                        {/* Grid Cells */}
                        {uniqueX.map((x, colIdx) => {
                            const point = data.find(d => d.x === x && d.y === y);
                            const value = point ? point.value : 0;
                            return (
                                <motion.div
                                    key={`${x}-${y}`}
                                    className={`flex-1 h-full rounded-sm min-h-[20px] ${getIntensityColor(value)} border border-black/20 group relative cursor-pointer`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (rowIdx * uniqueX.length + colIdx) * 0.02 }}
                                >
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap border border-white/10">
                                        {value} students
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};
