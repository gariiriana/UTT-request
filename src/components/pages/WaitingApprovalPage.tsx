import { Clock, Mail, Shield, CheckCircle } from 'lucide-react';
import { User } from '../../types';

interface WaitingApprovalPageProps {
  user: User;
}

export function WaitingApprovalPage({ user }: WaitingApprovalPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-lg p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30">
                <Clock className="text-blue-400" size={40} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
                <Shield className="text-yellow-400" size={16} />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-white text-center mb-2">
            Menunggu Persetujuan
          </h1>
          <p className="text-slate-400 text-center mb-8">
            Registrasi Anda sedang ditinjau
          </p>

          {/* Info Card */}
          <div className="bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-700">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="text-blue-400 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-slate-400">Email Terdaftar</p>
                  <p className="text-white">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="text-blue-400 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-slate-400">Nama</p>
                  <p className="text-white">{user.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="text-blue-400 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm text-slate-400">Role</p>
                  <p className="text-white">{user.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <p className="text-blue-400 text-sm">
                Menunggu approval dari PMO
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-center space-y-3">
            <p className="text-slate-400 text-sm">
              Akun Anda akan diaktifkan setelah disetujui oleh PMO.
            </p>
          </div>

          {/* Refresh Hint */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Refresh halaman ini untuk memeriksa status approval
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600">
            UTT Data Center • Material Request System
          </p>
        </div>
      </div>
    </div>
  );
}