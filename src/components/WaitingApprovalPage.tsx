import { Clock, Mail, User, MapPin, LogOut, MessageCircle, Phone } from 'lucide-react';
import { User as UserType } from '../types';

interface WaitingApprovalPageProps {
  user: UserType;
  onLogout: () => void;
}

export function WaitingApprovalPage({ user, onLogout }: WaitingApprovalPageProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full">
        {/* Card */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-6 sm:p-8 lg:p-12 text-center">
          {/* Animated Clock Icon */}
          <div className="mb-6 sm:mb-8 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <Clock className="text-yellow-400" size={40} />
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-yellow-500/20 animate-pulse"></div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-white mb-3 sm:mb-4 text-xl sm:text-2xl lg:text-3xl">Waiting for Admin Approval</h1>
          <p className="text-slate-400 text-base sm:text-lg mb-6 sm:mb-8 px-2">
            Akun berhasil dibuat. Menunggu persetujuan admin.
          </p>

          {/* User Info */}
          <div className="bg-slate-800 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 text-left">
            <h3 className="text-white mb-3 sm:mb-4 text-base sm:text-lg">Your Account Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="text-blue-400 flex-shrink-0" size={20} />
                <div className="min-w-0">
                  <p className="text-sm text-slate-400">Name</p>
                  <p className="text-white break-words">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-blue-400 flex-shrink-0" size={20} />
                <div className="min-w-0">
                  <p className="text-sm text-slate-400">Email</p>
                  <p className="text-white break-all">{user.email}</p>
                </div>
              </div>
              {user.phoneNumber && (
                <div className="flex items-center gap-3">
                  <Phone className="text-blue-400 flex-shrink-0" size={20} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-400">Phone Number</p>
                    <p className="text-white break-words">{user.phoneNumber}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <MapPin className="text-blue-400 flex-shrink-0" size={20} />
                <div className="min-w-0">
                  <p className="text-sm text-slate-400">Site/Project</p>
                  <p className="text-white break-words">{user.siteProject}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 text-left">
            <h3 className="text-blue-400 mb-2 text-base sm:text-lg">What happens next?</h3>
            <ul className="text-blue-300 text-sm space-y-2">
              <li>• Admin will review your registration</li>
              <li>• You will receive an email notification once approved</li>
              <li>• After approval, you can log in and start creating material requests</li>
            </ul>
          </div>

          {/* Admin Contact Box - HIGHLIGHTED */}
          <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-2 border-blue-400/50 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-3">
              <MessageCircle className="text-blue-400 animate-pulse flex-shrink-0" size={24} />
              <h3 className="text-blue-400 text-base sm:text-lg">Hubungi Admin untuk Approval</h3>
            </div>
            <p className="text-blue-200 text-sm mb-4 px-2">
              Untuk mempercepat proses approval, silakan hubungi Admin melalui WhatsApp
            </p>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-blue-500/30">
              <p className="text-slate-400 text-sm mb-2">Nomor WhatsApp Admin:</p>
              <a 
                href="https://wa.me/6285723375324" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-base sm:text-lg"
              >
                <MessageCircle size={20} className="flex-shrink-0" />
                <span>0857-2337-5324</span>
              </a>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full px-4 sm:px-6 py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-4 sm:mt-6 px-4">
          If you have any questions, please contact your administrator
        </p>
      </div>
    </div>
  );
}