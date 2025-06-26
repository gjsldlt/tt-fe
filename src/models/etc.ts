export interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  growth?: number;
  trend?: "up" | "down" | "neutral";
  className?: string;
}
