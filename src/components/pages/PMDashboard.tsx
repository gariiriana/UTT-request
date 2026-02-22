import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { MaterialRequest, UserRole } from '../../types';
import { getRoleGreeting } from '../../lib/displayNameUtils';

interface PMDashboardProps {
  requests: MaterialRequest[];
  userName: string;
  userRole?: UserRole; // ✅ Add userRole prop
  onViewDetails?: (requestId: string) => void;
}

export function PMDashboard({ requests, userName, userRole, onViewDetails }: PMDashboardProps) {
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status.includes('Pending')).length,
    completed: requests.filter(r => r.status === 'Completed - Delivered').length,
    rejected: requests.filter(r => r.status === 'Rejected').length
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-white mb-2">Welcome back, {userName}</h1>
        <p className="text-slate-400">{userRole ? getRoleGreeting(userRole) : 'Manage your material requests and track their progress'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={FileText}
          label="Total Requests"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.pending}
          color="yellow"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completed}
          color="green"
        />
        <StatCard
          icon={AlertCircle}
          label="Rejected"
          value={stats.rejected}
          color="red"
        />
      </div>

      {/* Recent Requests */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-white">Recent Requests</h2>
        </div>
        <div className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400">No requests yet</p>
              <p className="text-slate-500 text-sm mt-2">Create your first material request to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  onClick={() => onViewDetails?.(request.id)}
                  className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500/50 hover:bg-slate-750 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-white mb-1">{request.itemName}</h4>
                      <p className="text-sm text-slate-400">{request.siteProject}</p>
                    </div>
                    <span
                      className={`
                      px-3 py-1 rounded-full text-xs
                      ${request.status.includes('Pending') ? 'bg-yellow-500/10 text-yellow-400' :
                          request.status === 'Completed - Delivered' ? 'bg-blue-500/10 text-blue-400' :
                            request.status === 'Rejected' ? 'bg-red-500/10 text-red-400' :
                              'bg-blue-500/10 text-blue-400'}
                    `}>
                      {request.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-500">
                    <span>Qty: {request.quantity}</span>
                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: any;
  label: string;
  value: number;
  color: 'blue' | 'yellow' | 'green' | 'red';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    yellow: 'from-yellow-500 to-yellow-600 shadow-yellow-500/20',
    green: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    red: 'from-red-500 to-red-600 shadow-red-500/20'
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`
          w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]}
          flex items-center justify-center shadow-lg
        `}>
          <Icon className="text-white" size={24} />
        </div>
        <span className="text-3xl text-white">{value}</span>
      </div>
      <p className="text-slate-400">{label}</p>
    </div>
  );
}