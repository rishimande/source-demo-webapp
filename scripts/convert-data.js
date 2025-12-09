const fs = require('fs');
const path = require('path');

// Configuration
const LOCAL_TIME_OFFSET = -6;

// Parse CSV to array of objects
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }
  
  return data;
}

// Parse a CSV line handling quoted values
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values;
}

// Convert heartbeat data
function convertHeartbeatData() {
  console.log('📊 Converting heartbeat data...');
  
  const csvPath = path.join(__dirname, '../data/bquxjob_22a0183e_197ec64eb48.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rawData = parseCSV(csvContent);
  
  const heartbeatSamples = rawData.map(row => {
    // Parse timestamp
    const timestampStr = row.heartbeat_ts.replace(' UTC', '');
    const timestamp = new Date(timestampStr + 'Z'); // Add Z for UTC
    
    // Calculate derived fields
    const mv_in = parseFloat(row.mv_in);
    const ma_in = parseFloat(row.ma_in);
    const voltage = mv_in / 1000;
    const current = ma_in / 1000;
    const power_W_raw = voltage * current;
    
    // Calculate local hour
    const utcHour = timestamp.getUTCHours();
    const utcMinute = timestamp.getUTCMinutes();
    const utcSecond = timestamp.getUTCSeconds();
    const local_hour = (utcHour + utcMinute / 60 + utcSecond / 3600 + LOCAL_TIME_OFFSET + 24) % 24;
    
    // Extract date (YYYY-MM-DD)
    const year = timestamp.getUTCFullYear();
    const month = String(timestamp.getUTCMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getUTCDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    
    return {
      heartbeat_ts: row.heartbeat_ts,
      mv_in,
      ma_in,
      voltage,
      current,
      power_W_raw,
      local_hour,
      date
    };
  });
  
  // Write to JSON
  const outputPath = path.join(__dirname, '../data/heartbeat.json');
  fs.writeFileSync(outputPath, JSON.stringify(heartbeatSamples, null, 2));
  console.log(`✅ Converted ${heartbeatSamples.length} heartbeat samples to ${outputPath}`);
}

// Convert daily metrics data
function convertDailyMetrics() {
  console.log('📊 Converting daily metrics...');
  
  const csvPath = path.join(__dirname, '../data/daily_metrics.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rawData = parseCSV(csvContent);
  
  const dailyMetrics = rawData.map(row => {
    const parseFloatOrNull = (val) => {
      if (!val || val === '' || val === 'nan' || val === 'NaN') return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };
    
    const parseBool = (val) => {
      if (val === 'True' || val === 'true' || val === '1') return true;
      if (val === 'False' || val === 'false' || val === '0') return false;
      return false;
    };
    
    const parseStringOrNull = (val) => {
      if (!val || val === '' || val === 'nan' || val === 'NaN') return null;
      return val;
    };
    
    return {
      date: row.date,
      window_start: row.window_start,
      window_end: row.window_end,
      k1_window: parseFloatOrNull(row.k1_window),
      k2_window: parseFloatOrNull(row.k2_window),
      detected_battery_dip: parseStringOrNull(row.detected_battery_dip),
      sinusoidality_nrmse: parseFloatOrNull(row.sinusoidality_nrmse),
      "sinusoidality_pass_<=30pct": parseBool(row["sinusoidality_pass_<=30pct"]),
      frac_points_obs_gt_model_plus_5pct: parseFloatOrNull(row.frac_points_obs_gt_model_plus_5pct),
      "negative_noise_pass_<=5pct_violations": parseBool(row["negative_noise_pass_<=5pct_violations"]),
      fraction_low_power_outside_daylight: parseFloatOrNull(row.fraction_low_power_outside_daylight),
      "no_generation_outside_daylight_pass_>=95pct": parseBool(row["no_generation_outside_daylight_pass_>=95pct"]),
      lambda_day: parseFloatOrNull(row.lambda_day)
    };
  });
  
  // Write to JSON
  const outputPath = path.join(__dirname, '../data/daily_metrics.json');
  fs.writeFileSync(outputPath, JSON.stringify(dailyMetrics, null, 2));
  console.log(`✅ Converted ${dailyMetrics.length} daily metrics to ${outputPath}`);
}

// Main execution
try {
  convertHeartbeatData();
  convertDailyMetrics();
  console.log('🎉 Data conversion complete!');
} catch (error) {
  console.error('❌ Error during conversion:', error);
  process.exit(1);
}

