import { useState, ChangeEvent, FormEvent } from 'react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, MapPin, Phone } from 'lucide-react';
import { DataCenterAnimation } from './DataCenterAnimation';
import { FirebaseDebugPanel } from './FirebaseDebugPanel';
import { Project } from '../types';
import logoImage from '../assets/logo.png';

interface RegisterPageDarkProps {
  onRegister: (name: string, email: string, password: string, role: string, siteProject: string, phoneNumber: string) => void; // ✅ Add phoneNumber
  onSwitchToLogin: () => void;
  projects: Project[];
  error?: string;
}

export function RegisterPageDark({ onRegister, onSwitchToLogin, projects: _projects = [], error }: RegisterPageDarkProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [siteProject, setSiteProject] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // ✅ Add phoneNumber state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Only Project Manager role is allowed to register
  const role = 'Project Manager';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError('');

    console.log('📝 Register form submitted:', {
      name,
      email,
      siteProject,
      phoneNumber, // ✅ Log phone number
      passwordLength: password.length
    });

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }

    if (!siteProject) {
      setValidationError('Please select a site/project');
      return;
    }

    if (!phoneNumber.trim()) {
      setValidationError('Please enter your phone number');
      return;
    }

    onRegister(name, email, password, role, siteProject, phoneNumber); // ✅ Pass phoneNumber
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full Screen Animated Background */}
      <DataCenterAnimation />

      {/* Firebase Debug Panel */}
      <FirebaseDebugPanel />

      {/* Overlay Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md">
          {/* Logo Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="inline-flex w-48 h-48 sm:w-56 sm:h-56 mb-0">
              <img
                src={logoImage}
                alt="United Transworld Trading Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-white mb-[4px] text-xl sm:text-2xl mt-[-50px] font-bold mr-[0px] ml-[0px]">United Transworld Trading</h1>
            <h2 className="text-white mb-2">Data Center</h2>
            <p className="text-blue-200 text-sm sm:text-base">
              Secure Material Request Management System
            </p>
          </div>

          {/* Register Card */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/50 p-6 sm:p-8 shadow-2xl">
            <div className="mb-6">
              <h3 className="text-white mb-2 text-xl sm:text-2xl">Register Account</h3>
              <p className="text-slate-400 text-sm sm:text-base">Create a Project Manager account</p>
            </div>

            {/* Registration Restriction Notice */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-2 sm:gap-3">
              <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
              <div className="min-w-0">
                <p className="text-blue-400 mb-1 text-sm sm:text-base">Registration Notice</p>
                <p className="text-blue-300 text-xs sm:text-sm">
                  Only <strong>Project Managers</strong> can register. Other roles must login with credentials provided by PMO.
                  Your registration will need to be approved by PMO before you can login.
                </p>
              </div>
            </div>

            {(error || validationError) && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-red-200 text-sm sm:text-base flex-1">{error || validationError}</p>
                </div>

                {/* Show login button and help text if email already exists */}
                {(error && (error.includes('sudah terdaftar') || error.includes('already'))) && (
                  <div className="space-y-2 mt-3">
                    <button
                      type="button"
                      onClick={onSwitchToLogin}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm"
                    >
                      Go to Login Page
                    </button>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-blue-500/20">
                      <p className="text-xs text-blue-300 mb-2">
                        <strong>Email sudah terdaftar?</strong>
                      </p>
                      <p className="text-xs text-slate-300 mb-3">
                        Jika Anda yakin email ini belum pernah didaftarkan, kemungkinan registrasi sebelumnya gagal di tengah jalan. Hubungi Admin untuk membersihkan data:
                      </p>
                      <a
                        href="https://wa.me/6285723375324?text=Halo%20Admin,%20saya%20mengalami%20error%20'email%20sudah%20terdaftar'%20padahal%20belum%20pernah%20register.%20Mohon%20bantuannya.%20Email:%20"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors text-xs w-full justify-center"
                      >
                        <Phone size={14} />
                        <span>Hubungi Admin via WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-slate-300 text-sm sm:text-base">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <User size={20} />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-slate-300 text-sm sm:text-base">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail size={20} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Site/Project Selection */}
              <div className="space-y-2">
                <label htmlFor="siteProject" className="block text-slate-300 text-sm sm:text-base">
                  Assigned Site / Project
                </label>
                <div className="relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <MapPin size={20} />
                  </div>
                  <select
                    id="siteProject"
                    value={siteProject}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSiteProject(e.target.value)}
                    required
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm sm:text-base"
                  >
                    <option value="">Select your site/project</option>
                    <option value="Neutra DC Cikarang">Neutra DC Cikarang</option>
                    <option value="Neutra DC Surabaya">Neutra DC Surabaya</option>
                    <option value="LEN">LEN</option>
                    <option value="EDGE">EDGE</option>
                    <option value="BRI">BRI</option>
                  </select>
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="block text-slate-300 text-sm sm:text-base">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Phone size={20} />
                  </div>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                    required
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-slate-300 text-sm sm:text-base">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock size={20} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-slate-300 text-sm sm:text-base">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock size={20} />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm sm:text-base"
              >
                Register Account
              </button>

              {/* Login Link */}
              <div className="text-center text-sm sm:text-base">
                <span className="text-slate-400">Already have an account? </span>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Login here
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-800">
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