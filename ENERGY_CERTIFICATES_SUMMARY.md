# Energy Certificates & Carbon Credits - Implementation Summary

## Overview

This document details the implementation of the **Energy Certificates** tab in the Inergy demo application, which calculates and displays carbon credit information based on the CDM AMS-I.F methodology for renewable electricity generation.

---

## 📊 What Was Added

### 1. New Energy Certificates Tab
- Added a 4th tab to the device details page titled "Energy Certificates"
- Displays comprehensive carbon credit calculations and methodology information
- Fully responsive design matching the existing UI

### 2. Carbon Credit Calculations
- Real-time emission reductions based on actual device telemetry
- Annual projections from current data
- 10-year crediting period forecasts
- Economic valuation of carbon credits

### 3. Interactive Visualizations
- Monthly emission reductions bar chart
- 10-year cumulative carbon credits area chart
- Key performance indicators displayed as cards

---

## 🧮 Calculation Methodology

### AMS-I.F Formula (Section 5.5)

The emission reduction calculation follows the official CDM methodology:

**ER_y = BE_y - PE_y - LE_y**

Where:
- **ER_y** = Emission reductions (tCO₂/year)
- **BE_y** = Baseline emissions (from diesel generation)
- **PE_y** = Project emissions (solar system)
- **LE_y** = Leakage emissions

### Baseline Emissions (BE_y)

**Formula:** BE_y = EGBL_y × EF_CO2,y

- **EGBL_y** = Net renewable electricity supplied (MWh/year)
  - Calculated from actual device power readings
  - Integrated over daylight hours using trapezoidal method
  
- **EF_CO2,y** = Baseline emission factor (tCO₂/MWh)
  - **Assumed Value: 0.8 tCO₂/MWh**
  - Based on typical diesel genset emissions
  - Reference: CDM Tool for baseline emissions calculation
  - Typical range for diesel generators: 0.7-0.9 tCO₂/MWh

**Justification:** This represents the emissions from a diesel generator that would have been used to provide the same amount of electricity in the absence of the solar system.

---

## 📐 Key Assumptions & Their Rationale

### 1. Baseline Emission Factor: 0.8 tCO₂/MWh

**Assumption:** The displaced energy source is a diesel genset with an emission factor of 0.8 tCO₂/MWh.

**Rationale:**
- Diesel gensets are the most common off-grid backup/primary power source
- Emission factors vary based on:
  - Generator efficiency (typically 25-35%)
  - Fuel quality
  - Operating load
  - Maintenance state
- Conservative estimate within the 0.7-0.9 tCO₂/MWh range
- Aligns with CDM default values for diesel displacement projects

**Source:** CDM Methodologies Database, AMS-I.F guidance documents

---

### 2. Project Emissions (PE_y): 0 tCO₂

**Assumption:** The solar + battery system produces zero greenhouse gas emissions during operation.

**Rationale:**
- Solar PV panels have no direct emissions during electricity generation
- Battery storage systems have no operational emissions
- No fossil fuel backup in the system
- Inergy's verification algorithms ensure battery is charged exclusively from solar
- Manufacturing and installation emissions are excluded per AMS-I.F methodology (only operational emissions count)

**Per AMS-I.F Section 5.3:** For solar PV with battery storage and no fossil backup → PE_y = 0

---

### 3. Leakage Emissions (LE_y): 0 tCO₂

**Assumption:** Leakage emissions are negligible for solar PV systems.

**Rationale:**
- Solar PV has minimal upstream emissions that would count as "leakage"
- No fuel transportation required
- No ongoing fuel supply chain
- Manufacturing emissions are not counted as leakage under CDM rules

**Per AMS-I.F Section 5.4:** Solar PV with battery storage has no significant leakage → LE_y = 0

---

### 4. Energy Generation Calculation

**Method:** Trapezoidal integration of power readings over time

**Assumptions:**
- Samples are timestamped and approximately evenly spaced (~5 minutes apart)
- Energy (Wh) = Σ(Average_Power_i × Time_Interval_i)
- Only daylight hours (6:00-18:00 local time) are counted for generation
- Gaps larger than 30 minutes between samples are not counted (to avoid overestimating during data gaps)

**Formula:**
```
Energy_Wh = Σ [(Power_i + Power_i+1) / 2] × ΔTime_hours
```

