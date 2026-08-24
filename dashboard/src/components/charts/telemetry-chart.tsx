"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface TelemetryChartProps {
  labels: string[];
  dataPoints: number[];
  label: string;
}

export default function TelemetryChart({ labels, dataPoints, label }: TelemetryChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data: dataPoints,
        borderColor: "#38bdf8",
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 220);
          gradient.addColorStop(0, "rgba(56, 189, 248, 0.28)");
          gradient.addColorStop(1, "rgba(56, 189, 248, 0.0)");
          return gradient;
        },
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 300,
    },
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: "rgba(56, 189, 248, 0.04)" },
        ticks: { color: "#71717a", font: { size: 10 }, maxTicksLimit: 8 },
      },
      y: {
        grid: { color: "rgba(56, 189, 248, 0.04)" },
        ticks: { color: "#71717a", font: { size: 10 }, maxTicksLimit: 6 },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-56 w-full pt-2">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
