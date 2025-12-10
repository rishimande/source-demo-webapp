"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Scatter, ComposedChart } from 'recharts';

interface SevenDayEnvelopeChartProps {
  windowStart: string;
  windowEnd: string;
  envelopeData: Array<{ hour: number; power: number }>;
  halfSineFit: Array<{ hour: number; power: number }>;
  filteredPeaks: Array<{ hour: number; power: number }>;
  batteryDipHour: number | null;
}

export function SevenDayEnvelopeChart({
  windowStart,
  windowEnd,
  envelopeData,
  halfSineFit,
  filteredPeaks,
  batteryDipHour
}: SevenDayEnvelopeChartProps) {
  
  // Merge data for proper rendering
  const mergedData = [...envelopeData, ...halfSineFit]
    .reduce((acc, item) => {
      const existing = acc.find(d => d.hour === item.hour);
      if (existing) {
        if (envelopeData.includes(item)) {
          existing.envelope = item.power;
        } else {
          existing.fit = item.power;
        }
      } else {
        const newPoint: any = { hour: item.hour };
        if (envelopeData.includes(item)) {
          newPoint.envelope = item.power;
        } else {
          newPoint.fit = item.power;
        }
        acc.push(newPoint);
      }
      return acc;
    }, [] as Array<{ hour: number; envelope?: number; fit?: number }>)
    .sort((a, b) => a.hour - b.hour);

  // Add peaks as separate data points
  const peaksData = filteredPeaks.map(peak => ({
    hour: peak.hour,
    power: peak.power
  }));

  return (
    <ResponsiveContainer width="100%" height={300} className="sm:!h-[400px]">
      <ComposedChart margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="hour"
          type="number"
          domain={[6, 18]}
          ticks={[6, 8, 10, 12, 14, 16, 18]}
          label={{ value: 'Local Time (Hour)', position: 'insideBottom', offset: -5, style: { fontSize: '12px' } }}
          stroke="#64748b"
          style={{ fontSize: '11px' }}
          allowDuplicatedCategory={false}
        />
        <YAxis 
          label={{ value: 'Power (W)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          domain={[0, 'auto']}
          stroke="#64748b"
          style={{ fontSize: '11px' }}
        />
        <Tooltip 
          formatter={(value: number, name: string) => {
            if (name === 'envelope') return [value.toFixed(1) + ' W', '7-Day Max Envelope'];
            if (name === 'fit') return [value.toFixed(1) + ' W', 'Half-Sine Fit (7-day)'];
            if (name === 'power') return [value.toFixed(1) + ' W', 'Filtered Peak'];
            return [value, name];
          }}
          labelFormatter={(label: number) => `Hour: ${label.toFixed(1)}`}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
          iconType="line"
        />
        
        {/* Half-Sine Fit (Blue Line) */}
        <Line
          data={mergedData}
          type="monotone"
          dataKey="fit"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="Half-Sine Fit (7-day)"
          connectNulls
        />
        
        {/* 7-Day Max Envelope (Red Line with dots) */}
        <Line
          data={mergedData}
          type="monotone"
          dataKey="envelope"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 4, fill: '#ef4444' }}
          name="7-Day Max Envelope"
          connectNulls
        />
        
        {/* Filtered Peaks (Green dots) */}
        <Scatter
          data={peaksData}
          dataKey="power"
          fill="#22c55e"
          shape="circle"
          name="Filtered Peaks"
        />
        
        {/* Battery Dip Marker (Purple dashed line) */}
        {batteryDipHour !== null && (
          <ReferenceLine 
            x={batteryDipHour} 
            stroke="#a855f7" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ 
              value: 'Battery Dip', 
              position: 'top', 
              fill: '#a855f7',
              fontSize: 12
            }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

