import { useQuery } from "@tanstack/react-query";
import { format, eachWeekOfInterval, startOfWeek, endOfWeek, addDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

type IncidentsRecoveryChartProps = {
  startDate: Date;
  endDate: Date;
  isLoading: boolean;
};

export default function IncidentsRecoveryChart({ startDate, endDate, isLoading }: IncidentsRecoveryChartProps) {
  // Fetch incidents data
  const { data: incidentsData, isLoading: dataLoading } = useQuery({
    queryKey: [`/api/incidents?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`],
    staleTime: 5 * 60 * 1000,
  });

  // Process data for the chart
  const processChartData = () => {
    if (!incidentsData) return [];

    // Generate weeks in the interval
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
    
    // Create chart data structure
    return weeks.map((week, index) => {
      const weekStart = startOfWeek(week);
      const weekEnd = endOfWeek(week);
      
      // Filter incidents that occurred during this week
      const weekIncidents = incidentsData.filter((incident: any) => {
        const incidentDate = new Date(incident.startTime);
        return incidentDate >= weekStart && incidentDate <= weekEnd;
      });
      
      // Calculate incidents count and average recovery time
      const incidentsCount = weekIncidents.length;
      
      // Calculate average recovery time for resolved incidents
      const resolvedIncidents = weekIncidents.filter((incident: any) => incident.status === 'resolved');
      let avgRecoveryTime = 0;
      
      if (resolvedIncidents.length > 0) {
        const totalRecoveryTime = resolvedIncidents.reduce((sum: number, incident: any) => {
          return sum + (incident.recoveryTime || 0);
        }, 0);
        avgRecoveryTime = totalRecoveryTime / resolvedIncidents.length;
      }
      
      return {
        week: `Week ${index + 1}`,
        weekLabel: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
        incidents: incidentsCount,
        recoveryTime: Math.round(avgRecoveryTime)
      };
    });
  };

  const chartData = processChartData();

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-gray-800 font-semibold mb-4">Incidents & Recovery Time</h3>
        {isLoading || dataLoading ? (
          <div className="h-[200px] flex items-center justify-center">
            <Skeleton className="h-[180px] w-full" />
          </div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" orientation="left" label={{ value: 'Incidents', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Recovery (min)', angle: -90, position: 'insideRight' }} />
                <Tooltip 
                  formatter={(value, name) => [
                    value, 
                    name === 'incidents' ? 'Incidents' : 'Recovery Time (min)'
                  ]}
                  labelFormatter={(label) => {
                    const item = chartData.find(d => d.week === label);
                    return item ? item.weekLabel : label;
                  }}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="incidents" 
                  fill="#f44336" 
                  name="Incidents" 
                />
                <Bar 
                  yAxisId="right"
                  dataKey="recoveryTime" 
                  fill="#ffb300" 
                  name="Recovery Time" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
