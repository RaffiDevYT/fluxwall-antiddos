"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsChartsProps {
  vectorData: {
    labels: string[];
    data: number[];
  };
  countryData: {
    labels: string[];
    data: number[];
  };
}

export function ThreatVectorChart({ vectorData }: { vectorData: AnalyticsChartsProps["vectorData"] }) {
  const chartData = {
    labels: vectorData.labels,
    datasets: [
      {
        data: vectorData.data,
        backgroundColor: [
          "rgba(56, 189, 248, 0.8)",
          "rgba(56, 189, 248, 0.55)",
          "rgba(56, 189, 248, 0.35)",
          "rgba(56, 189, 248, 0.18)",
        ],
        borderColor: "#080b11",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="h-56 w-56">
      <Doughnut
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#94a3b8", font: { size: 10 } },
            },
          },
        }}
      />
    </div>
  );
}

export function TopCountriesChart({ countryData }: { countryData: AnalyticsChartsProps["countryData"] }) {
  const chartData = {
    labels: countryData.labels,
    datasets: [
      {
        label: "Blocked Attack Volume",
        data: countryData.data,
        backgroundColor: "rgba(56, 189, 248, 0.4)",
        borderColor: "#38bdf8",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="h-56 w-full">
      <Bar
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { color: "rgba(56, 189, 248, 0.04)" },
              ticks: { color: "#71717a", font: { size: 10 } },
            },
            y: {
              grid: { color: "rgba(56, 189, 248, 0.04)" },
              ticks: { color: "#71717a", font: { size: 10 } },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
}
