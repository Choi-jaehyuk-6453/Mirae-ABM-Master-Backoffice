import React, { useState, useEffect } from 'react';
import { Database, Sparkles, LogOut, Users, Cpu, AlertTriangle, ShieldCheck } from 'lucide-react';
import { db } from './utils/db';

// Component Imports
import ConnectionModal from './components/ConnectionModal';
import Dashboard from './components/Dashboard';
import EmployeeModal from './components/EmployeeModal';
import ExcelImportModal from './components/ExcelImportModal';
import IntegrationPortal from './components/IntegrationPortal';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState('employees'); // 'employees' or 'integrations'
  // Remove dark mode class and saved preference on boot to guarantee pure light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('corporate_theme');
  }, []);

  // Data states
  const [employees, setEmployees] = useState([]);
  const [apps, setApps] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal & Toast states
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Try auto-connecting to Supabase on boot
  useEffect(() => {
    const checkAutoConnect = async () => {
      setLoading(true);
      const connected = await db.tryAutoConnect();
      setLoading(false);
      
      if (connected) {
        setIsConnected(true);
        setIsDemoMode(false);
        showToast('Supabase 실시간 데이터베이스에 자동 연결되었습니다.', 'success');
        loadAllData();
      }
    };
    checkAutoConnect();
  }, []);

  // Load all tables
  const loadAllData = async () => {
    try {
      const empData = await db.getEmployees();
      const appData = await db.getApps();
      const historyData = await db.getStatusHistory();
      setEmployees(empData);
      setApps(appData);
      setStatusHistory(historyData);
    } catch (err) {
      console.error(err);
      showToast('데이터 조회 중 오류가 발생했습니다.', 'error');
    }
  };

  // Trigger reloading whenever database mode is toggled
  useEffect(() => {
    if (isConnected || isDemoMode) {
      loadAllData();
    }
  }, [isConnected, isDemoMode]);

  // Connection Handlers
  const handleConnected = () => {
    setIsConnected(true);
    setIsDemoMode(false);
    showToast('Supabase 실시간 데이터베이스 연동에 성공했습니다!', 'success');
  };

  const handleStartDemo = () => {
    setIsConnected(false);
    setIsDemoMode(true);
    showToast('시뮬레이션 데모 모드로 입장했습니다. (로컬 데이터 적용)', 'info');
  };

  const handleDisconnect = () => {
    db.disconnect();
    setIsConnected(false);
    setIsDemoMode(false);
    setEmployees([]);
    setApps([]);
    setStatusHistory([]);
    showToast('데이터베이스 연동이 해제되었습니다.', 'info');
  };

  // Employee CRUD Handlers
  const handleSaveEmployee = async (employeeData, overwriteEmpId) => {
    try {
      const targetId = overwriteEmpId || employeeToEdit?.emp_id;
      if (targetId) {
        const updated = await db.updateEmployee(targetId, employeeData);
        showToast(`사원 '${updated.name}' 정보가 업데이트(동일인 조정) 되었습니다.`, 'success');
      } else {
        const created = await db.insertEmployee(employeeData);
        showToast(`신규 사원 '${created.name}' 정보가 등록되었습니다.`, 'success');
      }
      setIsEmployeeModalOpen(false);
      setEmployeeToEdit(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast(err.message || '저장 처리 중 에러가 발생했습니다.', 'error');
    }
  };

  const handleQuickSoftDelete = async (empId) => {
    try {
      const targetEmp = employees.find(e => e.emp_id === empId);
      if (!targetEmp) return;

      const reason = window.prompt(`사원 '${targetEmp.name}'을 퇴사 처리합니다. 퇴사 사유를 기입해 주십시오:`, '자진퇴사');
      if (reason === null) return; // User cancelled

      const updated = await db.updateEmployee(empId, { 
        ...targetEmp, 
        status: '퇴사',
        status_reason: reason || '자진퇴사',
        status_date: new Date().toISOString().split('T')[0]
      });
      showToast(`사원 '${updated.name}' 퇴사(소프트 삭제) 처리가 완료되었습니다.`, 'success');
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast('퇴사 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleExcelImport = async (rows) => {
    try {
      setLoading(true);
      const inserted = await db.bulkInsertEmployees(rows);
      setLoading(false);
      showToast(`성공한 ${inserted.length}명의 사원 정보가 일괄 등록 완료되었습니다.`, 'success');
      loadAllData();
    } catch (err) {
      setLoading(false);
      console.error(err);
      const errMsg = err.message || err.details || JSON.stringify(err);
      showToast(`엑셀 대용량 등록 오류: ${errMsg}`, 'error');
    }
  };

  // External App Integration Handlers
  const handleSaveApp = async (appData) => {
    try {
      const saved = await db.saveApp(appData);
      showToast(`연동 앱 '${saved.name}' 정책이 안전하게 동기화되었습니다.`, 'success');
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast('앱 연동 설정 저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeleteApp = async (appId) => {
    try {
      await db.deleteApp(appId);
      showToast('업무 앱 연동 허가가 영구 취소되었습니다.', 'info');
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast('앱 삭제 처리 중 오류가 발생했습니다.', 'error');
    }
  };

  // Site name / Department lists extractor for suggestions inside EmployeeModal
  const existingSites = employees.map(e => e.site_name).filter(Boolean);
  const existingDepts = employees.map(e => e.department).filter(Boolean);

  if (!isConnected && !isDemoMode) {
    return (
      <ConnectionModal 
        onConnected={handleConnected} 
        onStartDemo={handleStartDemo} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 flex flex-col font-sans select-none relative pb-16 transition-colors duration-200">
      
      {/* A. Top Navigation Bar */}
      <header className="corporate-header sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <img src="/logo.png" className="h-8 md:h-9 w-auto object-contain bg-transparent select-none" alt="Mirae ABM Logo" />
          </div>
          <div className="text-left">
            <h1 className="text-sm md:text-base font-extrabold text-[#1B3D8E] dark:text-[#3B66C4] tracking-tight m-0 uppercase font-display">
              통합 마스터 백오피스
            </h1>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-wide block mt-0.5 select-none">
              HR Unified Master Management Console
            </span>
          </div>
        </div>

        {/* Database Status Indicator & Theme Switcher */}
        <div className="flex items-center gap-3">
          {/* Active status */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
            isConnected
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-[#F39C12]/10 text-[#F39C12] border-[#F39C12]/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-[#F39C12] animate-pulse'
            }`}></span>
            <span>
              {isConnected ? 'Supabase 실시간 연동' : '시뮬레이션 데모'}
            </span>
          </div>



          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            title="연동 해제 및 연결 정보 변경"
          >
            <LogOut size={13} />
            <span className="hidden md:inline">연동 해제</span>
          </button>
        </div>
      </header>

      {/* B. Core Layout Content */}
      <main className="max-w-7xl w-full mx-auto px-4 md:px-6 py-6 flex-1 flex flex-col gap-5 z-10">
        
        {/* TAB Switch Navigator */}
        <div className="flex bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-xl border border-zinc-200/40 dark:border-zinc-800/40 self-start">
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs md:text-sm font-bold cursor-pointer transition-all ${
              activeTab === 'employees'
                ? 'bg-white dark:bg-zinc-800 text-[#1B3D8E] dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/30'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100'
            }`}
          >
            <Users size={14} />
            <span>인사 마스터 데이터 관리</span>
          </button>
          
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs md:text-sm font-bold cursor-pointer transition-all ${
              activeTab === 'integrations'
                ? 'bg-white dark:bg-zinc-800 text-[#1B3D8E] dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/30'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100'
            }`}
          >
            <Cpu size={14} />
            <span>업무 앱 연동 및 선별 설정</span>
          </button>
        </div>

        {/* Tab contents router */}
        <div className="flex-1">
          {activeTab === 'employees' ? (
            <Dashboard
              employees={employees}
              onAddClick={() => {
                setEmployeeToEdit(null);
                setIsEmployeeModalOpen(true);
              }}
              onEditClick={(emp) => {
                setEmployeeToEdit(emp);
                setIsEmployeeModalOpen(true);
              }}
              onExcelImportClick={() => setIsExcelModalOpen(true)}
              onQuickSoftDelete={handleQuickSoftDelete}
              statusHistory={statusHistory}
            />
          ) : (
            <IntegrationPortal
              apps={apps}
              onSaveApp={handleSaveApp}
              onDeleteApp={handleDeleteApp}
            />
          )}
        </div>
      </main>

      {/* C. Interactive Modals Containers */}
      
      {/* 1. Add / Edit Modal */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEmployeeToEdit(null);
        }}
        onSave={handleSaveEmployee}
        employeeToEdit={employeeToEdit}
        existingSites={existingSites}
        existingDepts={existingDepts}
      />

      {/* 2. Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImport={handleExcelImport}
        employees={employees}
      />

      {/* D. Premium Toast Alert Notification Popup */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl border shadow-lg z-50 animate-slide-up flex items-center gap-2.5 max-w-sm text-left leading-normal text-xs sm:text-sm ${
          toast.type === 'success'
            ? 'bg-white dark:bg-zinc-900 border-emerald-500/30 text-zinc-700 dark:text-zinc-300'
            : toast.type === 'error'
            ? 'bg-white dark:bg-zinc-900 border-rose-500/30 text-rose-600 dark:text-rose-400'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
        }`}>
          <div className="shrink-0">
            {toast.type === 'success' ? (
              <ShieldCheck size={16} className="text-emerald-500" />
            ) : toast.type === 'error' ? (
              <AlertTriangle size={16} className="text-rose-500" />
            ) : (
              <Sparkles size={16} className="text-[#F39C12]" />
            )}
          </div>
          <div className="flex-1 font-medium">
            {toast.message}
          </div>
        </div>
      )}

      {/* Loading Overlay spinner */}
      {loading && (
        <div className="fixed inset-0 bg-zinc-950/20 dark:bg-zinc-950/60 backdrop-blur-[1px] z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-lg flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-zinc-200 dark:border-zinc-800 border-t-[#1B3D8E] rounded-full animate-spin"></div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold select-none">데이터 전송 중...</span>
          </div>
        </div>
      )}

    </div>
  );
}
