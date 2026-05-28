import React, { useState, useEffect } from 'react';
import { X, User, Building, MapPin, Briefcase, Phone, Mail, Shield, Power } from 'lucide-react';

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
    }
    setErrorMsg('');
  }, [employeeToEdit, isOpen]);

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

  const handleSubmit = (e) => {
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

    const payload = {
      name: name.trim(),
      company_name: companyName,
      site_name: siteName.trim(),
      department: department.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email.trim(),
      status,
      authority
    };

    onSave(payload);
  };

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
