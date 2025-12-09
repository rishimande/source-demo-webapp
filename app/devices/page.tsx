import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  getLatestHeartbeat, 
  getAverageDailyPeakPower, 
  getAllDates, 
  getVerificationStatus 
} from '@/lib/load-data';
import { DEVICE_ID, DEVICE_NAME } from '@/lib/types';
import { format, parseISO } from 'date-fns';

export default function DevicesPage() {
  const latestHeartbeat = getLatestHeartbeat();
  const avgPeakPower = getAverageDailyPeakPower();
  const allDates = getAllDates();
  const verificationStatus = getVerificationStatus();
  
  // Format the latest heartbeat timestamp
  let formattedLastSeen = 'N/A';
  if (latestHeartbeat) {
    try {
      // Parse the timestamp (e.g., "2025-05-22 17:59:00 UTC")
      const cleanedTimestamp = latestHeartbeat.replace(' UTC', '');
      const date = parseISO(cleanedTimestamp + 'Z');
      formattedLastSeen = format(date, 'dd MMM yyyy, HH:mm');
    } catch (e) {
      formattedLastSeen = latestHeartbeat;
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Devices</h1>
        <p className="text-slate-500 mt-1">Monitor and verify energy generation devices</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{DEVICE_NAME}</CardTitle>
                <CardDescription className="mt-1">ID: {DEVICE_ID}</CardDescription>
              </div>
              {verificationStatus === 'verified' ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <Badge variant="warning">Needs Review</Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Last Seen</p>
                <p className="font-medium text-slate-800">{formattedLastSeen}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 mb-1">Avg Peak Power</p>
                <p className="font-medium text-slate-800">{avgPeakPower.toFixed(1)} W</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 mb-1">Days Analyzed</p>
                <p className="font-medium text-slate-800">{allDates.length}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span className="text-sm font-medium text-emerald-700">Online</span>
                </div>
              </div>
            </div>
            
            <Link
              href={`/devices/${DEVICE_ID}`}
              className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors w-full"
            >
              View Details
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

