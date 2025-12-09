import { HeartbeatSample, DailyMetric } from './types';
import heartbeatData from '@/data/heartbeat.json';
import dailyMetricsData from '@/data/daily_metrics.json';

export function getHeartbeatSamples(): HeartbeatSample[] {
  return heartbeatData as HeartbeatSample[];
}

export function getDailyMetrics(): DailyMetric[] {
  return dailyMetricsData as DailyMetric[];
}

// Get heartbeat samples for a specific date
export function getHeartbeatForDate(date: string): HeartbeatSample[] {
  const allSamples = getHeartbeatSamples();
  return allSamples.filter(sample => sample.date === date);
}

// Get heartbeat samples for a date within daylight hours (6-18)
export function getDaylightHeartbeatForDate(date: string): HeartbeatSample[] {
  const samples = getHeartbeatForDate(date);
  return samples.filter(sample => sample.local_hour >= 6 && sample.local_hour <= 18);
}

// Get all unique dates from heartbeat data
export function getAllDates(): string[] {
  const allSamples = getHeartbeatSamples();
  const dates = new Set(allSamples.map(s => s.date));
  return Array.from(dates).sort();
}

// Get daily metric for a specific date
export function getDailyMetricForDate(date: string): DailyMetric | undefined {
  const metrics = getDailyMetrics();
  return metrics.find(m => m.date === date);
}

// Calculate verification status based on all daily metrics
export function getVerificationStatus(): 'verified' | 'needs-review' {
  const metrics = getDailyMetrics();
  
  // Check if all days pass all three main criteria
  const allPass = metrics.every(m => 
    m["sinusoidality_pass_<=30pct"] &&
    m["negative_noise_pass_<=5pct_violations"] &&
    m["no_generation_outside_daylight_pass_>=95pct"]
  );
  
  return allPass ? 'verified' : 'needs-review';
}

// Get percentage of days passing each criterion
export function getVerificationStats() {
  const metrics = getDailyMetrics();
  const total = metrics.length;
  
  if (total === 0) {
    return {
      sinusoidalityPass: 0,
      negativeNoisePass: 0,
      noGenerationPass: 0,
      batteryDipDetected: 0
    };
  }
  
  const sinusoidalityPass = metrics.filter(m => m["sinusoidality_pass_<=30pct"]).length / total * 100;
  const negativeNoisePass = metrics.filter(m => m["negative_noise_pass_<=5pct_violations"]).length / total * 100;
  const noGenerationPass = metrics.filter(m => m["no_generation_outside_daylight_pass_>=95pct"]).length / total * 100;
  const batteryDipDetected = metrics.filter(m => m.detected_battery_dip !== null).length / total * 100;
  
  return {
    sinusoidalityPass,
    negativeNoisePass,
    noGenerationPass,
    batteryDipDetected
  };
}

// Get the latest heartbeat timestamp
export function getLatestHeartbeat(): string {
  const samples = getHeartbeatSamples();
  if (samples.length === 0) return '';
  
  // Find the max timestamp
  const latest = samples.reduce((max, sample) => {
    return sample.heartbeat_ts > max ? sample.heartbeat_ts : max;
  }, samples[0].heartbeat_ts);
  
  return latest;
}

// Calculate average daily peak power
export function getAverageDailyPeakPower(): number {
  const dates = getAllDates();
  const peaks: number[] = [];
  
  dates.forEach(date => {
    const samples = getDaylightHeartbeatForDate(date);
    if (samples.length > 0) {
      const maxPower = Math.max(...samples.map(s => s.power_W_raw));
      peaks.push(maxPower);
    }
  });
  
  if (peaks.length === 0) return 0;
  return peaks.reduce((sum, p) => sum + p, 0) / peaks.length;
}

// Get data period range
export function getDataPeriodRange(): { min: string; max: string } {
  const dates = getAllDates();
  return {
    min: dates[0] || '',
    max: dates[dates.length - 1] || ''
  };
}

