import { useState } from 'react';
import { MaterialRequest } from '../../types';
import { DollarSign, BarChart3, Download, Package, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinanceDashboardProps {
  requests: MaterialRequest[];
}

export function FinanceDashboard({ requests }: FinanceDashboardProps) {
  const [filterProject, setFilterProject] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterApprovalStatus, setFilterApprovalStatus] = useState('');
  const [showApprovedItems, setShowApprovedItems] = useState(true);
  const [activeCardView, setActiveCardView] = useState<'all' | 'pending' | 'highest-site' | 'approved'>('all');

  // Filter hanya Procurement (pembelian) saja, bukan Borrowing
  const procurementRequests = requests.filter(r => r.requestType === 'Procurement');

  // Get unique values for filters
  const uniqueProjects = Array.from(new Set(procurementRequests.map(r => r.siteProject)));
  const uniqueYears = Array.from(new Set(procurementRequests.map(r => new Date(r.createdAt).getFullYear().toString()))).sort((a, b) => Number(b) - Number(a));

  // Filter requests - hanya Procurement yang sudah approved BOD
  const filteredRequests = procurementRequests.filter(r => {
    // ✅ ONLY show requests that have been approved by BOD
    const isApprovedByBOD = (
      r.status === 'Approved - Purchasing Processing' ||
      r.status === 'Delivered - Awaiting PM Confirmation' ||
      r.status === 'Completed - Delivered'
    ) && r.bodApprovedBy;

    if (!isApprovedByBOD) return false;

    if (filterProject && r.siteProject !== filterProject) return false;
    if (filterYear && new Date(r.createdAt).getFullYear().toString() !== filterYear) return false;
    if (filterMonth && new Date(r.createdAt).getMonth().toString() !== filterMonth) return false;
    if (filterApprovalStatus && r.status !== filterApprovalStatus) return false;
    return true;
  });

  // ✅ Helper function to get approved recommendation price
  const getApprovedPrice = (request: MaterialRequest): number => {
    // If BOD selected a specific recommendation, use that price
    if (request.approvedRecommendationId && request.purchasingRecommendations) {
      const approvedRec = request.purchasingRecommendations.find(
        rec => rec.id === request.approvedRecommendationId
      );
      if (approvedRec) {
        return approvedRec.totalPrice;
      }
    }
    // Fallback to request totalPrice (for old data or borrowing)
    return request.totalPrice || 0;
  };

  // Calculate totals using approved recommendation prices
  const totalExpense = filteredRequests.reduce((sum, r) => sum + getApprovedPrice(r), 0);
  const approvedRequestsCount = filteredRequests.length;

  // Group by site/project
  const expensesBySite = filteredRequests.reduce((acc, r) => {
    if (!acc[r.siteProject]) {
      acc[r.siteProject] = 0;
    }
    acc[r.siteProject] += getApprovedPrice(r);
    return acc;
  }, {} as Record<string, number>);

  const highestSiteExpense = Object.entries(expensesBySite).sort((a, b) => b[1] - a[1])[0];

  // Chart data
  const siteChartData = Object.entries(expensesBySite).map(([site, amount]) => ({
    site,
    amount
  }));

  // Monthly data
  const monthlyData = filteredRequests.reduce((acc, r) => {
    const month = new Date(r.createdAt).toLocaleString('default', { month: 'short' });
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += getApprovedPrice(r);
    return acc;
  }, {} as Record<string, number>);

  const monthlyChartData = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount
  }));

  // Request type data




  const handleExport = () => {
    const csvContent = [
      ['Item', 'Site/Project', 'Type', 'Quantity', 'Unit Price', 'Total Price', 'Status', 'Date'],
      ...filteredRequests.map(r => [
        r.itemName,
        r.siteProject,
        r.requestType,
        r.quantity,
        r.unitPrice || 0,
        r.totalPrice || 0,
        r.status,
        new Date(r.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleCardClick = (cardType: 'all' | 'pending' | 'highest-site' | 'approved') => {
    setActiveCardView(cardType);

    // Expand the relevant sections
    if (cardType === 'pending') {
      setShowApprovedItems(false);
    } else if (cardType === 'approved' || cardType === 'highest-site') {
      setShowApprovedItems(true);
    } else {
      setShowApprovedItems(true);
    }

    // Scroll to items section
    setTimeout(() => {
      const itemsSection = document.getElementById('items-section');
      if (itemsSection) {
        itemsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };



  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="text-white mb-1 sm:mb-2 text-xl sm:text-2xl">Finance Dashboard</h1>
          <p className="text-slate-400 text-sm sm:text-base">Monitor company spending and financial metrics</p>
        </div>
        <button
          onClick={handleExport}
          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 text-sm sm:text-base"
        >
          <Download size={18} className="sm:hidden" />
          <Download size={20} className="hidden sm:block" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 sm:mb-8 bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-800 p-4 sm:p-6">
        <h3 className="text-white mb-3 sm:mb-4 text-base sm:text-lg">Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-slate-400 text-xs sm:text-sm mb-1.5 sm:mb-2">Project/Site</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Projects</option>
              {uniqueProjects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs sm:text-sm mb-1.5 sm:mb-2">Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {uniqueYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs sm:text-sm mb-1.5 sm:mb-2">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Months</option>
              <option value="0">January</option>
              <option value="1">February</option>
              <option value="2">March</option>
              <option value="3">April</option>
              <option value="4">May</option>
              <option value="5">June</option>
              <option value="6">July</option>
              <option value="7">August</option>
              <option value="8">September</option>
              <option value="9">October</option>
              <option value="10">November</option>
              <option value="11">December</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 text-xs sm:text-sm mb-1.5 sm:mb-2">Approval Status</label>
            <select
              value={filterApprovalStatus}
              onChange={(e) => setFilterApprovalStatus(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Approved - Purchasing Processing">Approved by BOD</option>
              <option value="Delivered - Awaiting PM Confirmation">Delivered - Awaiting PM Confirmation</option>
              <option value="Completed - Delivered">Completed - Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6 sm:mb-8">
        {/* Total Expense */}
        <div
          className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg shadow-blue-500/30 cursor-pointer transition-all hover:scale-[1.02] ${activeCardView === 'all' ? 'ring-2 ring-white/50' : ''}`}
          onClick={() => handleCardClick('all')}
        >
          <DollarSign className="text-white/80 mb-4" size={28} />
          <p className="text-blue-100 mb-2">Total Expense</p>
          <p className="text-3xl text-white">Rp {totalExpense.toLocaleString('id-ID')}</p>
        </div>

        {/* Highest Site Expense */}
        <div
          className={`bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-6 shadow-lg shadow-cyan-500/30 cursor-pointer transition-all hover:scale-[1.02] ${activeCardView === 'highest-site' ? 'ring-2 ring-white/50' : ''}`}
          onClick={() => handleCardClick('highest-site')}
        >
          <Package className="text-white/80 mb-4" size={28} />
          <p className="text-cyan-100 mb-2">Highest Site Expense</p>
          <p className="text-lg text-white mb-1">{highestSiteExpense?.[0] || 'N/A'}</p>
          <p className="text-2xl text-white">Rp {(highestSiteExpense?.[1] || 0).toLocaleString('id-ID')}</p>
        </div>

        {/* Approved Requests */}
        <div
          className={`bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg shadow-purple-500/30 cursor-pointer transition-all hover:scale-[1.02] ${activeCardView === 'approved' ? 'ring-2 ring-white/50' : ''}`}
          onClick={() => handleCardClick('approved')}
        >
          <BarChart3 className="text-white/80 mb-4" size={28} />
          <p className="text-purple-100 mb-2">Approved Requests</p>
          <p className="text-3xl text-white">{approvedRequestsCount}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Bar Chart - Spending by Site */}
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-800 p-4 sm:p-6">
          <h3 className="text-white mb-3 sm:mb-4 text-base sm:text-lg">Spending by Site/Project</h3>
          <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="min-w-[300px]">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={siteChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="site"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Line Chart - Monthly Trend */}
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg border border-slate-800 p-4 sm:p-6">
          <h3 className="text-white mb-3 sm:mb-4 text-base sm:text-lg">Monthly Spending Trend</h3>
          <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <div className="min-w-[300px]">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ fill: '#06b6d4', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* APPROVED BY BOD SECTION */}
      <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg border border-blue-500/30 p-4 sm:p-6" id="items-section">
        <div
          className="flex items-center justify-between cursor-pointer mb-4"
          onClick={() => setShowApprovedItems(!showApprovedItems)}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="text-blue-400" size={24} />
            <div>
              <h3 className="text-white text-lg">Approved by BOD</h3>
              <p className="text-slate-400 text-sm">{approvedRequestsCount} items telah disetujui BOD</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-blue-400 mb-1">Total Value</p>
              <p className="text-xl text-blue-400 font-semibold">Rp {totalExpense.toLocaleString('id-ID')}</p>
            </div>
            {showApprovedItems ? <ChevronUp className="text-slate-400" size={24} /> : <ChevronDown className="text-slate-400" size={24} />}
          </div>
        </div>

        {showApprovedItems && filteredRequests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 text-sm">Item Name</th>
                  <th className="text-left py-3 px-4 text-slate-400 text-sm">Site/Project</th>
                  <th className="text-center py-3 px-4 text-slate-400 text-sm">Qty</th>
                  <th className="text-right py-3 px-4 text-slate-400 text-sm">Unit Price</th>
                  <th className="text-right py-3 px-4 text-slate-400 text-sm">Total Price</th>
                  <th className="text-left py-3 px-4 text-slate-400 text-sm">Approved By</th>
                  <th className="text-left py-3 px-4 text-slate-400 text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {(activeCardView === 'highest-site'
                  ? filteredRequests.filter(req => req.siteProject === highestSiteExpense?.[0])
                  : filteredRequests
                ).map((req) => (
                  <tr key={req.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-white">{req.itemName}</td>
                    <td className="py-3 px-4 text-slate-300">{req.siteProject}</td>
                    <td className="py-3 px-4 text-center text-slate-300">{req.quantity}</td>
                    <td className="py-3 px-4 text-right text-slate-300">Rp {req.unitPrice?.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4 text-right text-blue-400 font-semibold">Rp {getApprovedPrice(req).toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4 text-slate-300 text-sm">{req.bodApprovedBy || '-'}</td>
                    <td className="py-3 px-4 text-slate-400 text-sm">{new Date(req.createdAt).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showApprovedItems && filteredRequests.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-500">Belum ada item yang disetujui BOD</p>
          </div>
        )}
      </div>
    </div>
  );
}