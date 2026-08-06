"use client";
import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type {
  ChartData,
  ChartOptions,
  ScriptableContext,
  TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface LineChartProps {
  trend: { name: string; totalBookings: number }[];
  loading?: boolean;
}

export default function LineChart({ trend, loading = false }: LineChartProps) {
  const chartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index" as const,
      },
      plugins: {
        legend: {
          display: false, // Hide legend for cleaner look
        },
        tooltip: {
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          titleColor: "#1f2937",
          bodyColor: "#6b7280",
          borderColor: "#e5e7eb",
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          titleFont: {
            size: 14,
            weight: "bold" as const,
          },
          bodyFont: {
            size: 13,
          },
          padding: 12,
          callbacks: {
            title: (context: TooltipItem<"line">[]) =>
              monthLabels[context[0]?.dataIndex ?? 0],
            label: (context: TooltipItem<"line">) =>
              `${context.parsed.y?.toLocaleString() ?? "0"} bookings`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: "#9ca3af",
            font: {
              size: 12,
              weight: "normal" as const,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "#f3f4f6",
            drawBorder: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: "#9ca3af",
            font: {
              size: 12,
            },
            callback: (value: string | number) => {
              if (typeof value === "number") return value.toLocaleString();
              const numeric = Number(value);
              return Number.isNaN(numeric)
                ? String(value)
                : numeric.toLocaleString();
            },
          },
        },
      },
      elements: {
        line: {
          tension: 0.4,
          borderWidth: 3,
        },
        point: {
          radius: 0,
          hoverRadius: 8,
          hoverBorderWidth: 3,
          hoverBackgroundColor: "#ffffff",
        },
      },
    }),
    []
  );

  const chartData = useMemo<ChartData<"line">>(() => {
    const data = trend.map((item) => item.totalBookings);

    return {
      labels: monthLabels,
      datasets: [
        {
          label: "Monthly Bookings",
          data,
          borderColor: "#3b82f6",
          backgroundColor: (context: ScriptableContext<"line">) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
            gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.1)");
            gradient.addColorStop(1, "rgba(59, 130, 246, 0)");
            return gradient;
          },
          fill: true,
          pointBackgroundColor: "#3b82f6",
          pointBorderColor: "#ffffff",
          pointHoverBackgroundColor: "#3b82f6",
          pointHoverBorderColor: "#ffffff",
        },
      ],
    };
  }, [trend]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!trend || trend.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-500 font-medium">No data available</p>
          <p className="text-sm text-gray-400 mt-1">
            Chart will appear when data is loaded
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Line options={chartOptions} data={chartData} />
    </div>
  );
}