// Get all unique 7-day windows
export function getSevenDayWindows(): Array<{ start: string; end: string }> {
  const metrics = getDailyMetrics();
  const windowsSet = new Set<string>();
  
  metrics.forEach(m => {
    windowsSet.add(`${m.window_start}|${m.window_end}`);
  });
  
  return Array.from(windowsSet)
    .map(w => {
      const [start, end] = w.split('|');
      return { start, end };
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

// Get heartbeat samples for a date range
export function getHeartbeatForDateRange(startDate: string, endDate: string): HeartbeatSample[] {
  const allSamples = getHeartbeatSamples();
  return allSamples.filter(sample => 
    sample.date >= startDate && sample.date <= endDate
  );
}

// Get daylight heartbeat samples for a date range
export function getDaylightHeartbeatForDateRange(startDate: string, endDate: string): HeartbeatSample[] {
  const samples = getHeartbeatForDateRange(startDate, endDate);
  return samples.filter(sample => sample.local_hour >= 6 && sample.local_hour <= 18);
}

// Get daily metrics for a specific window
export function getMetricsForWindow(windowStart: string, windowEnd: string): DailyMetric[] {
  const metrics = getDailyMetrics();
  return metrics.filter(m => m.window_start === windowStart && m.window_end === windowEnd);
}

// Calculate 7-day max envelope (max power at each hour across the window)
export function calculateSevenDayEnvelope(startDate: string, endDate: string) {
  const samples = getDaylightHeartbeatForDateRange(startDate, endDate);
  
  // Group by hour bins (0.1 hour resolution for smoothness)
  const hourBins = new Map<number, number>();
  
  samples.forEach(sample => {
    const hourBin = Math.round(sample.local_hour * 10) / 10; // Round to 0.1 hour
    const currentMax = hourBins.get(hourBin) || 0;
    hourBins.set(hourBin, Math.max(currentMax, sample.power_W_raw));
  });
  
  // Convert to sorted array
  return Array.from(hourBins.entries())
    .map(([hour, power]) => ({ hour, power }))
    .sort((a, b) => a.hour - b.hour);
}

// Calculate half-sine fit curve
export function calculateHalfSineFit(k1: number, k2: number, startHour: number = 6, endHour: number = 18) {
  const points: Array<{ hour: number; power: number }> = [];
  
  for (let hour = startHour; hour <= endHour; hour += 0.1) {
    // Half-sine formula: k1 * sin((hour - 6 - k2) * π / 12)
    // This makes the sine wave start at (6 + k2), peak at (6 + k2 + 6)
    // k2 is the phase shift that delays the curve
    // Clamped to 0 if negative
    const power = Math.max(0, k1 * Math.sin((hour - 6 - k2) * Math.PI / 12));
    points.push({ hour: Math.round(hour * 10) / 10, power });
  }
  
  return points;
}

// Find filtered peaks (local maxima above threshold)
export function findFilteredPeaks(envelopeData: Array<{ hour: number; power: number }>, threshold: number = 250) {
  const peaks: Array<{ hour: number; power: number }> = [];
  
  for (let i = 1; i < envelopeData.length - 1; i++) {
    const prev = envelopeData[i - 1];
    const curr = envelopeData[i];
    const next = envelopeData[i + 1];
    
    // Check if it's a local maximum and above threshold
    if (curr.power > prev.power && curr.power > next.power && curr.power >= threshold) {
      peaks.push(curr);
    }
  }
  
  return peaks;
}

// Calculate median battery dip time for a window
export function getMedianBatteryDipHour(windowStart: string, windowEnd: string): number | null {
  const metrics = getMetricsForWindow(windowStart, windowEnd);
  const dipsWithTime = metrics.filter(m => m.detected_battery_dip !== null);
  
  if (dipsWithTime.length === 0) return null;
  
  const dipHours = dipsWithTime.map(m => {
    const date = new Date(m.detected_battery_dip!);
    const utcHour = date.getUTCHours();
    const utcMinute = date.getUTCMinutes();
    const LOCAL_TIME_OFFSET = -6;
    return (utcHour + utcMinute / 60 + LOCAL_TIME_OFFSET + 24) % 24;
  }).sort((a, b) => a - b);
  
  return dipHours[Math.floor(dipHours.length / 2)];
}

