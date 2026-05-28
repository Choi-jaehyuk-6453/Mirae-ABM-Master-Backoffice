import React, { useState, useMemo } from 'react';
import { 
  Users, UserCheck, UserPlus, UserMinus, 
  Search, SlidersHorizontal, RotateCcw, 
  Plus, FileSpreadsheet, Edit2, ShieldAlert
} from 'lucide-react';


const isContractExpiringSoon = (endDateStr) => {
  if (!endDateStr) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(endDateStr);
    endDate.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  } catch (e) {
    return false;
  }
};

export default function Dashboard({ 

  employees, 
  onAddClick, 
  onEditClick, 
  onExcelImportClick, 
  onQuickSoftDelete,
  statusHistory = []
}) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('ALL');
  const [selectedSite, setSelectedSite] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Dynamic values extracted from database to populate filter dropdowns
  const uniqueCompanies = useMemo(() => {
    const companies = employees.map(e => e.company_name).filter(Boolean);
    return ['ALL', ...new Set(companies)];
  }, [employees]);

  const uniqueSites = useMemo(() => {
    const sites = employees.map(e => e.site_name).filter(Boolean);
    return ['ALL', ...new Set(sites)];
  }, [employees]);

  const uniqueDepts = useMemo(() => {
    const depts = employees.map(e => e.department).filter(Boolean);
    return ['ALL', ...new Set(depts)];
  }, [employees]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === '재직').length;
    const onLeave = employees.filter(e => e.status === '휴직').length;
    const retired = employees.filter(e => e.status === '퇴사').length;
    return { total, active, onLeave, retired };
  }, [employees]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompany = selectedCompany === 'ALL' || emp.company_name === selectedCompany;
      const matchesSite = selectedSite === 'ALL' || emp.site_name === selectedSite;
      const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;
      const matchesStatus = selectedStatus === 'ALL' || emp.status === selectedStatus;

      return matchesSearch && matchesCompany && matchesSite && matchesDept && matchesStatus;
    });
  }, [employees, searchTerm, selectedCompany, selectedSite, selectedDept, selectedStatus]);

  // History filter states
  const [historySearch, setHistorySearch] = useState('');

  const filteredHistory = useMemo(() => {
    return statusHistory.filter(log => {
      const matchText = historySearch.toLowerCase();
      return String(log.name).toLowerCase().includes(matchText) ||
             String(log.company_name).toLowerCase().includes(matchText) ||
             String(log.status_reason || '').toLowerCase().includes(matchText) ||
             String(log.new_status || '').toLowerCase().includes(matchText);
    });
  }, [statusHistory, historySearch]);

  // Clear all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCompany('ALL');
    setSelectedSite('ALL');
    setSelectedDept('ALL');
    setSelectedStatus('ALL');
  };

  const handleSoftDelete = (emp) => {
    if (emp.status === '퇴사') return;
    
    const confirmMessage = `[퇴사 처리] 정말로 ${emp.name} 사원(${emp.department})을 퇴사(소프트 삭제) 처리하시겠습니까?\n\n이 작업은 데이터를 삭제하지 않으며, 재직상태를 '퇴사'로 변경해 보관합니다.`;
    if (window.confirm(confirmMessage)) {
      onQuickSoftDelete(emp.emp_id);
    }
  };

  return (
    <div className="space-y-4 font-sans text-xs md:text-sm">
      
      {/* 1. Statistics Cards Widget Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <div className="corporate-card p-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px] font-semibold uppercase tracking-wider block">전체 등록 인원</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#1B3D8E] dark:text-[#3B66C4] mt-1 block tracking-tight">{stats.total}명</span>
          </div>
          <div className="p-2 bg-[#1B3D8E]/5 dark:bg-[#3B66C4]/10 rounded-xl text-[#1B3D8E] dark:text-[#3B66C4]">
            <Users size={16} />
          </div>
        </div>

        {/* Active Employees */}
        <div className="corporate-card p-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-emerald-600 dark:text-emerald-500/80 text-[10px] font-semibold uppercase tracking-wider block">재직 중</span>
            <span className="text-xl md:text-2xl font-extrabold text-emerald-600 dark:text-emerald-500 mt-1 block tracking-tight">{stats.active}명</span>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
            <UserCheck size={16} />
          </div>
        </div>

        {/* On Leave Employees */}
        <div className="corporate-card p-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[#F39C12] text-[10px] font-semibold uppercase tracking-wider block">휴직 중</span>
            <span className="text-xl md:text-2xl font-extrabold text-[#F39C12] mt-1 block tracking-tight">{stats.onLeave}명</span>
          </div>
          <div className="p-2 bg-[#F39C12]/10 rounded-xl text-[#F39C12]">
            <UserPlus size={16} />
          </div>
        </div>

        {/* Resigned Employees (Soft deleted) */}
        <div className="corporate-card p-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider block">퇴사자 (소프트 삭제)</span>
            <span className="text-xl md:text-2xl font-extrabold text-zinc-500 dark:text-zinc-400 mt-1 block tracking-tight">{stats.retired}명</span>
          </div>
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl">
            <UserMinus size={16} />
          </div>
        </div>
      </div>

      {/* 2. Soft-delete Safe Guide Banner */}
      <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-450 rounded-2xl flex items-start gap-2.5 text-xs text-left leading-relaxed shadow-sm">
        <ShieldAlert size={15} className="text-[#F39C12] shrink-0 mt-0.5" />
        <div>
          <strong>데이터 안전성 안내:</strong> 본 시스템은 안전한 데이터 보존을 위해 완전 삭제(Delete) 기능을 미지원합니다. 퇴사자는 우측 액션란의 <strong className="text-[#F39C12]">퇴사 처리</strong> 단축 아이콘을 클릭하거나, 수정 모달 내 상태를 <strong>'퇴사'</strong>로 지정하여 처리해 주십시오.
        </div>
      </div>

      {/* 3. Filters and Action Header Control Panel */}
      <div className="corporate-card p-4 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-1.5 text-left select-none">
            <SlidersHorizontal size={14} className="text-zinc-400" />
            <h3 className="text-xs font-bold text-zinc-850 dark:text-white uppercase tracking-wider m-0">스마트 다중 연계 필터</h3>
          </div>

          {/* Core Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExcelImportClick}
              className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 font-semibold text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer shadow-xs transition-colors"
            >
              <FileSpreadsheet size={13} className="text-emerald-500" />
              <span>엑셀 일괄 등록</span>
            </button>
            
            <button
              onClick={onAddClick}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#1B3D8E] to-[#3B66C4] hover:from-[#153173] hover:to-[#2F53A8] text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
            >
              <Plus size={13} />
              <span>신규 직원 등록</span>
            </button>
          </div>
        </div>

        {/* High-density layout search filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Term (Name) */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="이름으로 통합 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-zinc-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E]"
            />
          </div>

          {/* Company Selection */}
          <div className="text-left">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] cursor-pointer"
            >
              <option value="ALL">법인 전체</option>
              {uniqueCompanies.filter(c => c !== 'ALL').map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>

          {/* Site Selection */}
          <div className="text-left">
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] cursor-pointer"
            >
              <option value="ALL">사업장 전체</option>
              {uniqueSites.filter(s => s !== 'ALL').map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>

          {/* Department Selection */}
          <div className="text-left">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] cursor-pointer"
            >
              <option value="ALL">부서 전체</option>
              {uniqueDepts.filter(d => d !== 'ALL').map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Combined Status & Reset */}
          <div className="flex gap-2 items-center">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] cursor-pointer"
            >
              <option value="ALL">재직상태 전체</option>
              <option value="재직">재직</option>
              <option value="휴직">휴직</option>
              <option value="퇴사">퇴사</option>
            </select>
            
            <button
              onClick={handleResetFilters}
              className="p-1.5 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl cursor-pointer transition-colors"
              title="검색 조건 초기화"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Grid Spreadsheet-like Table Card */}
      <div className="corporate-card shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-450 font-semibold tracking-wide select-none">
                <th className="py-3.5 px-4 font-mono w-16 text-center">사번</th>
                <th className="py-3.5 px-4">이름</th>
                <th className="py-3.5 px-4">법인명</th>
                <th className="py-3.5 px-4">사업장명</th>
                <th className="py-3.5 px-4">부서</th>
                <th className="py-3.5 px-4">직책</th>
                <th className="py-3.5 px-4">연락처</th>
                <th className="py-3.5 px-4">이메일</th>
                <th className="py-3.5 px-4 w-24 text-center">입사일</th>
                <th className="py-3.5 px-4 w-28 text-center">계약기간</th>
                <th className="py-3.5 px-4 w-20 text-center">재직상태</th>
                <th className="py-3.5 px-4 w-24 text-center">접근권한</th>
                <th className="py-3.5 px-4 w-24 text-center">관리 액션</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <tr 
                    key={emp.emp_id} 
                    className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors duration-150 ${emp.status === '퇴사' ? 'opacity-50 bg-zinc-100/10' : ''}`}
                  >
                    {/* Emp ID */}
                    <td className="py-2.5 px-4 font-mono font-bold text-zinc-400 dark:text-zinc-500 text-center">{emp.emp_id}</td>
                    
                    {/* Name */}
                    <td className="py-2.5 px-4 font-semibold text-zinc-900 dark:text-white">{emp.name}</td>
                    
                    {/* Company Name */}
                    <td className="py-2.5 px-4 text-[#1B3D8E] dark:text-[#3B66C4] font-semibold">{emp.company_name}</td>
                    
                    {/* Site Name */}
                    <td className="py-2.5 px-4 text-zinc-700 dark:text-zinc-300">{emp.site_name}</td>
                    
                    {/* Department */}
                    <td className="py-2.5 px-4 text-zinc-700 dark:text-zinc-300">{emp.department}</td>
                    
                    {/* Role */}
                    <td className="py-2.5 px-4 text-zinc-500 dark:text-zinc-450 font-medium">{emp.role}</td>
                    
                    {/* Phone */}
                    <td className="py-2.5 px-4 font-mono text-zinc-600 dark:text-zinc-350">{emp.phone}</td>
                    
                    {/* Email */}
                    <td className="py-2.5 px-4 font-mono text-zinc-500 dark:text-zinc-450 truncate max-w-[150px]" title={emp.email}>{emp.email || '-'}</td>
                    
                    {/* Join Date (Hire Date) */}
                    <td className="py-2.5 px-4 text-center font-mono text-zinc-650 dark:text-zinc-350 select-none">
                      {emp.hire_date || '-'}
                    </td>

                    {/* Contract Period */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex flex-col items-center justify-center select-none">
                        {emp.contract_type !== '계약직' ? (
                          <span className="inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            정규직
                          </span>
                        ) : (
                          (() => {
                            const isExpiring = isContractExpiringSoon(emp.contract_end_date);
                            const displayDate = emp.contract_end_date || '미정';
                            return (
                              <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded border ${
                                isExpiring 
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse' 
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                              }`}>
                                {displayDate} {isExpiring && '(만료 임박)'}
                              </span>
                            );
                          })()
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-4 text-center">

                      <div className="flex flex-col items-center justify-center">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          emp.status === '재직' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                            : emp.status === '휴직'
                            ? 'bg-[#F39C12]/10 text-[#F39C12] border-[#F39C12]/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                        }`}>
                          {emp.status}
                        </span>
                        
                        {/* Conditional status metadata details */}
                        {emp.status === '휴직' && (
                          <div className="text-[9px] text-[#F39C12] mt-1 select-none font-sans font-bold whitespace-nowrap leading-tight text-center">
                            <div>{emp.status_reason || '사유 미기입'}</div>
                            <div className="text-[8px] text-zinc-400 dark:text-zinc-550 font-mono mt-0.5 font-normal">
                              ({emp.leave_start_date && emp.leave_end_date ? `${emp.leave_start_date.slice(2)}~${emp.leave_end_date.slice(2)}` : '기간 미지정'})
                            </div>
                          </div>
                        )}

                        {emp.status === '퇴사' && (
                          <div className="text-[9px] text-rose-500/90 mt-1 select-none font-sans font-bold whitespace-nowrap leading-tight text-center">
                            <div>{emp.status_reason || '사유 미기입'}</div>
                            <div className="text-[8px] text-zinc-400 dark:text-zinc-550 font-mono mt-0.5 font-normal">
                              ({emp.status_date ? emp.status_date.slice(2) : '일자 미지정'})
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Authority Badge */}
                    <td className="py-2.5 px-4 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded border ${
                        emp.authority === '본사관리자'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                          : emp.authority === '현장관리자'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {emp.authority}
                      </span>
                    </td>
                    
                    {/* Action Panel */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit Button */}
                        <button
                          onClick={() => onEditClick(emp)}
                          className="p-1 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors"
                          title="상세 수정"
                        >
                          <Edit2 size={11} />
                        </button>
                        
                        {/* Soft Delete (Resign) Button */}
                        <button
                          onClick={() => handleSoftDelete(emp)}
                          disabled={emp.status === '퇴사'}
                          className={`p-1 rounded-lg border transition-colors cursor-pointer ${
                            emp.status === '퇴사'
                              ? 'bg-zinc-50 dark:bg-zinc-950 text-zinc-300 dark:text-zinc-700 border-zinc-200/50 dark:border-zinc-850 cursor-not-allowed shadow-none'
                              : 'bg-white hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/20 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 border-zinc-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-900/30'
                          }`}
                          title={emp.status === '퇴사' ? '이미 퇴사 처리됨' : '퇴사 처리 (소프트 삭제)'}
                        >
                          <UserMinus size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="py-10 text-center text-zinc-400 font-medium">
                    조회된 임직원이 존재하지 않습니다.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

        {/* Dynamic Footer Counter */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between text-[11px] text-zinc-450 font-medium select-none">
          <span>
            조회 결과: <strong>{filteredEmployees.length}</strong> / 전체 사원: <strong>{employees.length}</strong>명
          </span>
          <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[10px]">
            Master Data Control Portal
          </span>
        </div>
      </div>

      {/* 5. 인사 상태 변동 이력 로그 조회 포털 */}
      <div className="corporate-card shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mt-6 text-left">
        {/* Header */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 px-5 py-4 border-b border-zinc-200 dark:border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left select-none">
            <h3 className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 m-0">
              <span className="w-1.5 h-3 bg-[#1B3D8E] dark:bg-[#3B66C4] rounded-sm block"></span>
              <span>인사 상태 변동 이력 로그 (Audit Logs)</span>
            </h3>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wide mt-1 block">
              Real-time Employment Status Change History Registry
            </span>
          </div>

          {/* History Search bar */}
          <div className="relative w-full sm:w-64">
            <Search size={12} className="absolute left-3 top-2 text-zinc-400" />
            <input
              type="text"
              placeholder="이름, 법인, 사유로 검색..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-8 pr-3 py-1 text-xs text-zinc-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E]"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-450 font-semibold tracking-wide select-none">
                <th className="py-2.5 px-4 font-mono w-40">기록 일시</th>
                <th className="py-2.5 px-4">사원명 (ID)</th>
                <th className="py-2.5 px-4">소속 법인</th>
                <th className="py-2.5 px-4 w-40 text-center">변동 내용</th>
                <th className="py-2.5 px-4">변경 사유</th>
                <th className="py-2.5 px-4 w-28 text-center">적용 일자</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((log) => (
                  <tr key={log.history_id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/5 transition-colors">
                    {/* Timestamp */}
                    <td className="py-2.5 px-4 font-mono text-zinc-450 dark:text-zinc-500">
                      {log.updated_at ? new Date(log.updated_at).toLocaleString('ko-KR') : '-'}
                    </td>
                    
                    {/* Employee Name (ID) */}
                    <td className="py-2.5 px-4 font-semibold text-zinc-800 dark:text-white">
                      {log.name} <span className="text-[10px] text-zinc-400 font-mono font-normal">(#{log.emp_id})</span>
                    </td>
                    
                    {/* Company */}
                    <td className="py-2.5 px-4 text-[#1B3D8E] dark:text-[#3B66C4] font-medium">
                      {log.company_name}
                    </td>
                    
                    {/* Action flow */}
                    <td className="py-2.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                          log.previous_status === '재직'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : log.previous_status === '휴직'
                            ? 'bg-[#F39C12]/10 text-[#F39C12] border-[#F39C12]/20'
                            : log.previous_status === '퇴사'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }`}>
                          {log.previous_status}
                        </span>
                        <span className="text-zinc-400 font-bold font-mono">→</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                          log.new_status === '재직'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : log.new_status === '휴직'
                            ? 'bg-[#F39C12]/10 text-[#F39C12] border-[#F39C12]/20'
                            : log.new_status === '퇴사'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                        }`}>
                          {log.new_status}
                        </span>
                      </div>
                    </td>
                    
                    {/* Reason */}
                    <td className="py-2.5 px-4 text-zinc-650 dark:text-zinc-350">
                      {log.status_reason || '-'}
                    </td>
                    
                    {/* Effective Date */}
                    <td className="py-2.5 px-4 text-center font-mono text-zinc-500">
                      {log.status_date || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-zinc-455 font-medium">
                    기록된 상태 변동 이력이 존재하지 않습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Counter */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between text-[10px] text-zinc-400 font-medium">
          <span>
            이력 로그 수: <strong>{filteredHistory.length}</strong>건
          </span>
          <span className="font-mono text-zinc-450">
            System Activity Log Audit Trail
          </span>
        </div>
      </div>

    </div>
  );
}
