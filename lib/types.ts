// Heartbeat sample (from bquxjob...csv)
export interface HeartbeatSample {
  heartbeat_ts: string;      // original timestamp string like "2025-05-14 12:15:00 UTC"
  mv_in: number;
  ma_in: number;
  // derived fields
  voltage: number;           // mv_in / 1000
  current: number;           // ma_in / 1000
  power_W_raw: number;       // voltage * current
  local_hour: number;        // (UTC hour + offset) % 24
  date: string;              // YYYY-MM-DD
}

// Daily metrics row (from daily_metrics.csv)
export interface DailyMetric {
  date: string;                                     // "2025-05-14"
  window_start: string;                             // "2025-05-14"
  window_end: string;                               // "2025-05-22"
  k1_window: number;
  k2_window: number;
  detected_battery_dip: string | null;              // timestamp string or null/empty
  sinusoidality_nrmse: number | null;
  "sinusoidality_pass_<=30pct": boolean;
  frac_points_obs_gt_model_plus_5pct: number | null;
  "negative_noise_pass_<=5pct_violations": boolean;
  fraction_low_power_outside_daylight: number | null;
  "no_generation_outside_daylight_pass_>=95pct": boolean;
  lambda_day: number | null;
}

export const DEVICE_ID = "demo-device-001";
export const DEVICE_NAME = "Inergy Demo Device #1";
export const LOCAL_TIME_OFFSET = -6; // UTC offset for local time

