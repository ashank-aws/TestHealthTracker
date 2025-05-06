import {
  ArrowUp,
  ArrowDown,
  Clock,
  CalendarCheck,
  Cpu,
  Users,
  AlertTriangle,
  Activity
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type MetricCardProps = {
  title: string;
  value: string;
  target: string;
  trend: string;
  trendDirection: "up" | "down";
  progress: number;
  icon: "uptime" | "mttr" | "mtbf" | "resource" | "occupancy" | "incidents";
  borderColor: "success" | "warning" | "danger" | "primary";
};

export default function MetricCard({
  title,
  value,
  target,
  trend,
  trendDirection,
  progress,
  icon,
  borderColor
}: MetricCardProps) {
  // Determine icon component
  const IconComponent = () => {
    switch (icon) {
      case "uptime":
        return <Activity className="text-success" />;
      case "mttr":
        return <Clock className="text-warning" />;
      case "mtbf":
        return <CalendarCheck className="text-success" />;
      case "resource":
        return <Cpu className="text-primary" />;
      case "occupancy":
        return <Users className="text-primary" />;
      case "incidents":
        return <AlertTriangle className="text-danger" />;
      default:
        return <Activity className="text-success" />;
    }
  };

  // Determine CSS classes based on props
  const getBorderClass = () => {
    switch (borderColor) {
      case "success":
        return "border-success";
      case "warning":
        return "border-warning";
      case "danger":
        return "border-danger";
      case "primary":
        return "border-primary";
      default:
        return "border-success";
    }
  };

  const getIconBgClass = () => {
    switch (borderColor) {
      case "success":
        return "bg-success-light";
      case "warning":
        return "bg-warning-light";
      case "danger":
        return "bg-danger-light";
      case "primary":
        return "bg-primary-light";
      default:
        return "bg-success-light";
    }
  };

  const getTrendClass = () => {
    switch (borderColor) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "danger":
        return "text-danger";
      case "primary":
        return "text-primary";
      default:
        return "text-success";
    }
  };

  const getProgressClass = () => {
    switch (borderColor) {
      case "success":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "danger":
        return "bg-danger";
      case "primary":
        return "bg-primary";
      default:
        return "bg-success";
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-5 border-l-4 ${getBorderClass()}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`${getIconBgClass()} p-2 rounded-full`}>
          <IconComponent />
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">{target}</span>
          <span className={`${getTrendClass()} font-medium flex items-center`}>
            {trendDirection === "up" ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
            {trend}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <Progress value={progress} className={getProgressClass()} />
        </div>
      </div>
    </div>
  );
}
