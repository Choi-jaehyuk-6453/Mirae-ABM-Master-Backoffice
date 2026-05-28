import React, { useState, useMemo } from 'react';
import { 
  Terminal, ShieldCheck, Key, Plus, ToggleLeft, ToggleRight, 
  Trash2, Edit, Check, Copy, AlertTriangle, Cpu, Globe, Info, HelpCircle
} from 'lucide-react';

export default function IntegrationPortal({ 
  apps, 
  onSaveApp, 
  onDeleteApp 
}) {
  const [selectedApp, setSelectedApp] = useState(null);
  
  // App Creation/Edit Form States
  const [isEditing, setIsEditing] = useState(false);
  const [formAppId, setFormAppId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAuthType, setFormAuthType] = useState('ID/Password');
  const [formIsActive, setFormIsActive] = useState(true);
  
  // Selective Database columns shared checks
  const [checkedColumns, setCheckedColumns] = useState({
    name: true,
    company_name: true,
    site_name: true,
    department: true,
    role: true,
    phone: false,
    email: true,
    status: true,
    authority: false
  });

  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);

  // Column definitions in Korean for descriptive UI
  const columnLabels = {
    name: '이름 (name)',
    company_name: '소속 법인 (company_name)',
    site_name: '사업장명 (site_name)',
    department: '부서 (department)',
    role: '직책 (role)',
    phone: '연락처 (phone) ⚠️ 개인정보',
    email: '이메일 (email)',
    status: '재직상태 (status)',
    authority: '시스템 권한 (authority) ⚠️ 내부정보'
  };

  // Form Reset
  const handleStartNewApp = () => {
    setFormAppId(null);
    setFormName('');
    setFormDesc('');
    setFormAuthType('ID/Password');
    setFormIsActive(true);
    setCheckedColumns({
      name: true,
      company_name: true,
      site_name: true,
      department: true,
      role: true,
      phone: false,
      email: true,
      status: true,
      authority: false
    });
    setIsEditing(true);
  };

  const handleEditApp = (app) => {
    setFormAppId(app.id);
    setFormName(app.name);
    setFormDesc(app.description);
    setFormAuthType(app.auth_type);
    setFormIsActive(app.is_active);
    
    // Map column permissions
    const cols = {
      name: false,
      company_name: false,
      site_name: false,
      department: false,
      role: false,
      phone: false,
      email: false,
      status: false,
      authority: false
    };
    app.columns.forEach(colName => {
      if (cols.hasOwnProperty(colName)) {
        cols[colName] = true;
      }
    });
    
    setCheckedColumns(cols);
    setIsEditing(true);
  };

  const handleToggleActive = (app) => {
    const updated = {
      ...app,
      is_active: !app.is_active
    };
    onSaveApp(updated);
    if (selectedApp && selectedApp.id === app.id) {
      setSelectedApp(updated);
    }
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('앱 이름을 입력해 주세요.');
      return;
    }

    // Capture selected columns
    const columnsToSave = Object.keys(checkedColumns).filter(key => checkedColumns[key]);
    if (columnsToSave.length === 0) {
      alert('최소 1개 이상의 데이터 연동 칼럼을 체크해야 합니다.');
      return;
    }

    const payload = {
      id: formAppId,
      name: formName.trim(),
      description: formDesc.trim(),
      auth_type: formAuthType,
      is_active: formIsActive,
      columns: columnsToSave
    };

    onSaveApp(payload);
    setIsEditing(false);
    
    // Auto focus on the newly saved/edited app details
    setSelectedApp(payload);
  };

  const handleDelete = (appId) => {
    if (window.confirm('정말 이 업무 앱의 연동 허가를 취소하고 폐기하시겠습니까? 관련 데이터 뷰 권한도 상실됩니다.')) {
      onDeleteApp(appId);
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(null);
      }
    }
  };

  // Safe Clean ID helper for naming DB View
  const getCleanAppId = (app) => {
    if (!app || !app.id) return 'app';
    return app.id.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  };

  // DYNAMIC VIEW SQL GENERATION ENGINE
  const generatedViewSql = useMemo(() => {
    if (!selectedApp) return '';
    const cleanId = getCleanAppId(selectedApp);
    const cols = selectedApp.columns.join(', ');
    
    return `/* [보안 연동] '${selectedApp.name}' 전용 DB View 설정 DDL */
CREATE OR REPLACE VIEW v_auth_${cleanId} AS
SELECT 
  emp_id, 
  ${cols}
FROM 
  tb_employees
WHERE 
  status = '재직'; -- 퇴사자/휴직자는 자동으로 통제하여 전송 대상에서 배제
`;
  }, [selectedApp]);

  // SDK / Supabase API Integration Code Blocks
  const generatedJsCode = useMemo(() => {
    if (!selectedApp) return '';
    const cleanId = getCleanAppId(selectedApp);
    const cols = selectedApp.columns.join(', ');
    
    return `import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = '연동_Supabase_프로젝트_URL';
const SUPABASE_ANON_KEY = '연동_보안_Anon_Key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// '${selectedApp.name}' 맞춤형 선별 데이터 실시간 보안 로드
export async function getAuthorizedEmployees() {
  const { data, error } = await supabase
    .from('v_auth_${cleanId}')
    .select('*');

  if (error) {
    console.error('인증 및 데이터 조회 에러:', error.message);
    return [];
  }
  return data; // [${cols}] 컬럼만 완벽 필터링되어 전달됩니다.
}`;
  }, [selectedApp]);

  const handleCopyText = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans text-left text-xs md:text-sm animate-slide-up">
      
      {/* Dynamic Main Layout Portal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Connection Applications list - 5 Columns */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 select-none">
              <ShieldCheck className="text-[#1B3D8E] dark:text-[#3B66C4]" size={18} />
              <h2 className="text-sm md:text-base font-bold text-zinc-900 dark:text-white uppercase tracking-wider m-0">업무 앱 연동 대시보드</h2>
            </div>
            
            {!isEditing && (
              <button
                onClick={handleStartNewApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#1B3D8E] to-[#3B66C4] hover:from-[#153173] hover:to-[#2F53A8] text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
              >
                <Plus size={13} />
                <span>새 앱 연동 등록</span>
              </button>
            )}
          </div>

          {/* Integration Apps Card Grid list */}
          <div className="space-y-3">
            {apps.length > 0 ? (
              apps.map((app) => {
                const isSelected = selectedApp && selectedApp.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      if (!isEditing) setSelectedApp(app);
                    }}
                    className={`corporate-card bg-white dark:bg-zinc-900 border rounded-2xl p-4 cursor-pointer transition-all relative overflow-hidden ${
                      isSelected 
                        ? 'border-[#1B3D8E] dark:border-[#3B66C4] ring-1 ring-[#1B3D8E] dark:ring-[#3B66C4] bg-[#1B3D8E]/[0.02] dark:bg-[#3B66C4]/[0.02]' 
                        : 'border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* Active/Inactive dot in corner */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono font-semibold">{app.auth_type}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(app);
                        }}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
                        title={app.is_active ? '연동 비활성화하기' : '연동 활성화하기'}
                      >
                        {app.is_active ? (
                          <ToggleRight size={20} className="text-[#1B3D8E] dark:text-[#3B66C4]" />
                        ) : (
                          <ToggleLeft size={20} className="text-zinc-350 dark:text-zinc-700" />
                        )}
                      </button>
                    </div>

                    <div className="text-left pr-20">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight m-0">{app.name}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {app.description || '이 연동 앱에 대한 구체적인 설명이 기술되지 않았습니다.'}
                      </p>
                    </div>

                    {/* Shared scopes summary badges */}
                    <div className="mt-3.5 pt-3 border-t border-zinc-150 dark:border-zinc-850 flex flex-wrap gap-1 items-center justify-between">
                      <div className="flex flex-wrap gap-1 flex-1 pr-4">
                        {app.columns.map(col => (
                          <span key={col} className="text-[9px] font-mono px-1.5 py-0.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-400 rounded">
                            {col}
                          </span>
                        ))}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditApp(app);
                          }}
                          className="p-1.5 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors"
                          title="앱 연동 수정"
                        >
                          <Edit size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(app.id);
                          }}
                          className="p-1.5 bg-white hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/20 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 hover:border-rose-200 dark:hover:border-rose-900/30 cursor-pointer transition-colors"
                          title="앱 연동 삭제"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl text-center text-zinc-455 dark:text-zinc-500 font-medium">
                연동 허가된 업무 앱 목록이 비어 있습니다.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Action panel - Form Editor OR Dynamic View SQL publisher - 7 Columns */}
        <div className="lg:col-span-7">
          
          {/* Active Mode: EDIT/ADD FORM */}
          {isEditing ? (
            <div className="corporate-card bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-850">
                <Cpu size={16} className="text-[#1B3D8E] dark:text-[#3B66C4]" />
                <h3 className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white m-0">
                  {formAppId ? '연동 업무 앱 상세 설정 수정' : '새로운 업무 앱 연동 허가 등록'}
                </h3>
              </div>

              <form onSubmit={handleSaveSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-left">
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">업무 앱 이름</label>
                    <input
                      type="text"
                      placeholder="사내 식당 모바일 식권 정산기"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#1B3D8E] dark:focus:border-[#3B66C4] focus:ring-1 focus:ring-[#1B3D8E] dark:focus:ring-[#3B66C4]"
                    />
                  </div>

                  <div className="text-left">
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">앱 고유 인증 방식</label>
                    <select
                      value={formAuthType}
                      onChange={(e) => setFormAuthType(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] dark:focus:border-[#3B66C4] focus:ring-1 focus:ring-[#1B3D8E] dark:focus:ring-[#3B66C4] cursor-pointer"
                    >
                      <option value="ID/Password">ID/Password 통합로그인</option>
                      <option value="4자리 PIN 번호">4자리 PIN 단말기 번호</option>
                      <option value="API Webhook 토큰">API Webhook 통신 토큰</option>
                      <option value="커스텀 OAuth">커스텀 OAuth 2.0</option>
                      <option value="인증 없음">인증 없음 (공개 조회)</option>
                    </select>
                  </div>
                </div>

                <div className="text-left">
                  <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">앱 연동 개요 및 설명</label>
                  <textarea
                    rows="2"
                    placeholder="해당 앱이 사내 마스터 DB 정보를 연동하여 어떠한 직무 처리를 진행하는지 기입해 주십시오."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-zinc-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#1B3D8E] dark:focus:border-[#3B66C4] focus:ring-1 focus:ring-[#1B3D8E] dark:focus:ring-[#3B66C4] resize-none"
                  />
                </div>

                {/* Database selective column sharing policy checklist */}
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-300 border-b border-zinc-200/60 dark:border-zinc-850 pb-2 select-none">
                    <Key size={13} className="text-[#F39C12]" />
                    <span>공통 DB 데이터 선별적 제공 권한 설정 (Selective Scope Policy)</span>
                  </div>
                  
                  <p className="text-[11px] text-zinc-450 dark:text-zinc-500 leading-normal mb-2 select-none text-left">
                    * 체크된 마스터 DB 칼럼 데이터만 해당 앱의 독점 Database View에 제공되며, 체크 해제된 컬럼은 물리적으로 접근이 원천 봉쇄됩니다.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.keys(checkedColumns).map((colKey) => (
                      <label 
                        key={colKey} 
                        className="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850/80 rounded-xl cursor-pointer transition-colors text-left"
                      >
                        <input
                          type="checkbox"
                          checked={checkedColumns[colKey]}
                          onChange={(e) => {
                            setCheckedColumns({
                              ...checkedColumns,
                              [colKey]: e.target.checked
                            });
                          }}
                          className="w-3.5 h-3.5 bg-white dark:bg-zinc-950 text-[#1B3D8E] focus:ring-[#1B3D8E] dark:focus:ring-[#3B66C4] rounded border-zinc-300 dark:border-zinc-700"
                        />
                        <span className={`text-[11px] font-mono leading-tight font-semibold ${
                          checkedColumns[colKey] ? 'text-zinc-800 dark:text-white' : 'text-zinc-400 dark:text-zinc-650'
                        }`}>
                          {columnLabels[colKey]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-350 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gradient-to-r from-[#1B3D8E] to-[#3B66C4] hover:from-[#153173] hover:to-[#2F53A8] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer transition-all"
                  >
                    저장 후 활성화
                  </button>
                </div>
              </form>
            </div>
          ) : selectedApp ? (
            /* Active Mode: DB VIEW SQL GENERATOR & API INSTRUCTIONS */
            <div className="corporate-card bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 md:p-6 space-y-5 shadow-sm text-left">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-850 pb-3">
                <div className="flex items-center gap-2 text-left">
                  <ShieldCheck className="text-emerald-500" size={18} />
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white m-0">'{selectedApp.name}' 보안 연동 패널</h3>
                    <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-mono font-semibold mt-0.5 block">
                      상태: {selectedApp.is_active ? '✅ 연동 활성화' : '❌ 일시 중단'} | 인증: {selectedApp.auth_type}
                    </span>
                  </div>
                </div>
                
                <span className="text-[10px] text-zinc-500 dark:text-zinc-450 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 px-2.5 py-1 rounded-full font-bold select-none">
                  DB View Engine
                </span>
              </div>

              {/* View Concept description box */}
              <div className="p-3.5 bg-blue-500/5 border border-blue-500/15 text-blue-700 dark:text-blue-300 rounded-2xl flex items-start gap-2.5 text-xs text-left leading-normal">
                <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <strong>어떻게 보안이 작동하나요?</strong><br />
                  업무 앱에 마스터 테이블 원본을 그대로 연결하지 않고, 아래의 <strong>보안 데이터베이스 뷰(Secure SQL View)</strong> 쿼리를 실행해 만들어진 가상 테이블을 지급합니다. 
                  해당 앱은 체크 허가된 컬럼 데이터에만 격리 접근할 수 있게 되며, <strong>status가 '재직'인 직원만 자동으로 선별</strong>되어 출력되므로 퇴사자나 내부정보가 유출되지 않습니다.
                </div>
              </div>

              {/* SQL DDL Code block generator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Terminal size={12} className="text-[#1B3D8E] dark:text-[#3B66C4]" />
                    <span>1. Supabase SQL Editor에 실행할 쿼리 (DDL)</span>
                  </span>
                  
                  <button
                    onClick={() => handleCopyText(generatedViewSql, setCopiedSql)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-[10px] text-[#1B3D8E] dark:text-[#3B66C4] font-bold rounded-lg border border-zinc-200/60 dark:border-zinc-700/50 cursor-pointer transition-colors"
                  >
                    {copiedSql ? (
                      <>
                        <Check size={10} className="text-emerald-500" />
                        <span className="text-emerald-500">복사 완료</span>
                      </>
                    ) : (
                      <>
                        <Copy size={10} />
                        <span>SQL 복사</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <pre className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4 text-[10.5px] font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-normal text-left m-0 select-text max-h-40">
                    {generatedViewSql}
                  </pre>
                </div>
              </div>

              {/* JS / REST Integration code block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Globe size={12} className="text-[#F39C12]" />
                    <span>2. 해당 업무용 앱의 소스코드에 삽입할 API 스니펫</span>
                  </span>

                  <button
                    onClick={() => handleCopyText(generatedJsCode, setCopiedJs)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-[10px] text-[#F39C12] font-bold rounded-lg border border-zinc-200/60 dark:border-zinc-700/50 cursor-pointer transition-colors"
                  >
                    {copiedJs ? (
                      <>
                        <Check size={10} className="text-emerald-500" />
                        <span className="text-emerald-500">복사 완료</span>
                      </>
                    ) : (
                      <>
                        <Copy size={10} />
                        <span>코드 복사</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <pre className="w-full bg-slate-950 border border-slate-900 rounded-xl p-4 text-[10.5px] font-mono text-slate-300 overflow-x-auto leading-normal text-left m-0 select-text max-h-40">
                    {generatedJsCode}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            /* Active Mode: EMPTY STATE GREETING */
            <div className="border border-slate-850 bg-slate-900/10 rounded-xl py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <Cpu size={36} className="text-slate-600 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-slate-400">보안 연동 패널 대기 중</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed px-4">
                  좌측의 연동 앱 카드 중 하나를 선택하시거나 [새 앱 연동 등록] 버튼을 눌러 공통 DB 선별 권한 설정 및 전용 보안 DB View 쿼리를 즉석 생성해 주십시오.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
