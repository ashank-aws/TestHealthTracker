import { useState } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, getDate, getDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// We need to define these types since they aren't exported from the backend
type DailyStatus = {
  id: number;
  environmentId: number;
  date: string;
  status: "healthy" | "issues" | "down";
  uptimePercentage: number;
  hasIncident: boolean;
  incidentCount: number;
  recoveryTime: number | null;
};

type GreenDaysAnalytics = {
  totalDays: number;
  greenDays: number;
  yellowDays: number;
  redDays: number;
  greenDaysPercentage: number;
};

type StatusCalendarProps = {
  isLoading: boolean;
  greenDaysData?: GreenDaysAnalytics;
};

export default function StatusCalendar({ isLoading, greenDaysData }: StatusCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Calculate month boundaries
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  
  // Fetch daily status data for the current month
  const { data: dailyStatusData, isLoading: statusLoading } = useQuery({
    queryKey: [`/api/daily-status?startDate=${format(firstDayOfMonth, 'yyyy-MM-dd')}&endDate=${format(lastDayOfMonth, 'yyyy-MM-dd')}`],
    staleTime: 5 * 60 * 1000,
  });
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Generate days for the calendar
  const calendarDays = () => {
    // Get all days in the month
    const daysInMonth = eachDayOfInterval({
      start: firstDayOfMonth,
      end: lastDayOfMonth
    });
    
    // Calculate how many empty spots to add at the beginning (for the day of the week alignment)
    const startDay = getDay(firstDayOfMonth);
    const emptyStartDays = Array(startDay).fill(null);
    
    return [...emptyStartDays, ...daysInMonth];
  };
  
  // Get status for a specific day
  const getStatusForDay = (day: Date | null) => {
    if (!day || !dailyStatusData || !Array.isArray(dailyStatusData)) return null;
    
    const dateStr = format(day, 'yyyy-MM-dd');
    return dailyStatusData.find((status: DailyStatus) => 
      format(new Date(status.date), 'yyyy-MM-dd') === dateStr
    );
  };
  
  // Get background color based on status
  const getStatusColor = (day: Date | null) => {
    if (!day) return "";
    
    // Future dates are gray
    if (day > new Date()) {
      return "bg-gray-300 text-gray-700";
    }
    
    const status = getStatusForDay(day);
    if (!status) return "bg-gray-300 text-gray-700";
    
    switch(status.status) {
      case "healthy":
        return "bg-success text-white";
      case "issues":
        return "bg-warning text-white";
      case "down":
        return "bg-danger text-white";
      default:
        return "bg-gray-300 text-gray-700";
    }
  };
  
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = calendarDays();
  
  return (
    <div className="mb-8">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h3 className="text-gray-800 text-xl font-semibold">Environment Status Calendar</h3>
            <div className="flex items-center space-x-2 mt-2 md:mt-0">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-success mr-1"></div>
                <span className="text-sm text-gray-600">Healthy</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-warning mr-1"></div>
                <span className="text-sm text-gray-600">Issues</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-danger mr-1"></div>
                <span className="text-sm text-gray-600">Down</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-gray-300 mr-1"></div>
                <span className="text-sm text-gray-600">Future</span>
              </div>
            </div>
          </div>
          
          {/* Calendar Month Selector */}
          <div className="flex justify-between items-center mb-4">
            <button 
              className="text-gray-600 hover:text-gray-900"
              onClick={prevMonth}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h4 className="text-lg font-medium text-gray-800">{format(currentMonth, 'MMMM yyyy')}</h4>
            <button 
              className="text-gray-600 hover:text-gray-900"
              onClick={nextMonth}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekdays.map((day, i) => (
              <div key={i} className="text-center text-sm font-medium text-gray-600 py-1">
                {day}
              </div>
            ))}
          </div>

          {statusLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array(35).fill(null).map((_, i) => (
                <Skeleton key={i} className="calendar-day rounded-md aspect-square" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => (
                <div 
                  key={i} 
                  className={`calendar-day rounded-md ${day ? getStatusColor(day) : ""} flex flex-col justify-between p-1 text-sm ${day ? "cursor-pointer hover:opacity-90" : ""}`}
                >
                  {day && (
                    <>
                      <span className="text-xs text-right">{getDate(day)}</span>
                      {getStatusForDay(day) && (
                        <span className="text-center text-xs font-bold">
                          {typeof getStatusForDay(day)?.uptimePercentage === 'number' 
                            ? getStatusForDay(day)?.uptimePercentage.toFixed(0) 
                            : '0'}%
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <div className="flex justify-between items-center text-sm">
              <div>
                {isLoading ? (
                  <Skeleton className="h-4 w-64" />
                ) : (
                  <span>
                    <span className="font-medium text-success">{greenDaysData?.greenDays || 0} Green Days</span> of {greenDaysData?.totalDays || 0} days this month
                  </span>
                )}
              </div>
              <button className="text-primary hover:underline">View Full History</button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
