import { useQuery } from "@tanstack/react-query";
import { format, eachDayOfInterval, subDays, isSameDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Line, 
  LineChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

type UptimeResourceChartProps = {
  startDate: Date;
  endDate: Date;
  isLoading: boolean;
};

export default function UptimeResourceChart({ startDate, endDate, isLoading }: UptimeResourceChartProps) {
  // Fetch metrics data
  const { data: metricsData, isLoading: dataLoading } = useQuery({
    queryKey: [`/api/metrics?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`],
    staleTime: 5 * 60 * 1000,
  });

  // Process data for the chart
  const processChartData = () => {
    if (!metricsData || metricsData.length === 0) return [];

    // Generate all days in the interval
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Create a map of metrics by date for easier lookup
    const metricsByDate = new Map();
    metricsData.forEach((metric: any) => {
      const date = new Date(metric.date);
      metricsByDate.set(format(date, 'yyyy-MM-dd'), metric);
    });

    // Create formatted data for the chart
    return allDays.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const metric = metricsByDate.get(dateKey);
      
      return {
        date: format(day, 'MMM dd'),
        uptime: metric ? Number(metric.uptime) : null,
        resourceUtilization: metric ? Number(metric.resourceUtilization) : null,
      };
    });
  };

  const chartData = processChartData();

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-gray-800 font-semibold mb-4">Uptime & Resource Utilization</h3>
        {isLoading || dataLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Skeleton className="h-[180px] w-full" />
          </div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" domain={[90, 100]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="uptime" 
                  name="Uptime (%)" 
                  stroke="#4caf50" 
                  activeDot={{ r: 8 }} 
                  connectNulls 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="resourceUtilization" 
                  name="Resource Util (%)" 
                  stroke="#1976d2" 
                  connectNulls 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
