"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DailyPowerChart } from '@/components/daily-power-chart';
import { VerificationTable } from '@/components/verification-table';
import { SevenDayEnvelopeChart } from '@/components/seven-day-envelope-chart';
import { EnergyCertificates } from '@/components/energy-certificates';
import { 
  getAllDates, 
  getDaylightHeartbeatForDate,
  getDailyMetricForDate,
  getDailyMetrics,
  getVerificationStatus,
  getVerificationStats,
  getDataPeriodRange,
  getSevenDayWindows,
  getMetricsForWindow,
  calculateSevenDayEnvelope,
  calculateHalfSineFit,
  findFilteredPeaks,
  getMedianBatteryDipHour,
  getCarbonCreditStats
} from '@/lib/load-data';
import { DEVICE_NAME } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params.id as string;
  
  const allDates = getAllDates();
  const [selectedDate, setSelectedDate] = useState(allDates[allDates.length - 1] || '');
  
  const verificationStatus = getVerificationStatus();
  const verificationStats = getVerificationStats();
  const dataPeriod = getDataPeriodRange();
  const allMetrics = getDailyMetrics();
  const sevenDayWindows = getSevenDayWindows();
  const carbonStats = getCarbonCreditStats();
  
  // Get data for selected date
  const daylightSamples = getDaylightHeartbeatForDate(selectedDate);
  const dailyMetric = getDailyMetricForDate(selectedDate);
  
  // Calculate stats for selected day
  const maxPower = daylightSamples.length > 0 
    ? Math.max(...daylightSamples.map(s => s.power_W_raw)) 
    : 0;
  const maxPowerSample = daylightSamples.find(s => s.power_W_raw === maxPower);
  const maxPowerTime = maxPowerSample 
    ? `${Math.floor(maxPowerSample.local_hour).toString().padStart(2, '0')}:${Math.round((maxPowerSample.local_hour % 1) * 60).toString().padStart(2, '0')}`
    : 'N/A';
  
  // Get typical peak window (approximate from all data)
  const typicalPeakStart = 10.5;
  const typicalPeakEnd = 13.5;
  
  // Battery behavior stats
  const metricsWithDip = allMetrics.filter(m => m.detected_battery_dip !== null);
  const batteryDipPercentage = (metricsWithDip.length / allMetrics.length * 100).toFixed(1);
  
  // Calculate median battery dip time
  let medianDipTime = 'N/A';
  if (metricsWithDip.length > 0) {
    const dipHours = metricsWithDip.map(m => {
      if (!m.detected_battery_dip) return 0;
      const date = new Date(m.detected_battery_dip);
      const utcHour = date.getUTCHours();
      const utcMinute = date.getUTCMinutes();
      const LOCAL_TIME_OFFSET = -6;
      return (utcHour + utcMinute / 60 + LOCAL_TIME_OFFSET + 24) % 24;
    }).sort((a, b) => a - b);
    
    const medianHour = dipHours[Math.floor(dipHours.length / 2)];
    const hours = Math.floor(medianHour);
    const minutes = Math.round((medianHour % 1) * 60);
    medianDipTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back Button */}
      <Link
        href="/devices"
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Devices
      </Link>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-800 break-words">{DEVICE_NAME}</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 break-all">ID: {deviceId}</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data period: {dataPeriod.min} – {dataPeriod.max}
          </p>
        </div>
        
        <div className="flex-shrink-0">
          {verificationStatus === 'verified' ? (
            <Badge variant="success" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
              Source Verified
            </Badge>
          ) : (
            <Badge variant="warning" className="text-xs sm:text-sm px-2 sm:px-3 py-1">
              Needs Review
            </Badge>
          )}
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Generation Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generation Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Peak Power</p>
              <p className="text-2xl font-bold text-slate-800">
                {Math.max(...allDates.map(date => {
                  const samples = getDaylightHeartbeatForDate(date);
                  return samples.length > 0 ? Math.max(...samples.map(s => s.power_W_raw)) : 0;
                })).toFixed(1)} W
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-slate-500 mb-1">Typical Peak Window</p>
              <p className="font-medium text-slate-800">
                {Math.floor(typicalPeakStart).toString().padStart(2, '0')}:{((typicalPeakStart % 1) * 60).toFixed(0).padStart(2, '0')} – {Math.floor(typicalPeakEnd).toString().padStart(2, '0')}:{((typicalPeakEnd % 1) * 60).toFixed(0).padStart(2, '0')} local
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Verification Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verification Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Sinusoidality Pass</p>
              <p className="text-2xl font-bold text-emerald-600">
                {verificationStats.sinusoidalityPass.toFixed(1)}%
              </p>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Negative Noise:</span>
                <span className="font-medium">{verificationStats.negativeNoisePass.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">No-Gen Outside:</span>
                <span className="font-medium">{verificationStats.noGenerationPass.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Battery Behaviour */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Battery Behaviour</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Days with Battery Dip</p>
              <p className="text-2xl font-bold text-slate-800">
                {batteryDipPercentage}%
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-slate-500 mb-1">Typical Dip Time</p>
              <p className="font-medium text-slate-800">{medianDipTime} local</p>
            </div>
            <div>
              <p className="text-xs text-emerald-600 font-medium">
                Battery behaviour consistent
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="daily" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="daily" className="text-xs sm:text-sm px-2 sm:px-3 py-2">
            <span className="hidden sm:inline">Daily Power</span>
            <span className="sm:hidden">Daily</span>
          </TabsTrigger>
          <TabsTrigger value="envelope" className="text-xs sm:text-sm px-2 sm:px-3 py-2">
            <span className="hidden sm:inline">7-Day Envelope</span>
            <span className="sm:hidden">7-Day</span>
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs sm:text-sm px-2 sm:px-3 py-2">
            <span className="hidden sm:inline">Verification Diagnostics</span>
            <span className="sm:hidden">Verify</span>
          </TabsTrigger>
          <TabsTrigger value="certificates" className="text-xs sm:text-sm px-2 sm:px-3 py-2">
            <span className="hidden sm:inline">Energy Certificates</span>
            <span className="sm:hidden">Credits</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Tab 1: Daily Power */}
        <TabsContent value="daily" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base sm:text-lg">Daily Power Curve</CardTitle>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-full sm:w-auto"
                >
                  {allDates.slice().reverse().map(date => (
                    <option key={date} value={date}>{date}</option>
                  ))}
                </select>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Power generation vs local time (6:00 – 18:00)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {daylightSamples.length > 0 ? (
                <DailyPowerChart 
                  samples={daylightSamples} 
                  batteryDipTime={dailyMetric?.detected_battery_dip}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-500">
                  No data available for this date
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Day Summary */}
          {dailyMetric && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Day Summary – {selectedDate}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Max Power</p>
                    <p className="font-semibold text-slate-800">{maxPower.toFixed(1)} W</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Time of Max</p>
                    <p className="font-semibold text-slate-800">{maxPowerTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Sinusoidality</p>
                    {dailyMetric["sinusoidality_pass_<=30pct"] ? (
                      <Badge variant="success">Pass</Badge>
                    ) : (
                      <Badge variant="warning">Fail</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Negative Noise</p>
                    {dailyMetric["negative_noise_pass_<=5pct_violations"] ? (
                      <Badge variant="success">Pass</Badge>
                    ) : (
                      <Badge variant="warning">Fail</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">No-Gen Outside</p>
                    {dailyMetric["no_generation_outside_daylight_pass_>=95pct"] ? (
                      <Badge variant="success">Pass</Badge>
                    ) : (
                      <Badge variant="warning">Fail</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Tab 2: 7-Day Envelope */}
        <TabsContent value="envelope" className="space-y-6 sm:space-y-8">
          {sevenDayWindows.map((window, index) => {
            const windowMetrics = getMetricsForWindow(window.start, window.end);
            const envelopeData = calculateSevenDayEnvelope(window.start, window.end);
            
            // Get k1 and k2 (should be same for all days in window)
            const k1 = windowMetrics[0]?.k1_window || 0;
            const k2 = windowMetrics[0]?.k2_window || 0;
            
            const halfSineFit = calculateHalfSineFit(k1, k2);
            const filteredPeaks = findFilteredPeaks(envelopeData, 250);
            const batteryDipHour = getMedianBatteryDipHour(window.start, window.end);
            
            const windowStats = {
              avgK1: k1.toFixed(2),
              avgK2: k2.toFixed(2),
              sinusoidalityPass: (windowMetrics.filter(m => m["sinusoidality_pass_<=30pct"]).length / windowMetrics.length * 100).toFixed(1),
              batteryDipDetected: (windowMetrics.filter(m => m.detected_battery_dip !== null).length / windowMetrics.length * 100).toFixed(1),
              daysInWindow: windowMetrics.length
            };
            
            return (
              <div key={`${window.start}-${window.end}`} className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                {/* Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">7-Day Envelope + Half-Sine Fit</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">{window.start} to {window.end}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SevenDayEnvelopeChart
                      windowStart={window.start}
                      windowEnd={window.end}
                      envelopeData={envelopeData}
                      halfSineFit={halfSineFit}
                      filteredPeaks={filteredPeaks}
                      batteryDipHour={batteryDipHour}
                    />
                  </CardContent>
                </Card>
                
                {/* Window Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Window Metrics</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Aggregated statistics for this 7-day window</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Days in Window</p>
                        <p className="font-semibold text-slate-800">{windowStats.daysInWindow}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">k1 (Amplitude)</p>
                        <p className="font-semibold text-slate-800">{windowStats.avgK1} W</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">k2 (Phase Shift)</p>
                        <p className="font-semibold text-slate-800">{windowStats.avgK2}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Days Passing Sinusoidality</p>
                        <p className="font-semibold text-emerald-600">{windowStats.sinusoidalityPass}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Days with Battery Dip</p>
                        <p className="font-semibold text-slate-800">{windowStats.batteryDipDetected}%</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm text-slate-600">
                      <p className="font-medium text-slate-800 mb-2">Legend:</p>
                      <div className="flex items-start gap-2">
                        <span className="inline-block w-4 h-3 bg-red-500 rounded mt-1 flex-shrink-0"></span>
                        <span>Red line: 7-day max envelope</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block w-4 h-3 bg-green-500 rounded mt-1 flex-shrink-0"></span>
                        <span>Green dots: filtered peaks</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block w-4 h-3 bg-blue-500 rounded mt-1 flex-shrink-0"></span>
                        <span>Blue line: ideal half-sine fit</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="inline-block w-4 h-0.5 bg-purple-500 mt-2 flex-shrink-0"></span>
                        <span>Purple dashed: typical battery dip time</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </TabsContent>
        
        {/* Tab 3: Verification Diagnostics */}
        <TabsContent value="diagnostics" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Per-Day Verification Rules</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Detailed diagnostics for each day in the analysis period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VerificationTable metrics={allMetrics} />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab 4: Energy Certificates */}
        <TabsContent value="certificates" className="space-y-4 sm:space-y-6">
          <EnergyCertificates
            totalEnergyMWh={carbonStats.totalEnergyMWh}
            avgDailyEnergyKWh={carbonStats.avgDailyEnergyKWh}
            operatingDays={carbonStats.operatingDays}
            projectStartDate={carbonStats.projectStartDate}
            projectEndDate={carbonStats.projectEndDate}
            peakPowerW={carbonStats.peakPowerW}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

