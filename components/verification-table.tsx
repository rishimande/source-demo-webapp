"use client";

import { useState } from 'react';
import { DailyMetric } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface VerificationTableProps {
  metrics: DailyMetric[];
}

export function VerificationTable({ metrics }: VerificationTableProps) {
  const [showFailingOnly, setShowFailingOnly] = useState(false);
  
  // Filter metrics based on toggle
  const filteredMetrics = showFailingOnly
    ? metrics.filter(m => 
        !m["sinusoidality_pass_<=30pct"] || 
        !m["negative_noise_pass_<=5pct_violations"] || 
        !m["no_generation_outside_daylight_pass_>=95pct"]
      )
    : metrics;
  
  // Format battery dip time to local time
  const formatBatteryDipTime = (dipTime: string | null): string => {
    if (!dipTime) return '—';
    
    try {
      const date = new Date(dipTime);
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const LOCAL_TIME_OFFSET = -6;
      const localHours = (hours + LOCAL_TIME_OFFSET + 24) % 24;
      return `${String(localHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch (e) {
      return '—';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Legend and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-emerald-600">✓</span>
            <span className="text-slate-600">Passes</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-red-600">✗</span>
            <span className="text-slate-600">Fails</span>
          </div>
        </div>
        
        <label className="flex items-center gap-2 text-xs sm:text-sm">
          <input
            type="checkbox"
            checked={showFailingOnly}
            onChange={(e) => setShowFailingOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
          />
          <span className="text-slate-700">Show only failing days</span>
        </label>
      </div>
      
      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Date</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Sinusoidality NRMSE</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Sinusoidality Pass</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Frac Above Model</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Negative Noise Pass</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Frac Low Outside</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">No-Gen Pass</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Lambda</TableHead>
              <TableHead className="whitespace-nowrap text-xs sm:text-sm">Battery Dip</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMetrics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-slate-500 py-8 text-xs sm:text-sm">
                  {showFailingOnly ? 'No failing days found' : 'No data available'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMetrics.map((metric) => (
                <TableRow key={metric.date}>
                  <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">{metric.date}</TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {metric.sinusoidality_nrmse !== null 
                      ? (metric.sinusoidality_nrmse * 100).toFixed(2) + '%'
                      : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {metric["sinusoidality_pass_<=30pct"] ? (
                      <span className="text-emerald-600 font-semibold">✓</span>
                    ) : (
                      <span className="text-red-600 font-semibold">✗</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {metric.frac_points_obs_gt_model_plus_5pct !== null 
                      ? (metric.frac_points_obs_gt_model_plus_5pct * 100).toFixed(2) + '%'
                      : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {metric["negative_noise_pass_<=5pct_violations"] ? (
                      <span className="text-emerald-600 font-semibold">✓</span>
                    ) : (
                      <span className="text-red-600 font-semibold">✗</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {metric.fraction_low_power_outside_daylight !== null 
                      ? (metric.fraction_low_power_outside_daylight * 100).toFixed(2) + '%'
                      : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    {metric["no_generation_outside_daylight_pass_>=95pct"] ? (
                      <span className="text-emerald-600 font-semibold">✓</span>
                    ) : (
                      <span className="text-red-600 font-semibold">✗</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm">
                    {metric.lambda_day !== null 
                      ? metric.lambda_day.toFixed(4)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                    {formatBatteryDipTime(metric.detected_battery_dip)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {filteredMetrics.length > 0 && (
        <p className="text-sm text-slate-500">
          Showing {filteredMetrics.length} of {metrics.length} days
        </p>
      )}
    </div>
  );
}