**Rationale:**
- Trapezoidal integration is a standard numerical method for calculating area under curves
- Provides accurate energy estimation from discrete power samples
- 30-minute gap threshold prevents counting overnight periods or data outages as generation

---

### 5. Annual Projections

**Assumption:** Current data period can be extrapolated to a full year.

**Method:**
```
Annual_Energy_MWh = (Average_Daily_Energy_kWh / 1000) × 365
```

**Important Notes:**
- Actual generation will vary with seasonal patterns
- Solar irradiance changes throughout the year
- Weather patterns affect daily generation
- This is a **simplified projection** for demonstration purposes
- Real carbon projects would use:
  - Multi-year historical data
  - Seasonal correction factors
  - Climate-adjusted averages

**Caveat Displayed in UI:** "Actual generation may vary with seasonal patterns and weather conditions"

---

### 6. Carbon Credit Pricing: $15/tCO₂

**Assumption:** Conservative voluntary carbon market price of $15 per tonne of CO₂.

**Rationale:**
- Based on 2024 voluntary carbon market averages
- Actual prices vary significantly:
  - Low quality credits: $5-10/tCO₂
  - Standard credits: $10-20/tCO₂
  - Premium credits with co-benefits: $20-40+/tCO₂
- Renewable energy credits typically trade in the mid-range
- Price depends on:
  - Project quality and verification standard
  - Co-benefits (sustainable development goals)
  - Vintage (year of emission reduction)
  - Market demand and supply
  - Registry and certification body

**Note in UI:** "Actual prices range $10-30/tCO₂ depending on project quality, co-benefits, vintage, and market conditions"

---

### 7. Crediting Period: 10 Years

**Assumption:** Standard 10-year crediting period with option to renew.

**Rationale:**
- CDM and VCS (Verified Carbon Standard) typically allow:
  - 10-year fixed crediting period, OR
  - 7-year renewable crediting period (up to 2 renewals = 21 years total), OR
  - Maximum 30 years total for renewable energy projects
- 10 years is a conservative standard assumption
- Allows for equipment degradation and efficiency loss over time

**Per AMS-I.F Guidance:** Crediting periods follow standard CDM rules

---

## 🔬 Technical Implementation Details

### Energy Calculation Algorithm

Located in `lib/load-data.ts`:

```typescript
export function calculateEnergyForDateRange(startDate: string, endDate: string): number {
  const samples = getDaylightHeartbeatForDateRange(startDate, endDate);
  
  // Sort samples by timestamp
  const sortedSamples = [...samples].sort((a, b) => {
    return new Date(a.heartbeat_ts).getTime() - new Date(b.heartbeat_ts).getTime();
  });
  
  let totalEnergyWh = 0;
  
  // Trapezoidal integration
  for (let i = 0; i < sortedSamples.length - 1; i++) {
    const current = sortedSamples[i];
    const next = sortedSamples[i + 1];
    
    // Calculate time difference in hours
    const deltaHours = (new Date(next.heartbeat_ts).getTime() - 
                        new Date(current.heartbeat_ts).getTime()) / (1000 * 60 * 60);
    
    // Only count if samples are within 30 minutes
    if (deltaHours <= 0.5) {
      const avgPower = (current.power_W_raw + next.power_W_raw) / 2;
      totalEnergyWh += avgPower * deltaHours;
    }
  }
  
  return totalEnergyWh;
}
```

**Key Features:**
- Handles irregular sample spacing
- Prevents counting data gaps as generation
- Accurate temporal integration
- Converts to standard units (Wh → kWh → MWh)

---

### Emission Reduction Calculation

Located in `components/energy-certificates.tsx`:

```typescript
// Constants (clearly defined at top of file)
const EMISSION_FACTOR_DIESEL = 0.8; // tCO₂/MWh
const PROJECT_EMISSIONS = 0;        // tCO₂/MWh (solar-only)
const LEAKAGE_EMISSIONS = 0;        // tCO₂ (negligible for solar)

// Baseline emissions
const baselineEmissions = totalEnergyMWh * EMISSION_FACTOR_DIESEL;

// Emission reductions (AMS-I.F formula)
const emissionReductions = baselineEmissions - PROJECT_EMISSIONS - LEAKAGE_EMISSIONS;

// Annual projection
const annualEnergyMWh = (avgDailyEnergyKWh / 1000) * 365;
const annualEmissionReductions = annualEnergyMWh * EMISSION_FACTOR_DIESEL;

// Economic value
const annualCarbonValue = annualEmissionReductions * CARBON_PRICE_USD;
```

