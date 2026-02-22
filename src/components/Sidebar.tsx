import {
  LayoutDashboard,
  CheckSquare,
  History,
  TrendingUp,
  X,
  CheckCircle,
  Image as ImageIcon,
  Clipboard,
  ListChecks,
  ShoppingBag, // ✅ ADD: Icon for Recommendations
  RotateCcw // ✅ ADD: Icon for Handle Returns
} from 'lucide-react';
import { UserRole } from '../types';
import logoImage from '../assets/logo.png';

interface SidebarProps {
  userRole: UserRole;
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ userRole, currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
  const menuItems = getMenuItemsForRole(userRole);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900/80 backdrop-blur-sm border-r border-slate-800
        transform transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 lg:hidden text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
          <div className="flex flex-col items-center text-center">
            <img
              src={logoImage}
              alt="United Transworld Trading Logo"
              className="w-48 h-48 object-contain mb-[12px] mt-[-50px] mr-[0px] ml-[0px]"
            />
            <div>
              <h2 className="text-white mb-[4px] mt-[-55px] mr-[0px] ml-[0px]">United Transworld Trading</h2>
              <p className="text-xs text-slate-400">Data Center Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${currentPage === item.id
                  ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20 border border-blue-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function getMenuItemsForRole(role: UserRole) {
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
  ];

  const roleSpecificItems: Record<string, Array<{ id: string; label: string; icon: any }>> = {
    'Project Manager': [
      { id: 'create-request-boq', label: 'Request from BOQ', icon: ListChecks },
      { id: 'my-requests', label: 'My Requests', icon: History },
      { id: 'confirm-delivery', label: 'Confirm Delivery', icon: CheckCircle }
    ],
    'PMO': [
      { id: 'approvals', label: 'Approvals', icon: CheckSquare },
      { id: 'history', label: 'History', icon: History }
    ],
    'Sales/Pre-Sales': [
      { id: 'boq-management', label: 'BOQ Management', icon: Clipboard },
      { id: 'approvals', label: 'Approvals', icon: CheckSquare },
      { id: 'history', label: 'History', icon: History }
    ],
    'Purchasing': [
      { id: 'recommendations', label: 'Request PM', icon: ShoppingBag }, // ✅ Changed from Procurement to Request PM
      { id: 'purchase-proof', label: 'Complete Purchase', icon: ImageIcon },
      { id: 'handle-returns', label: 'Handle Returns', icon: RotateCcw }, // ✅ NEW: Handle Returns
      { id: 'history', label: 'History', icon: History }
    ],
    'BOD Director': [
      { id: 'finance', label: 'Finance Dashboard', icon: TrendingUp },
      { id: 'approvals', label: 'Final Approvals', icon: CheckSquare },
      { id: 'history', label: 'History', icon: History }
    ],
    'BOD Finance': [
      { id: 'finance', label: 'Finance Dashboard', icon: TrendingUp },
      { id: 'approvals', label: 'Final Approvals', icon: CheckSquare },
      { id: 'history', label: 'History', icon: History }
    ],
    'BOD Procurement': [
      { id: 'finance', label: 'Finance Dashboard', icon: TrendingUp },
      { id: 'approvals', label: 'Final Approvals', icon: CheckSquare },
      { id: 'history', label: 'History', icon: History }
    ]
  };

  return [...baseItems, ...(roleSpecificItems[role] || [])];
}