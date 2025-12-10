"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { FileCheck, Leaf, TrendingUp, Globe, Shield, Zap } from 'lucide-react';

interface EnergyCertificatesProps {
  totalEnergyMWh: number;
  avgDailyEnergyKWh: number;
  operatingDays: number;
  projectStartDate: string;
  projectEndDate: string;
  peakPowerW: number;
}

/**
 * ASSUMPTIONS FOR CARBON CREDIT CALCULATIONS:
 * 
 * 1. Baseline Emission Factor (EF_CO2,y):
 *    - 0.8 tCO₂/MWh for diesel genset displacement
 *    - Based on CDM Tool to calculate baseline emissions (Diesel generators typically 0.7-0.9 tCO₂/MWh)
 *    - Reference: CDM methodologies for off-grid diesel displacement
 * 
 * 2. Project Emissions (PE_y):
 *    - 0 tCO₂ (solar + battery system with no fossil fuel backup)
 *    - Battery charged exclusively from solar PV (verified by Inergy's edge algorithms)
 * 
 * 3. Leakage Emissions (LE_y):
 *    - 0 tCO₂ (solar PV systems have negligible leakage per AMS-I.F Section 5.4)
 * 
 * 4. Energy Generation:
 *    - Calculated from real device telemetry data
 *    - Integration of power readings over daylight hours
 *    - Assumption: 1 sample every ~5 minutes during daylight hours (6:00-18:00)
 * 
 * 5. Carbon Credit Pricing:
 *    - Conservative estimate: $15/tCO₂ (voluntary carbon market average 2024)
 *    - Range typically $10-30/tCO₂ depending on project quality and vintage
 * 
 * 6. Project Crediting Period:
 *    - Standard 10-year crediting period for CDM/VCS projects
 *    - Renewable twice for a maximum of 30 years
 */

const EMISSION_FACTOR_DIESEL = 0.8; // tCO₂/MWh
const PROJECT_EMISSIONS = 0; // tCO₂/MWh (solar-only)
const LEAKAGE_EMISSIONS = 0; // tCO₂ (negligible for solar)
const CARBON_PRICE_USD = 15; // USD per tCO₂
const CREDITING_PERIOD_YEARS = 10;