---

## 📊 Data Flow

```
Raw Device Data (heartbeat.json)
    ↓
Filter Daylight Hours (6:00-18:00)
    ↓
Trapezoidal Integration
    ↓
Total Energy (MWh)
    ↓
Baseline Emissions = Energy × 0.8 tCO₂/MWh
    ↓
Emission Reductions = Baseline - 0 - 0
    ↓
Annual Projection = (Avg Daily × 365)
    ↓
Carbon Value = Reductions × $15/tCO₂
    ↓
Display in UI with Charts
```

---

## 🌍 Country-Level Carbon Project Innovation

### Key Concept

Instead of registering each solar-battery system as a separate carbon project, Inergy's approach enables:

1. **Single National Project Registration**
   - One carbon project registered at country/jurisdictional level
   - Covers all Inergy devices nationwide
   - Simplified methodology approval process

2. **Distributed Verification**
   - Each device is a verified sub-node
   - IoT telemetry provides real-time data
   - Tamper-proof logs via edge verification algorithms
   - Automated MRV (Monitoring, Reporting, Verification)

3. **Scalability**
   - Add thousands of devices without new methodology approvals
   - Aggregate emissions reductions across all devices
   - Single verification process for entire fleet
   - Lower cost per tonne of CO₂

4. **Digital MRV Backbone**
   - Continuous authenticated data streaming
   - Remote monitoring and verification
   - Reduces need for on-site audits
   - Enables near-real-time carbon credit issuance

---

## 🎯 Monitoring Requirements (AMS-I.F Section 6.1)

The methodology requires monitoring of:

| Parameter | Requirement | Inergy Implementation |
|-----------|-------------|----------------------|
| **Electricity Generated** | Must monitor solar PV generation | IoT telemetry streams power data in real-time over MQTT |
| **Emission Factor** | Baseline emission factor for displaced source | Standard 0.8 tCO₂/MWh for diesel (from CDM tools) |
| **No Fossil Fuel Use** | Confirm PE_y = 0 | Edge sensing + firmware lockout prevents non-renewable charging |
| **Battery Charge Source** | Prove solar-only charging | Verified via Inergy's proprietary source-verification algorithms |

**Inergy's Advantage:** Automated, continuous monitoring exceeds CDM requirements, reducing verification costs and enabling scalable credit issuance.

---

## 📈 Example Calculations (Based on Demo Data)

### Sample Results (Actual values will vary based on device data):

**Operating Period:** May 14, 2025 - July 5, 2025 (43 days)

**Calculated Values:**
- **Total Energy Generated:** ~0.150 MWh (example)
- **Average Daily Energy:** ~3.5 kWh/day
- **Peak Power:** ~333 W
- **Current Period Reductions:** ~0.120 tCO₂
- **Annual Projection:** ~1.28 MWh/year → ~1.02 tCO₂/year
- **10-Year Credits:** ~10.2 tCO₂ → ~$153 value @ $15/tCO₂

*(Note: These are illustrative examples. Actual values are calculated from real device data in the app.)*

---

## ✅ Validation & Quality Checks

### Code Quality
- ✅ TypeScript compilation with no errors
- ✅ Next.js build successful
- ✅ All calculations use proper units and conversions
- ✅ Responsive design for mobile and desktop

### Calculation Accuracy
- ✅ Trapezoidal integration correctly implemented
- ✅ Unit conversions verified (Wh → kWh → MWh)
- ✅ Time calculations account for UTC/local time offsets
- ✅ Gap detection prevents overestimation

### Methodology Compliance
- ✅ Follows AMS-I.F Section 5 calculation formulas
- ✅ Monitoring requirements per Section 6.1
- ✅ Applicability conditions met (off-grid, renewable, captive use)
- ✅ Proper treatment of battery storage per methodology

---

## 📚 References

1. **CDM AMS-I.F Methodology (v05.0)**
   - "Renewable electricity generation for captive use and mini-grid"
   - Official PDF: https://cdm.unfccc.int/methodologies/DB/B0ZMK7BSJQ4LTCRJQQ4YV9F4R5U8B0

2. **CDM Tool for Baseline Emissions**
   - Used for diesel genset emission factors

3. **Voluntary Carbon Market Reports (2024)**
   - Carbon pricing data and trends

4. **IPCC Emission Factors Database**
   - Reference for fossil fuel emission factors

---

