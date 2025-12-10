"use client";

import { HeartbeatSample } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DailyPowerChartProps {
  samples: HeartbeatSample[];
  batteryDipTime?: string | null;
}

export function DailyPowerChart({ samples, batteryDipTime }: DailyPowerChartProps) {
  // Prepare data for the chart
  const chartData = samples.map(sample => ({
    localHour: sample.local_hour,
    power: sample.power_W_raw,
    time: sample.local_hour.toFixed(2)
  }));
  
  // Parse battery dip time to local hour if available
  let batteryDipHour: number | null = null;
  if (batteryDipTime) {
    try {
      const dipDate = new Date(batteryDipTime);
      const utcHour = dipDate.getUTCHours();
      const utcMinute = dipDate.getUTCMinutes();
      const utcSecond = dipDate.getUTCSeconds();
      const LOCAL_TIME_OFFSET = -6;
      batteryDipHour = (utcHour + utcMinute / 60 + utcSecond / 3600 + LOCAL_TIME_OFFSET + 24) % 24;
    } catch (e) {
      console.error('Error parsing battery dip time:', e);
    }
  }
  
  return (
    <ResponsiveContainer width="100%" height={300} className="sm:!h-[400px]">
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="localHour" 
          label={{ value: 'Local Time (Hour)', position: 'insideBottom', offset: -5, style: { fontSize: '12px' } }}
          domain={[6, 18]}
          ticks={[6, 8, 10, 12, 14, 16, 18]}
          stroke="#64748b"
          style={{ fontSize: '11px' }}
        />
        <YAxis 
          label={{ value: 'Power (W)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          stroke="#64748b"
          style={{ fontSize: '11px' }}
        />
        <Tooltip 
          formatter={(value: number) => [`${value.toFixed(2)} W`, 'Power']}
          labelFormatter={(label: number) => `Hour: ${label.toFixed(2)}`}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="power" 
          stroke="#0ea5e9" 
          strokeWidth={2}
          dot={{ r: 3, fill: '#0ea5e9' }}
          name="Observed Power"
        />
        {batteryDipHour !== null && (
          <ReferenceLine 
            x={batteryDipHour} 
            stroke="#a855f7" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: 'Battery Dip', position: 'top', fill: '#a855f7' }}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