export function EnergyCertificates({
  totalEnergyMWh,
  avgDailyEnergyKWh,
  operatingDays,
  projectStartDate,
  projectEndDate,
  peakPowerW
}: EnergyCertificatesProps) {
  
  // Calculate emission reductions per AMS-I.F methodology
  // ER_y = BE_y - PE_y - LE_y
  // BE_y = EGBL_y × EF_CO2,y
  
  const baselineEmissions = totalEnergyMWh * EMISSION_FACTOR_DIESEL; // tCO₂
  const emissionReductions = baselineEmissions - PROJECT_EMISSIONS - LEAKAGE_EMISSIONS; // tCO₂
  
  // Projected annual values (extrapolate from current data period)
  const daysInYear = 365;
  const annualEnergyMWh = (avgDailyEnergyKWh / 1000) * daysInYear;
  const annualEmissionReductions = annualEnergyMWh * EMISSION_FACTOR_DIESEL; // tCO₂/year
  const annualCarbonValue = annualEmissionReductions * CARBON_PRICE_USD; // USD/year
  
  // 10-year crediting period projections
  const creditingPeriodEmissions = annualEmissionReductions * CREDITING_PERIOD_YEARS;
  const creditingPeriodValue = creditingPeriodEmissions * CARBON_PRICE_USD;
  
  // Monthly projection for chart
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    emissions: (annualEmissionReductions / 12).toFixed(3),
    value: (annualCarbonValue / 12).toFixed(2),
    energy: (annualEnergyMWh / 12).toFixed(3)
  }));
  
  // 10-year projection for chart
  const yearlyData = Array.from({ length: 10 }, (_, i) => ({
    year: `Year ${i + 1}`,
    cumulativeEmissions: (annualEmissionReductions * (i + 1)).toFixed(2),
    cumulativeValue: (annualCarbonValue * (i + 1)).toFixed(0)
  }));
  
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Leaf className="h-6 w-6 text-emerald-600" />
                Energy Certificates & Carbon Credits
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Verified emission reductions using CDM AMS-I.F methodology
              </CardDescription>
            </div>
            <Badge variant="success" className="text-sm px-3 py-1">
              <FileCheck className="h-4 w-4 mr-1" />
              CDM Eligible
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Globe className="h-4 w-4" />
            <span className="font-medium">Country-Level Carbon Project</span>
            <span>•</span>
            <span>Scalable DMRV Architecture</span>
            <span>•</span>
            <span>AMS-I.F v05.0</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Current Period Reductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {emissionReductions.toFixed(3)}
            </div>
            <p className="text-xs text-slate-500 mt-1">tCO₂ avoided ({operatingDays} days)</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Annual Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {annualEmissionReductions.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">tCO₂/year</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">10-Year Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800">
              {creditingPeriodEmissions.toFixed(1)}
            </div>
            <p className="text-xs text-slate-500 mt-1">tCO₂ total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Estimated Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${creditingPeriodValue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">@ ${CARBON_PRICE_USD}/tCO₂ (10 years)</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Methodology Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-sky-600" />
            AMS-I.F Methodology Overview
          </CardTitle>
          <CardDescription>
            CDM small-scale methodology: "Renewable electricity generation for captive use and mini-grid"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Applicability</h4>
              <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>Off-grid renewable electricity system for captive use</li>
                <li>Displaces fossil fuel-based captive power (diesel gensets)</li>
                <li>Battery storage charged exclusively from renewable source</li>
                <li>Verified by Inergy's edge sensing and source-verification algorithms</li>
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-slate-800 mb-2">Calculation Formula (Section 5.5)</h4>
              <div className="bg-white rounded border border-slate-200 p-3 font-mono text-sm">
                <div className="text-center mb-2 font-semibold">ER<sub>y</sub> = BE<sub>y</sub> - PE<sub>y</sub> - LE<sub>y</sub></div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>Where BE<sub>y</sub> = EGBL<sub>y</sub> × EF<sub>CO₂,y</sub></div>
                  <div className="ml-4">• EGBL<sub>y</sub> = Net renewable electricity supplied (MWh/year)</div>
                  <div className="ml-4">• EF<sub>CO₂,y</sub> = Baseline emission factor (tCO₂/MWh)</div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-800 mb-1">Baseline Emissions (BE<sub>y</sub>)</p>
                <p className="text-slate-600">Diesel generation: <span className="font-mono font-semibold text-slate-800">{baselineEmissions.toFixed(3)} tCO₂</span></p>
                <p className="text-xs text-slate-500 mt-1">@ {EMISSION_FACTOR_DIESEL} tCO₂/MWh</p>
              </div>
              
              <div>
                <p className="font-semibold text-slate-800 mb-1">Project Emissions (PE<sub>y</sub>)</p>
                <p className="text-slate-600">Solar + Battery: <span className="font-mono font-semibold text-emerald-600">0 tCO₂</span></p>
                <p className="text-xs text-slate-500 mt-1">No fossil backup</p>
              </div>
              
              <div>
                <p className="font-semibold text-slate-800 mb-1">Leakage (LE<sub>y</sub>)</p>
                <p className="text-slate-600">Solar PV: <span className="font-mono font-semibold text-emerald-600">0 tCO₂</span></p>
                <p className="text-xs text-slate-500 mt-1">Negligible per AMS-I.F</p>
              </div>
            </div>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-emerald-900 mb-1">Role of Inergy Battery Storage</h4>
                <p className="text-sm text-emerald-800">
                  Batteries enable 24×7 renewable operation, ensuring complete diesel displacement even during non-daylight hours. 
                  Inergy's edge verification stack ensures battery charging events are solar-only, making all displaced energy fully creditable 
                  under AMS-I.F methodology.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Emission Reductions Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Emission Reductions (Projected)</CardTitle>
            <CardDescription>Based on current generation patterns extrapolated annually</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  label={{ value: 'tCO₂', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'emissions') return [value + ' tCO₂', 'Emission Reductions'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="emissions" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Avg: {(annualEmissionReductions / 12).toFixed(3)} tCO₂/month | {avgDailyEnergyKWh.toFixed(2)} kWh/day
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">10-Year Cumulative Carbon Credits</CardTitle>
            <CardDescription>Standard CDM/VCS crediting period projection</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  label={{ value: 'tCO₂', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'cumulativeEmissions') return [value + ' tCO₂', 'Cumulative Credits'];
                    return [value, name];
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulativeEmissions" 
                  stroke="#0ea5e9" 
                  fill="#bae6fd" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Total: {creditingPeriodEmissions.toFixed(1)} tCO₂ over 10 years
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Project Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Country-Level Carbon Project Innovation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Inergy's approach enables a <span className="font-semibold text-slate-800">single carbon project registered at the national level</span>, 
              under which thousands of distributed solar-battery systems can be continuously tracked and credited.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-blue-900 text-sm">Key Benefits:</h4>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>No need to register hundreds of micro-projects individually</li>
                <li>All IoT-connected devices aggregate under one umbrella project</li>
                <li>Scalable credit issuance from distributed renewable assets nationwide</li>
                <li>Simplified verification through Inergy's DMRV stack</li>
                <li>Each device acts as a verifiable sub-node with tamper-proof logs</li>
              </ul>
            </div>
            
            <Separator />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Project Type:</span>
                <span className="font-medium">Off-grid renewable captive power</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Methodology:</span>
                <span className="font-medium">AMS-I.F v05.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">System Capacity:</span>
                <span className="font-medium">{peakPowerW.toFixed(0)} W peak</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Data Period:</span>
                <span className="font-medium">{projectStartDate} to {projectEndDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Digital MRV & Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Per <span className="font-semibold">AMS-I.F Section 6.1</span>, projects must monitor electricity generation, emission factors, 
              and ensure no fossil fuel use onsite. Inergy exceeds these requirements with automated digital monitoring.
            </p>
            
            <div className="space-y-3">
              <div className="border-l-4 border-emerald-500 pl-3 py-1">
                <p className="text-sm font-semibold text-slate-800">✓ Electricity Generated</p>
                <p className="text-xs text-slate-600">Real-time IoT telemetry via MQTT from smart meters</p>
              </div>
              
              <div className="border-l-4 border-emerald-500 pl-3 py-1">
                <p className="text-sm font-semibold text-slate-800">✓ Emission Factor</p>
                <p className="text-xs text-slate-600">Standard baseline: {EMISSION_FACTOR_DIESEL} tCO₂/MWh (diesel displacement)</p>
              </div>
              
              <div className="border-l-4 border-emerald-500 pl-3 py-1">
                <p className="text-sm font-semibold text-slate-800">✓ No Fossil Fuel Use</p>
                <p className="text-xs text-slate-600">Edge sensing + firmware lockout for non-renewable charging</p>
              </div>
              
              <div className="border-l-4 border-emerald-500 pl-3 py-1">
                <p className="text-sm font-semibold text-slate-800">✓ Battery Charge Source</p>
                <p className="text-xs text-slate-600">Verified solar-only via proprietary source-verification algorithms</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-900">
                <span className="font-semibold">Scalable DMRV Backbone:</span> Every Inergy device continuously reports authenticated 
                energy data, enabling low-cost, high-scale credit issuance for distributed renewable energy across thousands of sites 
                under a single national carbon project.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Assumptions & Notes */}
      <Card className="border-slate-300">
        <CardHeader>
          <CardTitle className="text-base">Calculation Assumptions & Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">1. Baseline Emission Factor:</span> {EMISSION_FACTOR_DIESEL} tCO₂/MWh 
              based on typical diesel genset emissions. CDM Tool reference for diesel generators typically shows 0.7-0.9 tCO₂/MWh 
              depending on fuel quality and generator efficiency.
            </div>
            
            <div>
              <span className="font-semibold text-slate-800">2. Energy Generation:</span> Calculated from actual device telemetry 
              by integrating power readings over daylight hours. Assumes sampling every ~5 minutes during generation period (6:00-18:00 local time).
            </div>
            
            <div>
              <span className="font-semibold text-slate-800">3. Annual Projections:</span> Extrapolated from current data period 
              ({operatingDays} days) to 365-day annual basis. Actual generation may vary with seasonal patterns and weather conditions.
            </div>
            
            <div>
              <span className="font-semibold text-slate-800">4. Carbon Credit Pricing:</span> Conservative estimate of ${CARBON_PRICE_USD}/tCO₂ 
              based on 2024 voluntary carbon market averages. Actual prices range $10-30/tCO₂ depending on project quality, 
              co-benefits, vintage, and market conditions.
            </div>
            
            <div>
              <span className="font-semibold text-slate-800">5. Crediting Period:</span> Standard 10-year period shown. 
              CDM/VCS projects can typically renew the crediting period twice for a maximum of 30 years total.
            </div>
            
            <div>
              <span className="font-semibold text-slate-800">6. Project vs Leakage Emissions:</span> Both set to zero per AMS-I.F 
              guidance for solar PV with battery storage. No fossil fuel backup and negligible upstream emissions for solar systems.
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Official Reference */}
      <Card className="bg-slate-50 border-slate-300">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileCheck className="h-5 w-5 text-slate-600 mt-0.5" />
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Official Methodology Reference:</span> CDM AMS-I.F (v05.0) – 
              "Renewable electricity generation for captive use and mini-grid" | 
              <a 
                href="https://cdm.unfccc.int/methodologies/DB/B0ZMK7BSJQ4LTCRJQQ4YV9F4R5U8B0" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sky-600 hover:text-sky-700 underline ml-1"
              >
                View Official PDF (UNFCCC)
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