## 🔮 Future Enhancements

### Potential Improvements:
1. **Seasonal Adjustment Factors**
   - Account for solar irradiance variation throughout the year
   - Use TMY (Typical Meteorological Year) data

2. **Location-Specific Baselines**
   - Use country/region-specific grid emission factors
   - Account for local diesel fuel characteristics

3. **Co-Benefits Tracking**
   - SDG (Sustainable Development Goal) alignment
   - Air quality improvements
   - Energy access metrics

4. **Real-Time Credit Issuance**
   - Integration with carbon registries (Verra, Gold Standard)
   - Automated verification workflows
   - Near-real-time credit minting

5. **Uncertainty Analysis**
   - Monte Carlo simulation for projection ranges
   - Confidence intervals on estimates
   - Sensitivity analysis for key parameters

---

## 📝 Summary of Assumptions

| Parameter | Value | Rationale | Conservative? |
|-----------|-------|-----------|---------------|
| Diesel Emission Factor | 0.8 tCO₂/MWh | CDM Tool standard value | Yes (mid-range) |
| Project Emissions | 0 tCO₂ | Solar-only system | Yes (zero emissions) |
| Leakage Emissions | 0 tCO₂ | Per AMS-I.F guidance | Yes (negligible) |
| Carbon Price | $15/tCO₂ | 2024 market average | Yes (conservative) |
| Crediting Period | 10 years | Standard CDM period | Yes (renewable up to 30 years) |
| Annual Projection | Simple extrapolation | Based on available data | Moderate (no seasonal adjustment) |
| Sample Spacing | ~5 minutes | From actual data | N/A (data-driven) |
| Gap Threshold | 30 minutes | Prevents overestimation | Yes (conservative) |

**Overall Approach:** Conservative estimates to provide credible, defensible carbon credit calculations.

---

## 🛠️ Files Modified/Created

### New Files:
1. `components/energy-certificates.tsx` - Main Energy Certificates component
2. `ENERGY_CERTIFICATES_SUMMARY.md` - This documentation file

### Modified Files:
1. `lib/load-data.ts` - Added energy calculation functions
2. `app/devices/[id]/page.tsx` - Added 4th tab and integrated component

### Functions Added to `lib/load-data.ts`:
- `calculateEnergyForDateRange()` - Trapezoidal integration
- `getTotalEnergyMWh()` - Total energy across all data
- `getAverageDailyEnergyKWh()` - Daily average calculation
- `getPeakPowerW()` - Maximum power across all days
- `getOperatingDays()` - Count of days with data
- `getCarbonCreditStats()` - Aggregated statistics for UI

---

## 👨‍💻 Usage

1. **Navigate to Device Details:**
   - Go to `/devices/8` (or any device ID)

2. **Click on "Energy Certificates" Tab:**
   - 4th tab in the device details view
   - Mobile displays as "Credits"

3. **View Information:**
   - Key metrics cards at top
   - AMS-I.F methodology overview
   - Interactive charts for projections
   - Detailed calculations and assumptions
   - Country-level project innovation details
   - Digital MRV monitoring information

---

## ⚖️ Disclaimers

1. **Projections are Estimates:** Annual and 10-year projections are based on available data and may not reflect actual future generation due to seasonal variations, weather patterns, equipment degradation, and other factors.

2. **Carbon Price Volatility:** Carbon credit prices fluctuate based on market conditions. The $15/tCO₂ estimate is for illustrative purposes only.

3. **Methodology Approval Required:** Actual carbon credit issuance requires formal project registration, validation, and verification by approved third parties under recognized standards (CDM, VCS, Gold Standard, etc.).

4. **Not Financial Advice:** The economic valuations provided are for informational and demonstration purposes only and should not be considered financial advice or guarantees of future revenue.

5. **Assumptions May Vary:** Baseline emission factors, crediting periods, and other parameters may differ based on project location, local regulations, and chosen carbon standard.

---

## 📞 Technical Support

For questions about:
- **Methodology:** Refer to CDM AMS-I.F official documentation
- **Implementation:** Review code in `components/energy-certificates.tsx` and `lib/load-data.ts`
- **Assumptions:** See this document's "Key Assumptions" section
- **Calculations:** Review the "Calculation Methodology" section

---

**Document Version:** 1.0  
**Last Updated:** December 10, 2025  
**Author:** Inergy Development Team  
**Methodology Reference:** CDM AMS-I.F v05.0
