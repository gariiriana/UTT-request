import { RequestStatus } from '../types';
import { Clock, CheckCircle, XCircle, DollarSign, TrendingUp, RotateCcw, PackageCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  // Fallback if status not found
  if (!config) {
    return (
      <span className={`
        inline-flex items-center gap-2 rounded-full
        px-3 py-1.5 text-sm
        bg-slate-500/10 text-slate-400 border-slate-500/30
        border shadow-lg shadow-slate-500/20
      `}>
        <Clock size={16} />
        <span>{status}</span>
      </span>
    );
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSize = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <span className={`
      inline-flex items-center gap-2 rounded-full
      ${sizeClasses[size]}
      ${config.bgClass} ${config.textClass} ${config.borderClass}
      border shadow-lg ${config.shadowClass}
    `}>
      <config.icon size={iconSize[size]} />
      <span>{status}</span>
    </span>
  );
}

function getStatusConfig(status: RequestStatus) {
  const configs: Record<RequestStatus, {
    icon: any;
    bgClass: string;
    textClass: string;
    borderClass: string;
    shadowClass: string;
  }> = {
    'Pending PM Approval': {
      icon: Clock,
      bgClass: 'bg-yellow-500/10',
      textClass: 'text-yellow-400',
      borderClass: 'border-yellow-500/30',
      shadowClass: 'shadow-yellow-500/20'
    },
    'Pending PMO Approval': {
      icon: Clock,
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-400',
      borderClass: 'border-blue-500/30',
      shadowClass: 'shadow-blue-500/20'
    },
    'Pending Sales Verification': {
      icon: Clock,
      bgClass: 'bg-purple-500/10',
      textClass: 'text-purple-400',
      borderClass: 'border-purple-500/30',
      shadowClass: 'shadow-purple-500/20'
    },
    'Pricing Needed': {
      icon: DollarSign,
      bgClass: 'bg-orange-500/10',
      textClass: 'text-orange-400',
      borderClass: 'border-orange-500/30',
      shadowClass: 'shadow-orange-500/20'
    },
    'Pending - PMO Review': {
      icon: Clock,
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-400',
      borderClass: 'border-blue-500/30',
      shadowClass: 'shadow-blue-500/20'
    },
    'Pending - Sales Verification': {
      icon: Clock,
      bgClass: 'bg-purple-500/10',
      textClass: 'text-purple-400',
      borderClass: 'border-purple-500/30',
      shadowClass: 'shadow-purple-500/20'
    },
    'Pending - Purchasing Pricing': {
      icon: DollarSign,
      bgClass: 'bg-orange-500/10',
      textClass: 'text-orange-400',
      borderClass: 'border-orange-500/30',
      shadowClass: 'shadow-orange-500/20'
    },
    'Pending - BOD Final Approval': {
      icon: TrendingUp,
      bgClass: 'bg-cyan-500/10',
      textClass: 'text-cyan-400',
      borderClass: 'border-cyan-500/30',
      shadowClass: 'shadow-cyan-500/20'
    },
    'Approved - Purchasing Processing': {
      icon: CheckCircle,
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-400',
      borderClass: 'border-blue-500/30',
      shadowClass: 'shadow-blue-500/20'
    },
    'Delivered - Awaiting PM Confirmation': {
      icon: Clock,
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/30',
      shadowClass: 'shadow-amber-500/20'
    },
    'Completed - Delivered': {
      icon: CheckCircle,
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-400',
      borderClass: 'border-blue-500/30',
      shadowClass: 'shadow-blue-500/20'
    },
    'Return Requested': {
      icon: RotateCcw,
      bgClass: 'bg-yellow-500/10',
      textClass: 'text-yellow-400',
      borderClass: 'border-yellow-500/30',
      shadowClass: 'shadow-yellow-500/20'
    },
    'Returned to Central': {
      icon: PackageCheck,
      bgClass: 'bg-green-500/10',
      textClass: 'text-green-400',
      borderClass: 'border-green-500/30',
      shadowClass: 'shadow-green-500/20'
    },
    'Return Rejected': {
      icon: XCircle,
      bgClass: 'bg-red-500/10',
      textClass: 'text-red-400',
      borderClass: 'border-red-500/30',
      shadowClass: 'shadow-red-500/20'
    },
    'Rejected': {
      icon: XCircle,
      bgClass: 'bg-red-500/10',
      textClass: 'text-red-400',
      borderClass: 'border-red-500/30',
      shadowClass: 'shadow-red-500/20'
    }
  };

  return configs[status];
}