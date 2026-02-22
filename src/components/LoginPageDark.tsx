import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Info } from 'lucide-react';
import { DataCenterAnimation } from './DataCenterAnimation';
import { FirebaseDebugPanel } from './FirebaseDebugPanel';
import { resetPassword } from '../lib/firebaseAuth';
import { toast } from 'sonner';
import logoImage from '../assets/logo.png';

interface LoginPageDarkProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
  error?: string;
}

export function LoginPageDark({ onLogin, onSwitchToRegister, error }: LoginPageDarkProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Login form submitted:', { email, passwordLength: password.length });
    onLogin(email, password);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setIsResetting(true);

    const { success, error } = await resetPassword(resetEmail);

    if (success) {
      toast.success(
        'Link reset password sudah dikirim!\n\nCek email Anda (termasuk folder Spam)',
        { duration: 6000 }
      );
      setShowForgotPassword(false);
      setResetEmail('');
    } else {
      toast.error(error || 'Failed to send password reset email');
    }

    setIsResetting(false);
  };

  // If showing forgot password view, render that instead
  if (showForgotPassword) {
    return (
      <div className="h-screen relative overflow-hidden fixed inset-0">
        {/* Full Screen Animated Background */}
        <DataCenterAnimation />

        {/* Firebase Debug Panel */}
        <FirebaseDebugPanel />

        {/* Overlay Content */}
        <div className="relative z-10 h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md -mt-12 sm:-mt-16">
            {/* Logo Header */}
            <div className="mb-4 text-center">
              <div className="inline-flex w-52 h-52 sm:w-60 sm:h-60 mb-0">
                <img
                  src={logoImage}
                  alt="United Transworld Trading Logo"
                  className="w-full h-full object-contain m-[0px]"
                />
              </div>
              <h1 className="text-[rgb(255,255,255)] mb-[2px] text-lg sm:text-xl mt-[-50px] font-bold mr-[0px] ml-[0px]">United Transworld Trading</h1>
              <h2 className="text-white text-sm sm:text-base mb-1">Data Center</h2>
              <p className="text-blue-200 text-xs sm:text-sm">
                Secure Material Request Management System
              </p>
            </div>

            {/* Reset Password Card */}
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/50 p-5 sm:p-6 shadow-2xl">
              <div className="mb-4">
                <h3 className="text-white mb-1 text-lg sm:text-xl">🔐 Reset Password</h3>
                <p className="text-slate-400 text-xs sm:text-sm">
                  Enter your email to receive password reset link. <strong className="text-blue-400">Only for Project Managers.</strong>
                </p>
              </div>

              {/* Info Box */}
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex gap-2 items-start">
                  <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-300">
                    <p className="mb-1">📧 Link reset password akan dikirim ke email Anda</p>
                    <p className="mb-1">⚠️ <strong>Cek folder Spam</strong> jika tidak muncul di Inbox</p>
                    <p className="text-blue-400">⏱️ Proses pengiriman sekitar 1-5 menit</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-3 sm:space-y-4">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label htmlFor="resetEmail" className="block text-slate-300 text-xs sm:text-sm">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      <Mail size={18} />
                    </div>
                    <input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-10 pr-3 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                    className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-all text-sm sm:text-base"
                  >
                    Cancel
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isResetting}
                  >
                    {isResetting ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </form>

              {/* Footer */}
              <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-800">
                <p className="text-xs text-slate-500 text-center">
                  © 2010 United Transworld Trading. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen relative overflow-hidden fixed inset-0">
      {/* Full Screen Animated Background */}
      <DataCenterAnimation />

      {/* Firebase Debug Panel */}
      <FirebaseDebugPanel />

      {/* Overlay Content */}
      <div className="relative z-10 h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md -mt-12 sm:-mt-16">
          {/* Logo Header */}
          <div className="mb-4 text-center">
            <div className="inline-flex w-52 h-52 sm:w-60 sm:h-60 mb-0">
              <img
                src={logoImage}
                alt="United Transworld Trading Logo"
                className="w-full h-full object-contain m-[0px]"
              />
            </div>
            <h1 className="text-[rgb(255,255,255)] mb-[2px] text-lg sm:text-xl mt-[-50px] font-bold mr-[0px] ml-[0px]">United Transworld Trading</h1>
            <h2 className="text-white text-sm sm:text-base mb-1">Data Center</h2>
            <p className="text-blue-200 text-xs sm:text-sm">
              Secure Material Request Management System
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/50 p-5 sm:p-6 shadow-2xl">
            <div className="mb-4">
              <h3 className="text-white mb-1 text-lg sm:text-xl">Welcome Back</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Please login to access the system</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Error Display with Helpful Tips */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <div className="flex gap-3 items-start">
                    <div className="text-red-400 flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-red-300 text-sm whitespace-pre-line">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-slate-300 text-xs sm:text-sm">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail size={18} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-10 pr-3 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-slate-300 text-xs sm:text-sm">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock size={18} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm sm:text-base"
              >
                Login
              </button>

              {/* Forgot Password Link - Right Aligned */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-400 hover:text-blue-300 transition-colors text-xs sm:text-sm"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Register Link - Centered */}
              <div className="text-center text-xs sm:text-sm">
                <span className="text-slate-400">Project Manager? </span>
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Register here
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-800">
              <p className="text-xs text-slate-500 text-center">
                © 2010 United Transworld Trading. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}