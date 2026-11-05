import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { OperationalData } from "@/hooks/useDashboard";

interface OperationsChartProps {
  data: OperationalData[];
}

export const OperationsChart = ({ data }: OperationsChartProps) => {
  const chartConfig = {
    dispatches: {
      label: "Dispatches",
      color: "hsl(var(--primary))",
    },
    loads: {
      label: "Loads",
      color: "hsl(var(--success))",
    },
    exits: {
      label: "Exits",
      color: "hsl(var(--info))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Operations</CardTitle>
        <CardDescription>Hourly activity across all modules</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hour" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="dispatches" 
                stroke="var(--color-dispatches)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="loads" 
                stroke="var(--color-loads)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="exits" 
                stroke="var(--color-exits)" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
