"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendPercent?: number;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  subtext,
  trend,
  trendPercent,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-[#e0f7ff] text-[#5bc0e8]',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-black text-gray-900">{value}</p>
            {trend && trendPercent && (
              <div
                className={`text-xs font-semibold ${
                  trend === 'up'
                    ? 'text-green-600'
                    : trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {trend === 'up' && '↑'} {Math.abs(trendPercent)}%
              </div>
            )}
          </div>
          {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <div className="w-6 h-6">{icon}</div>
        </div>
      </div>
    </motion.div>
  );
};
