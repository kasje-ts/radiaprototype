import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type CompetencyAxis = { key: string; name: string };
type Scores = Partial<Record<string, number>>;

type RadarSeries = {
  label: string;
  scores: Scores;
  color: string;
  fillOpacity?: number;
  dashed?: boolean;
};

type RadarSegment = {
  color: string;
  keys: string[];
  opacity?: number;
};

export function GenericRadarChart({
  competencies,
  series,
  segments,
  min = 0,
  max = 5,
  height = 320,
}: {
  competencies: CompetencyAxis[];
  series: RadarSeries[];
  segments?: RadarSegment[];
  min?: number;
  max?: number;
  height?: number;
}) {
  const labels = competencies.map(c => c.name);

  const toRgba = (color: string, alpha: number) => {
    if (color.startsWith('rgba')) {
      return color.replace(/rgba\(([^)]+),\s*[\d.]+\)/, `rgba($1, ${alpha})`);
    }
    if (color.startsWith('rgb(')) {
      return color.replace(/rgb\(([^)]+)\)/, `rgba($1, ${alpha})`);
    }
    if (color.startsWith('#')) {
      let hex = color.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      const n = parseInt(hex, 16);
      const r = (n >> 16) & 255;
      const g = (n >> 8) & 255;
      const b = n & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  };

  const datasets = series.map(s => ({
    label: s.label,
    data: competencies.map(c => s.scores[c.key] ?? 0),
    backgroundColor: 'transparent',
    borderColor: s.color,
    pointBackgroundColor: s.color,
    pointBorderColor: toRgba(s.color, 0.4),
    pointRadius: 4,
    borderWidth: 2,
    fill: false,
    tension: 0.1,
    borderDash: s.dashed ? [4, 4] : undefined,
  }));

  const data = { labels, datasets };

  const segmentRanges = React.useMemo(() => {
    if (!segments?.length) return [];
    const indexByKey = new Map(competencies.map((c, i) => [c.key, i]));
    return segments
      .map(seg => {
        const indices = seg.keys
          .map(k => indexByKey.get(k))
          .filter((v): v is number => v !== undefined)
          .sort((a, b) => a - b);
        if (!indices.length) return null;
        return {
          start: indices[0],
          end: indices[indices.length - 1],
          color: toRgba(seg.color, seg.opacity ?? 0.08),
        };
      })
      .filter((v): v is { start: number; end: number; color: string } => v !== null);
  }, [segments, competencies]);

  const segmentPlugin = React.useMemo(() => {
    if (!segmentRanges.length) return undefined;
    return {
      id: 'radar-segments',
      beforeDraw: (chart: ChartJS) => {
        const scale = chart.scales?.r as {
          drawingArea: number;
          max: number;
          xCenter: number;
          yCenter: number;
          getCenterPoint?: () => { x: number; y: number };
          getPointPositionForValue: (index: number, value: number) => { x: number; y: number };
        } | undefined;

        if (!scale) return;
        const labelCount = Array.isArray(chart.data.labels) ? chart.data.labels.length : 0;
        if (!labelCount) return;

        const center = scale.getCenterPoint
          ? scale.getCenterPoint()
          : { x: scale.xCenter, y: scale.yCenter };
        if (!Number.isFinite(center.x) || !Number.isFinite(center.y)) return;
        const radius = scale.drawingArea;
        const angles = Array.from({ length: labelCount }, (_, i) => {
          const point = scale.getPointPositionForValue(i, scale.max);
          return Math.atan2(point.y - center.y, point.x - center.x);
        });

        const boundaries = angles.map((angle, i) => {
          const next = angles[(i + 1) % labelCount];
          const x = Math.cos(angle) + Math.cos(next);
          const y = Math.sin(angle) + Math.sin(next);
          return Math.atan2(y, x);
        });

        const normalize = (angle: number) => {
          let a = angle;
          while (a <= -Math.PI) a += Math.PI * 2;
          while (a > Math.PI) a -= Math.PI * 2;
          return a;
        };

        const delta = labelCount > 1 ? normalize(angles[1] - angles[0]) : 1;
        const anticlockwise = delta < 0;

        const { ctx } = chart;
        ctx.save();
        segmentRanges.forEach(seg => {
          const startBoundary = boundaries[(seg.start - 1 + labelCount) % labelCount];
          const endBoundary = boundaries[seg.end % labelCount];
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.arc(center.x, center.y, radius, startBoundary, endBoundary, anticlockwise);
          ctx.closePath();
          ctx.fillStyle = seg.color;
          ctx.fill();
        });
        ctx.restore();
      },
    };
  }, [segmentRanges]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: {
      r: {
        min,
        max,
        ticks: { display: false },
        grid: { color: 'rgba(0,0,0,0.08)' },
        angleLines: { color: 'rgba(0,0,0,0.08)' },
        pointLabels: { font: { size: 11 } },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Radar data={data} options={options} plugins={segmentPlugin ? [segmentPlugin] : []} />
    </div>
  );
}
