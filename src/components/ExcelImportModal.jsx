import React, { useState, useRef } from 'react';
import { X, FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle, Info, Database } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ExcelImportModal({ isOpen, onClose, onImport, employees = [] }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Parser output states
  const [parsedData, setParsedData] = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // 1. Generate and download pre-formatted Excel template using SheetJS
  const handleDownloadTemplate = () => {
    const headers = [['이름', '법인명', '사업장명', '부서', '직책', '연락처', '이메일', '재직상태', '권한', '입사일', '계약구분', '계약종료일']];
    const samples = [
      ['김연아', '미래에이비엠', '본사', '경영관리팀', '대리', '010-1234-5678', 'ya.kim@miraeabm.co.kr', '재직', '일반사용자', '2025-03-01', '정규직', ''],
      ['유재석', '다원피엠씨', '연암대학교', '경비반', '반장', '010-9876-5432', 'js.yoo@dawonpmc.co.kr', '재직', '현장관리자', '2024-06-15', '정규직', ''],
      ['아이유', '정다운세상', '역삼 빌딩', '미화반', '사원', '010-2222-3333', 'iu.lee@jungdown.co.kr', '재직', '일반사용자', '2026-01-10', '계약직', '2027-01-09']
    ];

    const wsData = [...headers, ...samples];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 12 }, // 이름
      { wch: 15 }, // 법인명
      { wch: 18 }, // 사업장명
      { wch: 15 }, // 부서
      { wch: 12 }, // 직책
      { wch: 16 }, // 연락처
      { wch: 25 }, // 이메일
      { wch: 10 }, // 재직상태
      { wch: 15 }, // 권한
      { wch: 12 }, // 입사일
      { wch: 12 }, // 계약구분
      { wch: 12 }  // 계약종료일
    ];

    XLSX.utils.book_append_sheet(wb, ws, '인사등록양식');
    XLSX.writeFile(wb, '통합마스터_인사등록_양식.xlsx');
  };

  // 2. Drag & Drop events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processExcelFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processExcelFile(file);
    }
  };

  // 3. Parser & Real-time Validation Engine
  const processExcelFile = (file) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      alert('엑셀 파일(.xlsx, .xls, .csv)만 업로드 가능합니다.');
      return;
    }

    setFileName(file.name);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length <= 1) {
          throw new Error('엑셀 파일에 데이터 행이 존재하지 않습니다.');
        }

        const fileHeaders = rows[0].map(h => String(h).trim());
        const nameIdx = fileHeaders.indexOf('이름');
        const companyIdx = fileHeaders.indexOf('법인명');
        const siteIdx = fileHeaders.indexOf('사업장명');
        const deptIdx = fileHeaders.indexOf('부서');
        const roleIdx = fileHeaders.indexOf('직책');
        const phoneIdx = fileHeaders.indexOf('연락처');
        
        // Find email index supporting 여러 표기방식 ('이메일', 'email', 'e-mail')
        const emailIdx = fileHeaders.findIndex(h => h.includes('이메일') || h.toLowerCase().includes('email') || h.toLowerCase().includes('e-mail'));
        
        const statusIdx = fileHeaders.indexOf('재직상태');
        const authIdx = fileHeaders.indexOf('권한');
        const hireDateIdx = fileHeaders.indexOf('입사일');
        const contractTypeIdx = fileHeaders.indexOf('계약구분');
        const contractEndDateIdx = fileHeaders.indexOf('계약종료일');

        if (nameIdx === -1 || companyIdx === -1 || siteIdx === -1 || deptIdx === -1 || roleIdx === -1 || phoneIdx === -1) {
          throw new Error("올바른 양식이 아닙니다. 필수 헤더('이름', '법인명', '사업장명', '부서', '직책', '연락처')가 유실되었습니다.");
        }

        const validList = [];
        const invalidList = [];

        // DB의 기존 고유 사업장명 목록 추출 (ALL 및 본사 제외)
        const existingSiteNames = [...new Set(employees.map(e => e.site_name).filter(Boolean))].filter(s => s !== 'ALL' && s !== '본사');

        const parseExcelDate = (val) => {
          if (!val) return '';
          const str = String(val).trim();
          if (!str) return '';
          
          if (/^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/.test(str)) {
            const parts = str.split(/[-./]/);
            const y = parts[0];
            const m = parts[1].padStart(2, '0');
            const d = parts[2].padStart(2, '0');
            return `${y}-${m}-${d}`;
          }
          
          const num = Number(str);
          if (!isNaN(num) && num > 30000 && num < 60000) {
            const date = new Date((num - 25569) * 86400 * 1000);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
          }
          
          return str;
        };

        const checkSimilarSites = (inputSite) => {
          const normalize = (str) => String(str || '').replace(/[^a-zA-Z0-9가-힣]/g, '').trim();
          const normInput = normalize(inputSite);
          if (!normInput || existingSiteNames.includes(inputSite)) return [];

          const getLevenshteinDistance = (a, b) => {
            const matrix = [];
            for (let i = 0; i <= b.length; i++) matrix[i] = [i];
            for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
            for (let i = 1; i <= b.length; i++) {
              for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                  matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                  matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                  );
                }
              }
            }
            return matrix[b.length][a.length];
          };

          return existingSiteNames.filter(exSite => {
            const normEx = normalize(exSite);
            if (normEx === normInput) return true; // 공백 차이

            const distance = getLevenshteinDistance(normInput, normEx);
            const maxLength = Math.max(normInput.length, normEx.length);
            const similarity = (maxLength - distance) / maxLength;
            return similarity >= 0.6 || normInput.includes(normEx) || normEx.includes(normInput);
          });
        };

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
            continue;
          }

          const rawName = String(row[nameIdx] || '').trim();
          let rawCompany = String(row[companyIdx] || '').trim();
          let rawSite = String(row[siteIdx] || '').trim();
          let rawDept = String(row[deptIdx] || '').trim();
          let rawRole = String(row[roleIdx] || '').trim();
          const rawPhone = String(row[phoneIdx] || '').trim();
          const rawEmail = String(emailIdx !== -1 ? row[emailIdx] || '' : '').trim();
          
          let rawStatus = String(statusIdx !== -1 ? row[statusIdx] || '재직' : '재직').trim();
          let rawAuth = String(authIdx !== -1 ? row[authIdx] || '일반사용자' : '일반사용자').trim();

          // Employment details parse
          let rawHireDate = parseExcelDate(hireDateIdx !== -1 ? row[hireDateIdx] : '');
          if (!rawHireDate) {
            rawHireDate = new Date().toISOString().split('T')[0]; // fallback
          }

          let rawContractType = String(contractTypeIdx !== -1 ? row[contractTypeIdx] || '정규직' : '정규직').trim();
          let rawContractEndDate = parseExcelDate(contractEndDateIdx !== -1 ? row[contractEndDateIdx] : '');

          const errors = [];
          
          if (!rawName) errors.push('이름 누락');
          
          // Forgiving logic for Site
          if (!rawSite) {
            rawSite = '미지정';
          } else if (rawSite !== '본사') {
            const similarList = checkSimilarSites(rawSite);
            if (similarList.length > 0) {
              rawSite = similarList[0];
            }
          }
          
          if (!rawDept) rawDept = '-';
          if (!rawRole) rawRole = '-';
          
          // HQ Rule: 본사 직원은 항상 미래에이비엠으로 설정 및 정규직 강제
          if (rawSite === '본사') {
            rawCompany = '미래에이비엠';
            rawContractType = '정규직';
            rawContractEndDate = '';
          }

          if (!rawCompany) {
            rawCompany = '미래에이비엠';
          } else if (!['미래에이비엠', '다원피엠씨', '정다운세상', '다원엔텍'].includes(rawCompany)) {
            errors.push(`허용되지 않는 법인명 ('${rawCompany}')`);
          }
          
          let formattedPhone = '';
          if (rawPhone) {
            const digits = rawPhone.replace(/[^0-9]/g, '');
            if (digits.length === 11) {
              formattedPhone = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
            } else if (digits.length === 10) {
              formattedPhone = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
            } else {
              formattedPhone = rawPhone;
            }
          }

          if (rawEmail && !rawEmail.includes('@')) {
            errors.push('이메일 형식 오류 (@ 누락)');
          }

          if (!['재직', '휴직', '퇴사'].includes(rawStatus)) {
            if (!rawStatus) rawStatus = '재직';
            else errors.push(`부적절한 재직상태 기입 ('${rawStatus}')`);
          }

          if (!['본사관리자', '현장관리자', '일반사용자'].includes(rawAuth)) {
            if (!rawAuth) rawAuth = '일반사용자';
            else errors.push(`부적절한 권한 기입 ('${rawAuth}')`);
          }

          if (!['정규직', '계약직'].includes(rawContractType)) {
            if (!rawContractType) rawContractType = '정규직';
            else errors.push(`부적절한 계약구분 기입 ('${rawContractType}')`);
          }

          if (rawContractType === '계약직') {
            if (!rawContractEndDate) {
              errors.push('계약 종료일 누락');
            } else if (rawHireDate && rawHireDate > rawContractEndDate) {
              errors.push('계약 종료일이 입사일보다 이전입니다.');
            }
          }

          const record = {
            rowNum: i + 1,
            name: rawName,
            company_name: rawCompany,
            site_name: rawSite,
            department: rawDept,
            role: rawRole,
            phone: errors.some(e => e.includes('연락처')) ? rawPhone : formattedPhone,
            email: rawEmail,
            status: rawStatus,
            authority: rawAuth,
            hire_date: rawHireDate,
            contract_type: rawContractType,
            contract_end_date: rawContractType === '계약직' ? rawContractEndDate : ''
          };

          if (errors.length > 0) {
            invalidList.push({ ...record, errors });
          } else {
            validList.push(record);
          }
        }

        setValidRows(validList);
        setInvalidRows(invalidList);
        setParsedData(rows.slice(1));
      } catch (err) {
        console.error(err);
        alert(err.message || '엑셀 분석 중 에러가 발생했습니다.');
        resetState();
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const resetState = () => {
    setFileName('');
    setParsedData([]);
    setValidRows([]);
    setInvalidRows([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportSubmit = () => {
    if (validRows.length === 0) return;
    
    onImport(validRows);
    resetState();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-slide-up my-8">
        
        {/* Header */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-left">
            <FileSpreadsheet size={15} className="text-emerald-500" />
            <h2 className="text-xs md:text-sm font-bold text-zinc-900 dark:text-white m-0">인사 데이터 엑셀 일괄 등록</h2>
          </div>
          <button
            onClick={() => {
              resetState();
              onClose();
            }}
            className="p-1 text-zinc-400 hover:text-zinc-800 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs md:text-sm">
          
          {/* Section 1: Template download guide */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-zinc-50 dark:bg-zinc-950/20 p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl gap-4 text-left">
            <div className="flex gap-2 items-start">
              <Info size={14} className="text-[#1B3D8E] dark:text-[#3B66C4] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-zinc-800 dark:text-white m-0">지정된 표준 엑셀 양식 권장</h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  본사 및 각 현장용 일괄 업로드를 위해서는 지정된 칼럼 구조에 맞춰 행 데이터를 기입해 주셔야 안전하게 마스터 DB에 벌크 추가됩니다.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-emerald-600 dark:text-emerald-400 font-semibold text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <Download size={13} />
              <span>양식 파일 다운로드</span>
            </button>
          </div>

          {/* Section 2: Drag & Drop zone */}
          {!fileName ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`corporate-dropzone py-10 px-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 relative border border-transparent ${
                dragActive ? 'bg-[#1B3D8E]/5' : ''
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 rounded-full border border-zinc-150 dark:border-zinc-800">
                <Upload size={24} />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-bold text-zinc-700 dark:text-zinc-300">엑셀 업로드 파일 선택</h3>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 leading-relaxed">
                  작성된 엑셀 파일을 여기에 끌어놓거나 마우스로 클릭하여 주십시오.<br />
                  지원 형식: <code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>
                </p>
              </div>
            </div>
          ) : (
            /* Selected File Display & Loading Indicator */
            <div className="space-y-4 text-left animate-slide-up">
              <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/20 p-3.5 border border-zinc-150 dark:border-zinc-800 rounded-xl">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-white truncate m-0">{fileName}</h4>
                    <span className="text-[10px] text-zinc-450">가져오기 대기 중</span>
                  </div>
                </div>
                
                <button
                  onClick={resetState}
                  className="px-2.5 py-1 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                >
                  파일 교체
                </button>
              </div>

              {/* Parsing Loading State */}
              {loading && (
                <div className="py-10 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#1B3D8E] rounded-full animate-spin"></div>
                  <span className="text-xs text-zinc-400 font-semibold">데이터 구문 분석 및 검증 수행 중...</span>
                </div>
              )}

              {/* Section 3: live verification view panels */}
              {!loading && (validRows.length > 0 || invalidRows.length > 0) && (
                <div className="space-y-3.5">
                  <div className="text-[10px] tracking-wider font-bold text-zinc-450 uppercase select-none">
                    데이터 실시간 정합성 분석 내역
                  </div>

                  {/* Summary Status Cards */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      <CheckCircle size={13} />
                      <span className="text-xs font-bold">검증 정상 사원: {validRows.length}명</span>
                    </div>
                    
                    <div className={`${
                      invalidRows.length > 0 
                        ? 'bg-rose-500/10 border border-rose-500/15 text-rose-600 dark:text-rose-400' 
                        : 'bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 text-zinc-400'
                    } p-2.5 rounded-xl flex items-center justify-center gap-1.5`}>
                      <AlertCircle size={13} />
                      <span className="text-xs font-bold">규격 오류 행: {invalidRows.length}건</span>
                    </div>
                  </div>

                  {/* Errors Grid (If any exists) */}
                  {invalidRows.length > 0 && (
                    <div className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3.5 max-h-40 overflow-y-auto">
                      <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5 select-none">
                        <AlertCircle size={12} />
                        <span>입력 오류 식별 내역 (해당 행들은 자동 건너뛰기 처리됩니다)</span>
                      </h4>
                      
                      <div className="space-y-1.5 font-mono text-[10.5px] leading-relaxed">
                        {invalidRows.map((row, idx) => (
                          <div key={idx} className="flex items-start gap-1 bg-rose-500/5 border border-rose-500/10 p-1.5 rounded-lg text-rose-600 dark:text-rose-400">
                            <span className="font-bold shrink-0">행 #{row.rowNum}:</span>
                            <span className="font-semibold shrink-0">[{row.name || '공란'}]</span>
                            <span className="flex-1 text-right text-rose-500 font-medium">{row.errors.join(' | ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Valid Ready Preview */}
                  {validRows.length > 0 && (
                    <div className="border border-zinc-250/60 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <div className="bg-zinc-50 dark:bg-zinc-900/60 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-650 dark:text-zinc-300 select-none">
                        일괄 업로드 대기 데이터 (최근 3개 항목 기재)
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs font-mono text-left">
                          <thead>
                            <tr className="bg-white dark:bg-zinc-950 border-b border-zinc-200/60 dark:border-zinc-800/80 text-zinc-400">
                              <th className="py-2 px-3 w-10 text-center">행</th>
                              <th className="py-2 px-3">이름</th>
                              <th className="py-2 px-3">법인명</th>
                              <th className="py-2 px-3">사업장명</th>
                              <th className="py-2 px-3">부서명</th>
                              <th className="py-2 px-3">직책</th>
                              <th className="py-2 px-3">연락처</th>
                              <th className="py-2 px-3">입사일</th>
                              <th className="py-2 px-3">계약기간</th>
                              <th className="py-2 px-3">상태/권한</th>
                            </tr>
                          </thead>
                          <tbody>
                            {validRows.slice(0, 3).map((row, idx) => (
                              <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10 text-zinc-600 dark:text-zinc-300">
                                <td className="py-1.5 px-3 text-center text-zinc-400">#{row.rowNum}</td>
                                <td className="py-1.5 px-3 font-sans font-bold text-zinc-800 dark:text-white">{row.name}</td>
                                <td className="py-1.5 px-3 text-[#1B3D8E] dark:text-[#3B66C4] font-semibold">{row.company_name}</td>
                                <td className="py-1.5 px-3">{row.site_name}</td>
                                <td className="py-1.5 px-3">{row.department}</td>
                                <td className="py-1.5 px-3 text-zinc-400">{row.role}</td>
                                <td className="py-1.5 px-3">{row.phone}</td>
                                <td className="py-1.5 px-3 font-mono">{row.hire_date || '-'}</td>
                                <td className="py-1.5 px-3 text-[10px]">
                                  {row.contract_type === '정규직' ? (
                                    <span className="text-zinc-500 font-bold">정규직</span>
                                  ) : (
                                    <span className="text-blue-500 font-bold">계약 ({row.contract_end_date})</span>
                                  )}
                                </td>
                                <td className="py-1.5 px-3 text-zinc-500">
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{row.status}</span>
                                  <span className="text-[10px] mx-1">/</span>
                                  <span className="text-[10px] text-purple-500">{row.authority}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {validRows.length > 3 && (
                        <div className="bg-zinc-50 dark:bg-zinc-900/30 py-1.5 text-center text-[10px] text-zinc-450 dark:text-zinc-500 font-sans tracking-wide border-t border-zinc-100 dark:border-zinc-800">
                          외 {validRows.length - 3}명의 유효한 데이터 행이 연동 대기 중입니다.
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Action Buttons */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-end gap-2 text-xs md:text-sm font-sans">
          <button
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400 font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer transition-colors"
          >
            닫기
          </button>
          
          <button
            type="button"
            disabled={validRows.length === 0}
            onClick={handleImportSubmit}
            className={`px-4 py-1.5 font-bold rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5 ${
              validRows.length === 0
                ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700/55 cursor-not-allowed shadow-none'
                : 'bg-[#1B3D8E] hover:bg-[#153173] text-white'
            }`}
          >
            <Database size={13} />
            <span>일괄 등록 시작 ({validRows.length}명)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
