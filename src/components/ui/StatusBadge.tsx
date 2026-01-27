import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'rounded' | 'square';
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Reservation statuses
  RESERVED: { label: 'Réservé', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  FULFILLED: { label: 'Rempli', className: 'bg-green-100 text-green-800 border-green-200' },
  RELEASED: { label: 'Libéré', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  CANCELLED: { label: 'Annulé', className: 'bg-red-100 text-red-800 border-red-200' },
  
  // Project statuses
  ACTIVE: { label: 'Actif', className: 'bg-green-100 text-green-800 border-green-200' },
  COMPLETED: { label: 'Terminé', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  ON_HOLD: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  
  // Other statuses
  PENDING: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  CONFIRMED: { label: 'Confirmée', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  EXPIRED: { label: 'Expirée', className: 'bg-red-100 text-red-800 border-red-200' },
  
  // Role statuses
  ADMIN: { label: 'Admin', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  MANAGER: { label: 'Manager', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  EMPLOYEE: { label: 'Employé', className: 'bg-green-100 text-green-800 border-green-200' },
  STOCK_KEEPER: { label: 'Gestionnaire', className: 'bg-blue-100 text-blue-800 border-blue-200' },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const variantClasses = {
  default: 'rounded-lg',
  rounded: 'rounded-full',
  square: 'rounded',
};

export default function StatusBadge({ 
  status, 
  variant = 'default', 
  size = 'md' 
}: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center border-2 shadow-sm font-bold ${config.className} ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {config.label}
    </span>
  );
}
