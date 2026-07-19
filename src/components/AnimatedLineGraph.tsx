import React from "react";
import { motion } from "framer-motion";

const data = [
  { date: '01/11', vendas: 120 },
  { date: '02/11', vendas: 200 },
  { date: '03/11', vendas: 150 },
  { date: '04/11', vendas: 300 },
  { date: '05/11', vendas: 250 },
  { date: '06/11', vendas: 400 },
  { date: '07/11', vendas: 350 },
];

function getPath(points) {
  return points.reduce(
    (acc, [x, y], i) =>
      i === 0 ? `M${x},${y}` : `${acc} L${x},${y}`,
    ""
  );
}

export default function AnimatedLineGraph({ width = 400, height = 200 }) {
  const padding = 32;
  const maxY = Math.max(...data.map((d) => d.vendas));
  const minY = Math.min(...data.map((d) => d.vendas));
  const stepX = (width - padding * 2) / (data.length - 1);
  const points = data.map((d, i) => [
    padding + i * stepX,
    height - padding - ((d.vendas - minY) / (maxY - minY || 1)) * (height - padding * 2)
  ]);
  const path = getPath(points);

  const [hovered, setHovered] = React.useState<number | null>(null);
  const [tooltip, setTooltip] = React.useState<{x:number, y:number, value:number, date:string} | null>(null);

  return (
    <svg width={width} height={height} className="w-full h-auto" style={{overflow: 'visible'}}>
      {/* Grid lines */}
      <g>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1={padding}
            x2={width - padding}
            y1={height - padding - t * (height - padding * 2)}
            y2={height - padding - t * (height - padding * 2)}
            stroke="#e5e7eb"
            strokeDasharray="4 2"
          />
        ))}
      </g>
      {/* Animated line */}
      <motion.path
        d={path}
        fill="none"
        stroke="#2563eb"
        strokeWidth={3}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      {/* Animated points + hover */}
      {points.map(([x, y], i) => (
        <g key={i}>
          <motion.circle
            cx={x}
            cy={y}
            r={hovered === i ? 10 : 6}
            fill={hovered === i ? "#f59e42" : "#2563eb"}
            style={{ cursor: 'pointer' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1, type: "spring", stiffness: 200 }}
            onMouseEnter={() => {
              setHovered(i);
              setTooltip({ x, y, value: data[i].vendas, date: data[i].date });
            }}
            onMouseLeave={() => {
              setHovered(null);
              setTooltip(null);
            }}
          />
          {/* Valor acima do ponto ao hover */}
          {hovered === i && (
            <text x={x} y={y - 18} textAnchor="middle" fontSize={13} fontWeight={600} fill="#f59e42" style={{ pointerEvents: 'none' }}>
              {data[i].vendas}
            </text>
          )}
        </g>
      ))}
      {/* Tooltip customizado */}
      {tooltip && (
        <foreignObject x={tooltip.x - 40} y={tooltip.y - 50} width={80} height={32} style={{ pointerEvents: 'none' }}>
          <div className="bg-white border border-orange-300 rounded px-2 py-1 text-xs text-zinc-700 shadow-lg" style={{fontSize:12, textAlign:'center'}}>
            <div><b>{tooltip.value}</b> vendas</div>
            <div>{tooltip.date}</div>
          </div>
        </foreignObject>
      )}
      {/* X axis labels */}
      {data.map((d, i) => (
        <text
          key={d.date}
          x={padding + i * stepX}
          y={height - padding + 18}
          textAnchor="middle"
          fontSize={12}
          fill="#6b7280"
        >
          {d.date}
        </text>
      ))}
      {/* Y axis labels */}
      {[maxY, minY].map((yVal, i) => (
        <text
          key={yVal}
          x={padding - 8}
          y={i === 0 ? padding + 8 : height - padding}
          textAnchor="end"
          fontSize={12}
          fill="#6b7280"
        >
          {yVal}
        </text>
      ))}
    </svg>
  );
}
