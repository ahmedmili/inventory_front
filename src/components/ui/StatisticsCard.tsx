import React, { ReactNode } from 'react';

type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'indigo' | 'pink';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  colorScheme?: ColorScheme;
  className?: string;
}

const colorSchemes: Record<ColorScheme, {
  gradient: string;
  border: string;
  text: string;
  textValue: string;
  iconBg: string;
  iconColor: string;
}> = {
  blue: {
    gradient: 'from-blue-50 via-blue-50 to-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-600',
    textValue: 'text-blue-900',
    iconBg: 'from-blue-200 to-blue-300',
    iconColor: 'text-blue-700',
  },
  green: {
    gradient: 'from-green-50 via-green-50 to-green-100',
    border: 'border-green-200',
    text: 'text-green-600',
    textValue: 'text-green-900',
    iconBg: 'from-green-200 to-green-300',
    iconColor: 'text-green-700',
  },
  purple: {
    gradient: 'from-purple-50 via-purple-50 to-purple-100',
    border: 'border-purple-200',
    text: 'text-purple-600',
    textValue: 'text-purple-900',
    iconBg: 'from-purple-200 to-purple-300',
    iconColor: 'text-purple-700',
  },
  orange: {
    gradient: 'from-orange-50 via-orange-50 to-orange-100',
    border: 'border-orange-200',
    text: 'text-orange-600',
    textValue: 'text-orange-900',
    iconBg: 'from-orange-200 to-orange-300',
    iconColor: 'text-orange-700',
  },
  red: {
    gradient: 'from-red-50 via-red-50 to-red-100',
    border: 'border-red-200',
    text: 'text-red-600',
    textValue: 'text-red-900',
    iconBg: 'from-red-200 to-red-300',
    iconColor: 'text-red-700',
  },
  yellow: {
    gradient: 'from-yellow-50 via-yellow-50 to-yellow-100',
    border: 'border-yellow-200',
    text: 'text-yellow-600',
    textValue: 'text-yellow-900',
    iconBg: 'from-yellow-200 to-yellow-300',
    iconColor: 'text-yellow-700',
  },
  indigo: {
    gradient: 'from-indigo-50 via-indigo-50 to-indigo-100',
    border: 'border-indigo-200',
    text: 'text-indigo-600',
    textValue: 'text-indigo-900',
    iconBg: 'from-indigo-200 to-indigo-300',
    iconColor: 'text-indigo-700',
  },
  pink: {
    gradient: 'from-pink-50 via-pink-50 to-pink-100',
    border: 'border-pink-200',
    text: 'text-pink-600',
    textValue: 'text-pink-900',
    iconBg: 'from-pink-200 to-pink-300',
    iconColor: 'text-pink-700',
  },
};

export default function StatisticsCard({
  title,
  value,
  icon,
  colorScheme = 'blue',
  className = '',
}: StatisticsCardProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <div className={`bg-gradient-to-br ${colors.gradient} rounded-xl p-4 sm:p-5 border ${colors.border} shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className={`text-xs sm:text-sm font-medium ${colors.text} truncate`}>{title}</p>
          <p className={`text-xl sm:text-2xl font-bold ${colors.textValue} mt-1`}>{value}</p>
        </div>
        <div className={`h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br ${colors.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 ml-2 shadow-sm`}>
          <div className={colors.iconColor}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
