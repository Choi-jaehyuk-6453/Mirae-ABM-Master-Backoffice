import React, { useState, useEffect } from 'react';
import { X, User, Building, MapPin, Briefcase, Phone, Mail, Shield, Power, Calendar, FileText } from 'lucide-react';
import { db } from '../utils/db';


export default function EmployeeModal({ 
  isOpen, 
  onClose, 
  onSave, 
  employeeToEdit, 
  existingSites = [], 
  existingDepts = [] 
}) {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('미래에이비엠');
  const [siteName, setSiteName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('재직');
  const [authority, setAuthority] = useState('일반사용자');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Contract Details States
  const [hireDate, setHireDate] = useState('');
  const [contractType, setContractType] = useState('정규직');
  const [contractEndDate, setContractEndDate] = useState('');
  
  // Status Details States
  const [statusReason, setStatusReason] = useState('');
  const [statusDate, setStatusDate] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  
  // Duplicate warning states
  const [duplicateFound, setDuplicateFound] = useState(null);
  
  // Suggestion active states
  const [siteSuggestions, setSiteSuggestions] = useState([]);
  const [deptSuggestions, setDeptSuggestions] = useState([]);
  const [showSiteSuggestions, setShowSiteSuggestions] = useState(false);
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false);

  useEffect(() => {
    if (employeeToEdit) {
      setName(employeeToEdit.name || '');
      setCompanyName(employeeToEdit.company_name || '미래에이비엠');
      setSiteName(employeeToEdit.site_name || '');
      setDepartment(employeeToEdit.department || '');
      setRole(employeeToEdit.role || '');
      setPhone(employeeToEdit.phone || '');
      setEmail(employeeToEdit.email || '');
      setStatus(employeeToEdit.status || '재직');
      setAuthority(employeeToEdit.authority || '일반사용자');
      setStatusReason(employeeToEdit.status_reason || '');
      setStatusDate(employeeToEdit.status_date || '');
      setLeaveStartDate(employeeToEdit.leave_start_date || '');
      setLeaveEndDate(employeeToEdit.leave_end_date || '');
      setHireDate(employeeToEdit.hire_date || '');
      setContractType(employeeToEdit.contract_type || '정규직');
      setContractEndDate(employeeToEdit.contract_end_date || '');
    } else {
      setName('');
      setCompanyName('미래에이비엠');
      setSiteName('');
      setDepartment('');
      setRole('');
      setPhone('');
      setEmail('');
      setStatus('재직');
      setAuthority('일반사용자');
      setStatusReason('');
      setStatusDate('');
      setLeaveStartDate('');
      setLeaveEndDate('');
      setHireDate(new Date().toISOString().split('T')[0]); // Default to today
      setContractType('정규직');
      setContractEndDate('');
    }
    setErrorMsg('');
    setDuplicateFound(null);
  }, [employeeToEdit, isOpen]);

  // Set default status date when changing status
  useEffect(() => {
    if (isOpen) {
      if (status !== '재직' && !statusDate) {
        setStatusDate(new Date().toISOString().split('T')[0]);
      }
      if (status === '휴직' && !leaveStartDate) {
        setLeaveStartDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [status, isOpen]);

  // Automatically force company to '미래에이비엠' if siteName is '본사'
  useEffect(() => {
    if (siteName.trim() === '본사') {
      setCompanyName('미래에이비엠');
    }
  }, [siteName]);

  const handlePhoneChange = (e) => {
    let raw = e.target.value.replace(/[^0-9]/g, '');
    let formatted = '';
    if (raw.length <= 3) {
      formatted = raw;
    } else if (raw.length <= 7) {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else {
      formatted = `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 11)}`;
    }
    setPhone(formatted);
  };

  const handleSiteChange = (val) => {
    setSiteName(val);
    if (val.trim()) {
      const filtered = existingSites.filter(s => 
        s.toLowerCase().includes(val.toLowerCase()) && s !== 'ALL'
      );
      setSiteSuggestions(filtered);
      setShowSiteSuggestions(true);
    } else {
      setSiteSuggestions([]);
      setShowSiteSuggestions(false);
    }
  };

  const handleDeptChange = (val) => {
    setDepartment(val);
    if (val.trim()) {
      const filtered = existingDepts.filter(d => 
        d.toLowerCase().includes(val.toLowerCase()) && d !== 'ALL'
      );
      setDeptSuggestions(filtered);
      setShowDeptSuggestions(true);
    } else {
      setDeptSuggestions([]);
      setShowDeptSuggestions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) return setErrorMsg('이름을 입력해 주세요.');
    if (!siteName.trim()) return setErrorMsg('사업장명을 입력해 주세요.');
    if (!department.trim()) return setErrorMsg('부서명을 입력해 주세요.');
    if (!role.trim()) return setErrorMsg('직책을 입력해 주세요.');
    if (!phone.trim()) return setErrorMsg('연락처를 입력해 주세요.');
    
    const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return setErrorMsg('올바른 연락처 형식이 아닙니다. (예: 010-1234-5678)');
    }
 
    if (email.trim() && !email.includes('@')) {
      return setErrorMsg('올바른 이메일 형식이 아닙니다. (@ 누락)');
    }

    if (status === '휴직') {
      if (!statusReason) return setErrorMsg('휴직 사유를 입력하거나 선택해 주세요.');
      if (!leaveStartDate) return setErrorMsg('휴직 시작일을 입력해 주세요.');
      if (!leaveEndDate) return setErrorMsg('휴직 종료일을 입력해 주세요.');
      if (leaveStartDate > leaveEndDate) return setErrorMsg('휴직 시작일은 종료일보다 이전이어야 합니다.');
    } else if (status === '퇴사') {
      if (!statusReason) return setErrorMsg('퇴사 사유를 입력하거나 선택해 주세요.');
      if (!statusDate) return setErrorMsg('퇴사일을 입력해 주세요.');
    }

    if (!hireDate) return setErrorMsg('입사일을 입력해 주세요.');
    if (contractType === '계약직' && !contractEndDate) return setErrorMsg('계약 종료일을 입력해 주세요.');
    if (contractType === '계약직' && hireDate > contractEndDate) return setErrorMsg('계약 종료일은 입사일보다 이후여야 합니다.');

    const payload = {
      name: name.trim(),
      company_name: companyName,
      site_name: siteName.trim(),
      department: department.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email.trim(),
      status,
      authority,
      status_reason: status !== '재직' ? statusReason : '',
      status_date: status === '퇴사' ? statusDate : (status === '휴직' ? leaveStartDate : ''),
      leave_start_date: status === '휴직' ? leaveStartDate : '',
      leave_end_date: status === '휴직' ? leaveEndDate : '',
      hire_date: hireDate,
      contract_type: contractType,
      contract_end_date: contractType === '계약직' ? contractEndDate : ''
    };

    // Check duplicate employee if it is a new registration
    if (!employeeToEdit && !duplicateFound) {
      try {
        const dup = await db.checkDuplicateEmployee(payload.name, payload.phone, payload.email);
        if (dup) {
          setDuplicateFound(dup);
          return;
        }
      } catch (err) {
        console.error('Duplicate checking error:', err);
      }
    }

    onSave(payload);
  };

  if (!isOpen) return null;

  if (duplicateFound) {
    return (
      <div className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
        <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-slide-up text-left">
          {/* Header */}
          <div className="bg-rose-50 dark:bg-rose-950/10 px-5 py-3.5 border-b border-rose-100 dark:border-rose-900/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-left text-rose-700 dark:text-rose-455">
              <span className="font-bold flex items-center gap-1.5">⚠️ 동일인 중복 감지 경고</span>
            </div>
            <button
              onClick={() => setDuplicateFound(null)}
              className="p-1 text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 rounded-lg hover:bg-rose-100/50 dark:hover:bg-rose-900/30 cursor-pointer transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs md:text-sm">
            <div className="bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl space-y-2 leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                입력하신 이름 <strong>'{name}'</strong>과 연락처 <strong>'{phone}'</strong>가 기존에 등록된 사원과 일치합니다. 
                공동 DB의 데이터 정합성을 유지하기 위해 어떻게 조율하시겠습니까?
              </p>
            </div>

            {/* Comparison cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl space-y-2 bg-zinc-50 dark:bg-zinc-950/20">
                <h4 className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">기존 등록 데이터</h4>
                <div className="space-y-1 text-xs">
                  <div>사번: <span className="font-mono font-bold text-zinc-800 dark:text-white">#{duplicateFound.emp_id}</span></div>
                  <div>이름: <strong className="text-zinc-900 dark:text-white">{duplicateFound.name}</strong></div>
                  <div>소속: <span className="text-[#1B3D8E] dark:text-[#3B66C4] font-semibold">{duplicateFound.company_name} · {duplicateFound.site_name}</span></div>
                  <div>부서/직책: <span>{duplicateFound.department} / {duplicateFound.role}</span></div>
                  <div>연락처: <span className="font-mono">{duplicateFound.phone}</span></div>
                  <div>상태: <span className="text-xs px-1.5 py-0.5 font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{duplicateFound.status}</span></div>
                </div>
              </div>

              <div className="border border-[#1B3D8E]/30 dark:border-[#3B66C4]/30 p-3.5 rounded-xl space-y-2 bg-[#1B3D8E]/[0.02] dark:bg-[#3B66C4]/[0.02]">
                <h4 className="text-[#1B3D8E] dark:text-[#3B66C4] font-bold uppercase text-[9px] tracking-wider">신규 입력 데이터</h4>
                <div className="space-y-1 text-xs">
                  <div>사번: <span className="font-mono text-zinc-400">(신규 발급 예정)</span></div>
                  <div>이름: <strong className="text-zinc-900 dark:text-white">{name}</strong></div>
                  <div>소속: <span className="text-[#1B3D8E] dark:text-[#3B66C4] font-semibold">{companyName} · {siteName}</span></div>
                  <div>부서/직책: <span>{department} / {role}</span></div>
                  <div>연락처: <span className="font-mono">{phone}</span></div>
                  <div>상태: <span className="text-xs px-1.5 py-0.5 font-bold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">{status}</span></div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-zinc-500 text-[11px] leading-relaxed">
              * <strong>기존 사원 업데이트</strong>: 기존 사번(#{duplicateFound.emp_id})의 상세 정보를 현재의 입력 값으로 덮어씁니다.<br />
              * <strong>동명이인으로 신규 등록</strong>: 다른 사람으로 판단하여 새 고유 사번을 발급해 강제 추가합니다.<br />
              * <strong>조정 취소</strong>: 이전 화면으로 돌아가 입력을 수정합니다.
            </div>

            {/* Footer actions */}
            <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDuplicateFound(null)}
                className="px-3.5 py-2 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors"
              >
                조정 취소 (입력 수정)
              </button>

              <button
                type="button"
                onClick={() => {
                  // Register as separate person
                  const payload = {
                    name: name.trim(),
                    company_name: companyName,
                    site_name: siteName.trim(),
                    department: department.trim(),
                    role: role.trim(),
                    phone: phone.trim(),
                    email: email.trim(),
                    status,
                    authority,
                    status_reason: status !== '재직' ? statusReason : '',
                    status_date: status === '퇴사' ? statusDate : (status === '휴직' ? leaveStartDate : ''),
                    leave_start_date: status === '휴직' ? leaveStartDate : '',
                    leave_end_date: status === '휴직' ? leaveEndDate : '',
                    hire_date: hireDate,
                    contract_type: contractType,
                    contract_end_date: contractType === '계약직' ? contractEndDate : ''
                  };
                  onSave(payload);
                  setDuplicateFound(null);
                }}
                className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl border border-transparent cursor-pointer transition-all"
              >
                동명이인으로 신규 등록
              </button>

              <button
                type="button"
                onClick={async () => {
                  // Overwrite/merge existing
                  const payload = {
                    name: name.trim(),
                    company_name: companyName,
                    site_name: siteName.trim(),
                    department: department.trim(),
                    role: role.trim(),
                    phone: phone.trim(),
                    email: email.trim(),
                    status,
                    authority,
                    status_reason: status !== '재직' ? statusReason : '',
                    status_date: status === '퇴사' ? statusDate : (status === '휴직' ? leaveStartDate : ''),
                    leave_start_date: status === '휴직' ? leaveStartDate : '',
                    leave_end_date: status === '휴직' ? leaveEndDate : '',
                    hire_date: hireDate,
                    contract_type: contractType,
                    contract_end_date: contractType === '계약직' ? contractEndDate : ''
                  };
                  
                  // Save calling parent's onSave, passing the duplicateFound.emp_id as second argument
                  onSave(payload, duplicateFound.emp_id);
                  setDuplicateFound(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all"
              >
                기존 사원 정보 업데이트 (덮어쓰기)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-left">
            <User size={15} className="text-[#1B3D8E] dark:text-[#3B66C4]" />
            <h2 className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white m-0">
              {employeeToEdit ? '직원 상세 정보 수정' : '신규 직원 마스터 등록'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs md:text-sm">
          {errorMsg && (
            <div className="p-2.5 bg-rose-500/5 border border-rose-500/15 text-rose-600 dark:text-rose-400 rounded-xl text-left font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Name */}
            <div className="text-left">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <User size={10} className="text-zinc-455" />
                <span>이름 (필수)</span>
              </label>
              <input
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E]"
              />
            </div>

            {/* 2. Role */}
            <div className="text-left">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Briefcase size={10} className="text-zinc-455" />
                <span>직책 (필수)</span>
              </label>
              <input
                type="text"
                placeholder="사원 / 과장 / 반장"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E]"
              />
            </div>

            {/* 3. Site Name (Suggestions Autocomplete) */}
            <div className="text-left relative">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <MapPin size={10} className="text-zinc-455" />
                <span>사업장명 (필수)</span>
              </label>
              <input
                type="text"
                placeholder="본사 / 연암대학교 / 여의도 현장"
                value={siteName}
                onChange={(e) => handleSiteChange(e.target.value)}
                onFocus={() => setShowSiteSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSiteSuggestions(false), 200)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E]"
              />
              
              {/* Site Suggestions list */}
              {showSiteSuggestions && siteSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-20 max-h-32 overflow-y-auto">
                  {siteSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSiteName(s);
                        setShowSiteSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-[#1B3D8E] transition-colors cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 법인명 (소속 법인) */}
            <div className="text-left">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Building size={10} className="text-zinc-455" />
                <span>소속 법인 (필수)</span>
              </label>
              <select
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={siteName.trim() === '본사'}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] disabled:bg-zinc-100 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
              >
                <option value="미래에이비엠">미래에이비엠</option>
                <option value="다원피엠씨">다원피엠씨</option>
                <option value="정다운세상">정다운세상</option>
                <option value="다원엔텍">다원엔텍</option>
              </select>
              {siteName.trim() === '본사' && (
                <span className="text-[9px] text-[#F39C12] mt-0.5 block select-none">
                  ※ 본사 직원은 미래에이비엠으로 고정됩니다.
                </span>
              )}
            </div>

            {/* 4. Department (Suggestions Autocomplete) */}
            <div className="text-left relative">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Building size={10} className="text-zinc-455" />
                <span>부서 (필수)</span>
              </label>
              <input
                type="text"
                placeholder="경영관리팀 / 보안팀 / 미화반"
                value={department}
                onChange={(e) => handleDeptChange(e.target.value)}
                onFocus={() => setShowDeptSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDeptSuggestions(false), 200)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E]"
              />

              {/* Dept Suggestions list */}
              {showDeptSuggestions && deptSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-20 max-h-32 overflow-y-auto">
                  {deptSuggestions.map((d, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDepartment(d);
                        setShowDeptSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-[#1B3D8E] transition-colors cursor-pointer"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Phone Number */}
            <div className="text-left">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Phone size={10} className="text-zinc-455" />
                <span>연락처 (필수)</span>
              </label>
              <input
                type="text"
                placeholder="010-XXXX-XXXX"
                value={phone}
                onChange={handlePhoneChange}
                maxLength="13"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] font-mono"
              />
            </div>
 
            {/* 이메일 */}
            <div className="text-left">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Mail size={10} className="text-zinc-455" />
                <span>이메일 (선택)</span>
              </label>
              <input
                type="text"
                placeholder="example@miraeabm.co.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] font-mono"
              />
            </div>

            {/* 6. Authority */}
            <div className="text-left">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Shield size={10} className="text-zinc-455" />
                <span>시스템 권한 (필수)</span>
              </label>
              <select
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] cursor-pointer"
              >
                <option value="본사관리자">본사관리자</option>
                <option value="현장관리자">현장관리자</option>
                <option value="일반사용자">일반사용자</option>
              </select>
            </div>

            {/* 6b. Hire Date (Join Date) */}
            <div className="text-left">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Calendar size={10} className="text-[#1B3D8E] dark:text-[#3B66C4]" />
                <span>입사일 (필수)</span>
              </label>
              <input
                type="date"
                value={hireDate}
                onChange={(e) => setHireDate(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] font-mono cursor-pointer"
              />
            </div>

            {/* 6c. Contract Type */}
            <div className="text-left">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <FileText size={10} className="text-[#1B3D8E] dark:text-[#3B66C4]" />
                <span>계약 구분 (필수)</span>
              </label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] cursor-pointer"
              >
                <option value="정규직">정규직</option>
                <option value="계약직">계약직</option>
              </select>
            </div>

            {/* 6d. Contract End Date (Only visible if Contract Type is '계약직') */}
            {contractType === '계약직' && (
              <div className="text-left sm:col-span-2 animate-fade-in">
                <label className="block text-[10px] font-bold text-[#E67E22] dark:text-[#F39C12] mb-1 flex items-center gap-1">
                  <Calendar size={10} />
                  <span>계약 종료일 (필수)</span>
                </label>
                <input
                  type="date"
                  value={contractEndDate}
                  onChange={(e) => setContractEndDate(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-[#E67E22]/30 dark:border-[#F39C12]/30 rounded-xl px-3 py-1.5 text-xs text-zinc-850 dark:text-white focus:outline-none focus:border-[#E67E22] focus:ring-1 focus:ring-[#E67E22] font-mono cursor-pointer"
                />
              </div>
            )}


            {/* 7. Status */}
            <div className="text-left sm:col-span-2">
              <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Power size={10} className="text-zinc-455" />
                <span>재직 상태 (필수)</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] cursor-pointer"
              >
                <option value="재직">재직</option>
                <option value="휴직">휴직</option>
                <option value="퇴사">퇴사</option>
              </select>
              <p className="text-[10px] text-zinc-450 mt-1 select-none">
                ※ 퇴사자의 경우 본 재직 상태를 '퇴사'로 변경하고 저장하면 마스터 시스템에서 소프트 삭제 처리됩니다.
              </p>
            </div>

            {/* Conditional Status Details */}
            {status === '휴직' && (
              <div className="text-left sm:col-span-2 bg-zinc-50 dark:bg-zinc-950/40 p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 animate-fade-in">
                <h4 className="font-bold text-[10px] text-[#1B3D8E] dark:text-[#3B66C4] uppercase tracking-wider">휴직 상세 설정</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">휴직 사유</label>
                    <select
                      value={['육아휴직', '질병휴직', '군휴직'].includes(statusReason) ? statusReason : (statusReason ? '기타' : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '기타') {
                          setStatusReason('');
                        } else {
                          setStatusReason(val);
                        }
                      }}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] cursor-pointer"
                    >
                      <option value="">사유 선택</option>
                      <option value="육아휴직">육아휴직</option>
                      <option value="질병휴직">질병휴직</option>
                      <option value="군휴직">군휴직</option>
                      <option value="기타">기타 (직접 기입)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">기타 세부사유 (선택 사항)</label>
                    <input
                      type="text"
                      placeholder="기타 사유 기입..."
                      value={!['육아휴직', '질병휴직', '군휴직'].includes(statusReason) ? statusReason : ''}
                      onChange={(e) => setStatusReason(e.target.value)}
                      disabled={['육아휴직', '질병휴직', '군휴직'].includes(statusReason)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] disabled:bg-zinc-150 dark:disabled:bg-zinc-950 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">휴직 시작일</label>
                    <input
                      type="date"
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">휴직 종료일</label>
                    <input
                      type="date"
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {status === '퇴사' && (
              <div className="text-left sm:col-span-2 bg-zinc-50 dark:bg-zinc-950/40 p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 animate-fade-in">
                <h4 className="font-bold text-[10px] text-rose-600 dark:text-rose-455 uppercase tracking-wider">퇴사 상세 설정</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">퇴사 사유</label>
                    <select
                      value={['자진퇴사', '계약만료', '정년퇴직', '권고사직'].includes(statusReason) ? statusReason : (statusReason ? '기타' : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '기타') {
                          setStatusReason('');
                        } else {
                          setStatusReason(val);
                        }
                      }}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] cursor-pointer"
                    >
                      <option value="">사유 선택</option>
                      <option value="자진퇴사">자진퇴사</option>
                      <option value="계약만료">계약만료</option>
                      <option value="정년퇴직">정년퇴직</option>
                      <option value="권고사직">권고사직</option>
                      <option value="기타">기타 (직접 기입)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">기타 세부사유 (선택 사항)</label>
                    <input
                      type="text"
                      placeholder="기타 사유 기입..."
                      value={!['자진퇴사', '계약만료', '정년퇴직', '권고사직'].includes(statusReason) ? statusReason : ''}
                      onChange={(e) => setStatusReason(e.target.value)}
                      disabled={['자진퇴사', '계약만료', '정년퇴직', '권고사직'].includes(statusReason)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] disabled:bg-zinc-150 dark:disabled:bg-zinc-950 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">퇴사일</label>
                    <input
                      type="date"
                      value={statusDate}
                      onChange={(e) => setStatusDate(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-800 dark:text-white focus:outline-none focus:border-[#1B3D8E] focus:ring-1 focus:ring-[#1B3D8E] font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-gradient-to-r from-[#1B3D8E] to-[#3B66C4] hover:from-[#153173] hover:to-[#2F53A8] text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer transition-all"
            >
              {employeeToEdit ? '정보 수정 완료' : '신규 직원 등록'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
