import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import MetricCard from "@/components/metric-card";
import StatusCalendar from "@/components/status-calendar";
import UptimeResourceChart from "@/components/charts/uptime-resource-chart";
import IncidentsRecoveryChart from "@/components/charts/incidents-recovery-chart";
import BookingTable from "@/components/booking-table";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<string>("30");
  
  // Calculate date ranges based on selection
  const today = new Date();
  let startDate: Date;
  let endDate: Date = today;

  switch (dateRange) {
    case "60":
      startDate = subMonths(today, 2);
      break;
    case "90":
      startDate = subMonths(today, 3);
      break;
    default:
      startDate = subMonths(today, 1);
  }

  // Format dates for API queries
  const formattedStartDate = format(startDate, "yyyy-MM-dd");
  const formattedEndDate = format(endDate, "yyyy-MM-dd");

  // Fetch latest metrics
  const { data: latestMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/metrics/latest"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch environment health analytics
  const { data: healthAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/analytics/environment-health?startDate=${formattedStartDate}&endDate=${formattedEndDate}`],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch green days analytics
  const { data: greenDaysData, isLoading: greenDaysLoading } = useQuery({
    queryKey: [`/api/analytics/green-days?startDate=${formattedStartDate}&endDate=${formattedEndDate}`],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch active bookings
  const { data: activeBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/bookings?status=active"],
    staleTime: 5 * 60 * 1000,
  });

  // Handle export data
  const handleExport = () => {
    // In a real app, we'd generate a CSV or PDF file
    toast({
      title: "Export started",
      description: "Your data is being prepared for download.",
    });
  };

  // Extract metrics data
  const metrics = latestMetrics && latestMetrics.length > 0 ? latestMetrics[0] : null;

  return (
    <>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Environment Health Dashboard</h2>
          <p className="text-gray-600">Monitor performance metrics and manage test environment bookings</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="60">Last 60 Days</SelectItem>
              <SelectItem value="90">Last Quarter</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard 
          title="Environment Uptime"
          value={metricsLoading ? "Loading..." : `${metrics?.uptime || (typeof healthAnalytics?.averageUptime === 'number' ? healthAnalytics.averageUptime.toFixed(1) : '0')}%`}
          target="99.5%"
          trend={"+0.3% from last month"}
          trendDirection="up"
          progress={metrics?.uptime || healthAnalytics?.averageUptime || 0}
          icon="uptime"
          borderColor="success"
        />
        
        <MetricCard 
          title="Mean Time to Recover (MTTR)"
          value={metricsLoading ? "Loading..." : `${metrics?.mttr || (typeof healthAnalytics?.averageMTTR === 'number' ? healthAnalytics.averageMTTR.toFixed(0) : '0')} min`}
          target="30 min"
          trend={"-10 min from last month"}
          trendDirection="down"
          progress={metrics?.mttr ? Math.min(100, (metrics.mttr / 120) * 100) : (healthAnalytics?.averageMTTR ? Math.min(100, (healthAnalytics.averageMTTR / 120) * 100) : 0)}
          icon="mttr"
          borderColor="warning"
        />
        
        <MetricCard 
          title="Mean Time Between Failures (MTBF)"
          value={metricsLoading ? "Loading..." : `${(metrics?.mtbf ? (metrics.mtbf / (60 * 24)) : (healthAnalytics?.averageMTBF ? (healthAnalytics.averageMTBF / (60 * 24)) : 0)).toFixed(0)} days`}
          target="14 days"
          trend={"+3 days from last month"}
          trendDirection="up"
          progress={(metrics?.mtbf ? Math.min(100, ((metrics.mtbf / (60 * 24)) / 20) * 100) : (healthAnalytics?.averageMTBF ? Math.min(100, ((healthAnalytics.averageMTBF / (60 * 24)) / 20) * 100) : 0))}
          icon="mtbf"
          borderColor="success"
        />
        
        <MetricCard 
          title="Resource Utilization"
          value={metricsLoading ? "Loading..." : `${metrics?.resourceUtilization || (typeof healthAnalytics?.averageResourceUtilization === 'number' ? healthAnalytics.averageResourceUtilization.toFixed(1) : '0')}%`}
          target="<80%"
          trend={"-2.3% from last month"}
          trendDirection="down"
          progress={metrics?.resourceUtilization || healthAnalytics?.averageResourceUtilization || 0}
          icon="resource"
          borderColor="primary"
        />
        
        <MetricCard 
          title="Environment Occupancy"
          value={metricsLoading ? "Loading..." : `${metrics?.occupancy || (typeof healthAnalytics?.averageOccupancy === 'number' ? healthAnalytics.averageOccupancy.toFixed(1) : '0')}%`}
          target=">75%"
          trend={"+5.7% from last month"}
          trendDirection="up"
          progress={metrics?.occupancy || healthAnalytics?.averageOccupancy || 0}
          icon="occupancy"
          borderColor="primary"
        />
        
        <MetricCard 
          title="Recent Incidents"
          value={metricsLoading ? "Loading..." : "3"}
          target="Previous month: 5"
          trend={"-2 from last month"}
          trendDirection="down"
          progress={30}
          icon="incidents"
          borderColor="danger"
        />
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <UptimeResourceChart startDate={startDate} endDate={endDate} isLoading={analyticsLoading} />
        <IncidentsRecoveryChart startDate={startDate} endDate={endDate} isLoading={analyticsLoading} />
      </div>

      {/* Calendar Section */}
      <StatusCalendar isLoading={greenDaysLoading} greenDaysData={greenDaysData} />

      {/* Bookings Section */}
      <div className="mb-8">
        <BookingTable bookings={activeBookings || []} isLoading={bookingsLoading} title="Current Bookings" />
      </div>
    </>
  );
}
