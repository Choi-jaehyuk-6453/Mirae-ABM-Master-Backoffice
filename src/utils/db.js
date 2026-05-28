import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
let connectionConfig = null;

// Initial high-quality mock data for Demo Mode
// Initial high-quality mock data for Demo Mode
const INITIAL_MOCK_EMPLOYEES = [
  { emp_id: 1, name: '김민준', company_name: '미래에이비엠', site_name: '본사', department: '미래전략팀', role: '부장', phone: '010-1234-5678', email: 'mj.kim@miraeabm.co.kr', status: '재직', authority: '본사관리자', status_reason: '', status_date: '', leave_start_date: '', leave_end_date: '', hire_date: '2022-03-01', contract_type: '정규직', contract_end_date: '' },
  { emp_id: 2, name: '이서연', company_name: '미래에이비엠', site_name: '본사', department: '경영관리팀', role: '과장', phone: '010-2345-6789', email: 'sy.lee@miraeabm.co.kr', status: '재직', authority: '본사관리자', status_reason: '', status_date: '', leave_start_date: '', leave_end_date: '', hire_date: '2023-05-15', contract_type: '정규직', contract_end_date: '' },
  { emp_id: 3, name: '박우진', company_name: '다원피엠씨', site_name: '연암대학교', department: '보안팀', role: '팀장', phone: '010-3456-7890', email: 'wj.park@dawonpmc.co.kr', status: '재직', authority: '현장관리자', status_reason: '', status_date: '', leave_start_date: '', leave_end_date: '', hire_date: '2021-11-01', contract_type: '정규직', contract_end_date: '' },
  { emp_id: 4, name: '최지우', company_name: '정다운세상', site_name: '연암대학교', department: '미화소독팀', role: '조장', phone: '010-4567-8901', email: 'jw.choi@jungdown.co.kr', status: '재직', authority: '일반사용자', status_reason: '', status_date: '', leave_start_date: '', leave_end_date: '', hire_date: '2024-02-10', contract_type: '계약직', contract_end_date: '2027-02-09' },
  { emp_id: 5, name: '정해인', company_name: '다원엔텍', site_name: '서초 현장', department: '현장 관리소', role: '소장', phone: '010-5678-9012', email: 'hi.jung@dawonentec.co.kr', status: '재직', authority: '현장관리자', status_reason: '', status_date: '', leave_start_date: '', leave_end_date: '', hire_date: '2020-07-20', contract_type: '정규직', contract_end_date: '' },
  { emp_id: 6, name: '강동원', company_name: '다원피엠씨', site_name: '서초 현장', department: '경비반', role: '반장', phone: '010-6789-0123', email: 'dw.kang@dawonpmc.co.kr', status: '휴직', authority: '일반사용자', status_reason: '육아휴직', status_date: '2026-03-01', leave_start_date: '2026-03-01', leave_end_date: '2027-02-28', hire_date: '2023-10-01', contract_type: '정규직', contract_end_date: '' },
  { emp_id: 7, name: '윤아름', company_name: '정다운세상', site_name: '역삼 빌딩', department: '미화반', role: '사원', phone: '010-7890-1234', email: 'ar.yoon@jungdown.co.kr', status: '퇴사', authority: '일반사용자', status_reason: '개인사정', status_date: '2026-05-15', leave_start_date: '', leave_end_date: '', hire_date: '2022-06-15', contract_type: '계약직', contract_end_date: '2025-06-14' },
  { emp_id: 8, name: '한지민', company_name: '미래에이비엠', site_name: '본사', department: '임원', role: '대표이사', phone: '010-8901-2345', email: 'jm.han@miraeabm.co.kr', status: '재직', authority: '본사관리자', status_reason: '', status_date: '', leave_start_date: '', leave_end_date: '', hire_date: '2015-01-02', contract_type: '정규직', contract_end_date: '' },
  { emp_id: 9, name: '송중기', company_name: '다원엔텍', site_name: '연암대학교', department: '기술팀', role: '대리', phone: '010-9012-3456', email: 'jk.song@dawonentec.co.kr', status: '재직', authority: '일반사용자', status_reason: '', status_date: '', leave_start_date: '', leave_end_date: '', hire_date: '2023-01-10', contract_type: '계약직', contract_end_date: '2026-12-31' }
];

// Initial mock apps for App Integration Portal
const INITIAL_MOCK_APPS = [
  {
    id: 'app-attendance',
    name: '스마트 근태관리 시스템',
    auth_type: 'ID/Password',
    description: '전 현장 및 본사 임직원의 실시간 출근 및 퇴근 체크를 진행하는 주 시스템',
    is_active: true,
    columns: ['name', 'company_name', 'site_name', 'department', 'role', 'status'],
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'app-gate',
    name: '현장 스피드게이트 출입통제',
    auth_type: '4자리 PIN 번호',
    description: '현장 게이트 단말기와 연동하여 실시간 출입 권한(재직자 전용)을 조회하는 솔루션',
    is_active: true,
    columns: ['name', 'company_name', 'site_name', 'status'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'app-messenger',
    name: '현장 비상 카카오 알림봇',
    auth_type: 'API Webhook 토큰',
    description: '안전 보건 비상 상황 시 각 근로자 연락처로 알림톡을 발송하는 메신저 시스템',
    is_active: false,
    columns: ['name', 'phone', 'company_name', 'site_name', 'role'],
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_MOCK_STATUS_HISTORY = [
  { history_id: 1, emp_id: 6, name: '강동원', company_name: '다원피엠씨', previous_status: '재직', new_status: '휴직', status_reason: '육아휴직', status_date: '2026-03-01', updated_at: '2026-03-01T10:00:00.000Z' },
  { history_id: 2, emp_id: 7, name: '윤아름', company_name: '정다운세상', previous_status: '재직', new_status: '퇴사', status_reason: '개인사정', status_date: '2026-05-15', updated_at: '2026-05-15T15:30:00.000Z' }
];

// Initialize localStorage if empty
const initLocalStorage = () => {
  // If db_employees exists but doesn't have hire_date, we clear it to reload INITIAL_MOCK_EMPLOYEES
  const existingEmployees = localStorage.getItem('db_employees');
  if (existingEmployees) {
    try {
      const parsed = JSON.parse(existingEmployees);
      if (parsed.length > 0 && !parsed[0].hasOwnProperty('hire_date')) {
        localStorage.removeItem('db_employees');
      }
    } catch (e) {
      localStorage.removeItem('db_employees');
    }
  }

  if (!localStorage.getItem('db_employees')) {
    localStorage.setItem('db_employees', JSON.stringify(INITIAL_MOCK_EMPLOYEES));
  }
  
  // Similarly update db_apps for columns update
  const existingApps = localStorage.getItem('db_apps');
  if (existingApps) {
    try {
      const parsed = JSON.parse(existingApps);
      if (parsed.length > 0 && !parsed[0].columns.includes('company_name')) {
        localStorage.removeItem('db_apps');
      }
    } catch (e) {
      localStorage.removeItem('db_apps');
    }
  }
  
  if (!localStorage.getItem('db_apps')) {
    localStorage.setItem('db_apps', JSON.stringify(INITIAL_MOCK_APPS));
  }

  if (!localStorage.getItem('db_status_history')) {
    localStorage.setItem('db_status_history', JSON.stringify(INITIAL_MOCK_STATUS_HISTORY));
  }
};

initLocalStorage();

export const db = {
  // Config & Status Checking
  isSupabaseConnected: () => {
    return supabaseClient !== null;
  },

  getConnectionConfig: () => {
    if (connectionConfig) return connectionConfig;
    const saved = localStorage.getItem('supabase_config');
    if (saved) {
      try {
        connectionConfig = JSON.parse(saved);
        return connectionConfig;
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  disconnect: () => {
    supabaseClient = null;
    connectionConfig = null;
    localStorage.removeItem('supabase_config');
  },

  connect: async (url, anonKey) => {
    try {
      // Validate format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('올바른 URL 형식이 아닙니다. (http:// 또는 https:// 로 시작해야 합니다.)');
      }
      
      const tempClient = createClient(url, anonKey);
      
      // Test querying tb_employees to check if connection works and table exists
      const { data, error } = await tempClient
        .from('tb_employees')
        .select('*')
        .limit(1);

      if (error) {
        throw new Error(error.message);
      }

      // Success: Save details and set active client
      supabaseClient = tempClient;
      connectionConfig = { url, anonKey };
      localStorage.setItem('supabase_config', JSON.stringify({ url, anonKey }));
      return { success: true };
    } catch (err) {
      console.error('Supabase connection test failed:', err);
      return { success: false, error: err.message || '연동 실패: URL 및 Anon Key를 다시 확인해 주세요.' };
    }
  },

  // Try auto connect on boot
  tryAutoConnect: async () => {
    const config = db.getConnectionConfig();
    if (config && config.url && config.anonKey) {
      const res = await db.connect(config.url, config.anonKey);
      return res.success;
    }
    return false;
  },

  // 1. Fetch Employees with Filters
  getEmployees: async () => {
    if (db.isSupabaseConnected()) {
      try {
        const { data, error } = await supabaseClient
          .from('tb_employees')
          .select('*')
          .order('emp_id', { ascending: true });
        
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase fetch failed, falling back to local storage:', err);
        return JSON.parse(localStorage.getItem('db_employees') || '[]');
      }
    } else {
      // Demo Mode
      return JSON.parse(localStorage.getItem('db_employees') || '[]');
    }
  },

  // 2. Insert Employee
  insertEmployee: async (employee) => {
    // Standard validation
    if (!employee.name || !employee.company_name || !employee.site_name || !employee.department || !employee.role || !employee.phone) {
      throw new Error('필수 정보를 모두 입력해 주세요.');
    }

    if (db.isSupabaseConnected()) {
      const { data, error } = await supabaseClient
        .from('tb_employees')
        .insert([
          {
            name: employee.name,
            company_name: employee.company_name,
            site_name: employee.site_name,
            department: employee.department,
            role: employee.role,
            phone: employee.phone,
            email: employee.email || '',
            status: employee.status || '재직',
            authority: employee.authority || '일반사용자',
            status_reason: employee.status_reason || '',
            status_date: employee.status_date || '',
            leave_start_date: employee.leave_start_date || '',
            leave_end_date: employee.leave_end_date || '',
            hire_date: employee.hire_date || '',
            contract_type: employee.contract_type || '정규직',
            contract_end_date: employee.contract_end_date || ''
          }
        ])
        .select();
 
      if (error) throw error;
      
      // Since it's a new employee, if they are inserted with a status other than '재직', we log a status history entry!
      if (employee.status && employee.status !== '재직') {
        await db.addStatusHistoryEntry({
          emp_id: data[0].emp_id,
          name: employee.name,
          company_name: employee.company_name,
          previous_status: '신규등록',
          new_status: employee.status,
          status_reason: employee.status_reason || '',
          status_date: employee.status_date || new Date().toISOString().split('T')[0]
        });
      }
      return data[0];
    } else {
      // Demo Mode
      const list = JSON.parse(localStorage.getItem('db_employees') || '[]');
      const newId = list.length > 0 ? Math.max(...list.map(e => e.emp_id)) + 1 : 1;
      const newEmp = {
        emp_id: newId,
        name: employee.name,
        company_name: employee.company_name,
        site_name: employee.site_name,
        department: employee.department,
        role: employee.role,
        phone: employee.phone,
        email: employee.email || '',
        status: employee.status || '재직',
        authority: employee.authority || '일반사용자',
        status_reason: employee.status_reason || '',
        status_date: employee.status_date || '',
        leave_start_date: employee.leave_start_date || '',
        leave_end_date: employee.leave_end_date || '',
        hire_date: employee.hire_date || '',
        contract_type: employee.contract_type || '정규직',
        contract_end_date: employee.contract_end_date || ''
      };
      list.push(newEmp);
      localStorage.setItem('db_employees', JSON.stringify(list));
      
      if (employee.status && employee.status !== '재직') {
        await db.addStatusHistoryEntry({
          emp_id: newId,
          name: employee.name,
          company_name: employee.company_name,
          previous_status: '신규등록',
          new_status: employee.status,
          status_reason: employee.status_reason || '',
          status_date: employee.status_date || new Date().toISOString().split('T')[0]
        });
      }
      return newEmp;
    }
  },

  // 3. Bulk Insert Employees (Excel import)
  bulkInsertEmployees: async (employees) => {
    if (employees.length === 0) return [];

    if (db.isSupabaseConnected()) {
      const { data, error } = await supabaseClient
        .from('tb_employees')
        .insert(employees.map(e => ({
          name: e.name,
          company_name: e.company_name,
          site_name: e.site_name,
          department: e.department,
          role: e.role,
          phone: e.phone,
          email: e.email || '',
          status: e.status || '재직',
          authority: e.authority || '일반사용자',
          status_reason: e.status_reason || '',
          status_date: e.status_date || '',
          leave_start_date: e.leave_start_date || '',
          leave_end_date: e.leave_end_date || '',
          hire_date: e.hire_date || '',
          contract_type: e.contract_type || '정규직',
          contract_end_date: e.contract_end_date || ''
        })))
        .select();
 
      if (error) throw error;
      return data;
    } else {
      // Demo Mode
      const list = JSON.parse(localStorage.getItem('db_employees') || '[]');
      let currentMaxId = list.length > 0 ? Math.max(...list.map(e => e.emp_id)) : 0;
      
      const newRecords = employees.map(e => {
        currentMaxId++;
        return {
          emp_id: currentMaxId,
          name: e.name,
          company_name: e.company_name,
          site_name: e.site_name,
          department: e.department,
          role: e.role,
          phone: e.phone,
          email: e.email || '',
          status: e.status || '재직',
          authority: e.authority || '일반사용자',
          status_reason: e.status_reason || '',
          status_date: e.status_date || '',
          leave_start_date: e.leave_start_date || '',
          leave_end_date: e.leave_end_date || '',
          hire_date: e.hire_date || '',
          contract_type: e.contract_type || '정규직',
          contract_end_date: e.contract_end_date || ''
        };
      });

      const updatedList = [...list, ...newRecords];
      localStorage.setItem('db_employees', JSON.stringify(updatedList));
      return newRecords;
    }
  },

  // 4. Update Employee
  updateEmployee: async (emp_id, updates) => {
    let previousEmployee = null;
    if (db.isSupabaseConnected()) {
      // Fetch previous first
      try {
        const { data: fetchRes } = await supabaseClient
          .from('tb_employees')
          .select('*')
          .eq('emp_id', emp_id)
          .single();
        previousEmployee = fetchRes;
      } catch (e) {
        console.error('Failed to fetch previous employee from Supabase:', e);
      }
      
      const { data, error } = await supabaseClient
        .from('tb_employees')
        .update({
          name: updates.name,
          company_name: updates.company_name,
          site_name: updates.site_name,
          department: updates.department,
          role: updates.role,
          phone: updates.phone,
          email: updates.email,
          status: updates.status,
          authority: updates.authority,
          status_reason: updates.status_reason,
          status_date: updates.status_date,
          leave_start_date: updates.leave_start_date,
          leave_end_date: updates.leave_end_date,
          hire_date: updates.hire_date,
          contract_type: updates.contract_type,
          contract_end_date: updates.contract_end_date
        })
        .eq('emp_id', emp_id)
        .select();
 
      if (error) throw error;
      
      // Status change logging
      if (previousEmployee && previousEmployee.status !== updates.status) {
        await db.addStatusHistoryEntry({
          emp_id: emp_id,
          name: updates.name || previousEmployee.name,
          company_name: updates.company_name || previousEmployee.company_name,
          previous_status: previousEmployee.status,
          new_status: updates.status,
          status_reason: updates.status_reason || '',
          status_date: updates.status_date || new Date().toISOString().split('T')[0]
        });
      }
      return data[0];
    } else {
      // Demo Mode
      const list = JSON.parse(localStorage.getItem('db_employees') || '[]');
      const idx = list.findIndex(e => e.emp_id === Number(emp_id));
      if (idx === -1) throw new Error('해당 직원을 찾을 수 없습니다.');
      
      previousEmployee = { ...list[idx] };
      const prevStatus = previousEmployee.status;
      
      list[idx] = {
        ...list[idx],
        name: updates.name ?? list[idx].name,
        company_name: updates.company_name ?? list[idx].company_name,
        site_name: updates.site_name ?? list[idx].site_name,
        department: updates.department ?? list[idx].department,
        role: updates.role ?? list[idx].role,
        phone: updates.phone ?? list[idx].phone,
        email: updates.email ?? list[idx].email,
        status: updates.status ?? list[idx].status,
        authority: updates.authority ?? list[idx].authority,
        status_reason: updates.status_reason !== undefined ? updates.status_reason : list[idx].status_reason,
        status_date: updates.status_date !== undefined ? updates.status_date : list[idx].status_date,
        leave_start_date: updates.leave_start_date !== undefined ? updates.leave_start_date : list[idx].leave_start_date,
        leave_end_date: updates.leave_end_date !== undefined ? updates.leave_end_date : list[idx].leave_end_date,
        hire_date: updates.hire_date !== undefined ? updates.hire_date : list[idx].hire_date,
        contract_type: updates.contract_type !== undefined ? updates.contract_type : list[idx].contract_type,
        contract_end_date: updates.contract_end_date !== undefined ? updates.contract_end_date : list[idx].contract_end_date
      };
      
      localStorage.setItem('db_employees', JSON.stringify(list));
      
      if (prevStatus !== updates.status) {
        await db.addStatusHistoryEntry({
          emp_id: emp_id,
          name: list[idx].name,
          company_name: list[idx].company_name,
          previous_status: prevStatus,
          new_status: updates.status,
          status_reason: updates.status_reason || '',
          status_date: updates.status_date || new Date().toISOString().split('T')[0]
        });
      }
      return list[idx];
    }
  },

  // 4b. Fetch Status History Log
  getStatusHistory: async () => {
    if (db.isSupabaseConnected()) {
      try {
        const { data, error } = await supabaseClient
          .from('tb_status_history')
          .select('*')
          .order('history_id', { ascending: false });
        
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Supabase status history fetch failed, falling back to local storage:', err);
        return JSON.parse(localStorage.getItem('db_status_history') || '[]');
      }
    } else {
      return JSON.parse(localStorage.getItem('db_status_history') || '[]');
    }
  },

  // 4c. Add Status History Entry
  addStatusHistoryEntry: async (entry) => {
    const timestamp = new Date().toISOString();
    if (db.isSupabaseConnected()) {
      try {
        const { data, error } = await supabaseClient
          .from('tb_status_history')
          .insert([
            {
              emp_id: entry.emp_id,
              name: entry.name,
              company_name: entry.company_name,
              previous_status: entry.previous_status,
              new_status: entry.new_status,
              status_reason: entry.status_reason || '',
              status_date: entry.status_date || timestamp.split('T')[0]
            }
          ])
          .select();
        if (error && error.code !== 'PGRST116') {
          console.warn('Supabase status history insert encountered error:', error);
        } else if (data && data.length > 0) {
          return data[0];
        }
      } catch (err) {
        console.error('Supabase status history insert failed, saving to local storage:', err);
      }
    }
    
    // Save to local storage anyway or as fallback
    const list = JSON.parse(localStorage.getItem('db_status_history') || '[]');
    const newId = list.length > 0 ? Math.max(...list.map(h => h.history_id || 0)) + 1 : 1;
    const newEntry = {
      history_id: newId,
      emp_id: entry.emp_id,
      name: entry.name,
      company_name: entry.company_name,
      previous_status: entry.previous_status,
      new_status: entry.new_status,
      status_reason: entry.status_reason || '',
      status_date: entry.status_date || timestamp.split('T')[0],
      updated_at: timestamp
    };
    list.unshift(newEntry); // newest first
    localStorage.setItem('db_status_history', JSON.stringify(list));
    return newEntry;
  },

  // 4d. Check Duplicate Employee
  checkDuplicateEmployee: async (name, phone, email) => {
    // Stripped phone helper
    const stripPhone = (p) => String(p || '').replace(/[^0-9]/g, '');
    const searchPhone = stripPhone(phone);
    
    let employees = [];
    if (db.isSupabaseConnected()) {
      try {
        const { data } = await supabaseClient.from('tb_employees').select('*');
        employees = data || [];
      } catch (e) {
        employees = JSON.parse(localStorage.getItem('db_employees') || '[]');
      }
    } else {
      employees = JSON.parse(localStorage.getItem('db_employees') || '[]');
    }

    // Find duplicates: name must match, and (phone matches OR email matches)
    return employees.find(emp => {
      const nameMatch = String(emp.name).trim() === String(name).trim();
      const phoneMatch = searchPhone && stripPhone(emp.phone) === searchPhone;
      const emailMatch = email && String(emp.email).trim() === String(email).trim();
      return nameMatch && (phoneMatch || emailMatch);
    });
  },

  // 5. Connect and fetch external integration apps
  getApps: async () => {
    if (db.isSupabaseConnected()) {
      try {
        // Fallback to localStorage if tb_apps_integration doesn't exist yet in Supabase
        const { data, error } = await supabaseClient
          .from('tb_apps_integration')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          // If table doesn't exist, fall back to local storage silently
          return JSON.parse(localStorage.getItem('db_apps') || '[]');
        }
        return data;
      } catch (err) {
        return JSON.parse(localStorage.getItem('db_apps') || '[]');
      }
    } else {
      return JSON.parse(localStorage.getItem('db_apps') || '[]');
    }
  },

  // 6. Save or Update Connected App
  saveApp: async (app) => {
    if (db.isSupabaseConnected()) {
      try {
        const { data, error } = await supabaseClient
          .from('tb_apps_integration')
          .upsert({
            id: app.id || undefined,
            name: app.name,
            auth_type: app.auth_type,
            description: app.description,
            is_active: app.is_active,
            columns: app.columns,
            created_at: app.created_at || new Date().toISOString()
          })
          .select();

        if (error) throw error;
        return data[0];
      } catch (err) {
        console.warn('Supabase app save failed, saving to localStorage:', err);
        return db.saveAppLocally(app);
      }
    } else {
      return db.saveAppLocally(app);
    }
  },

  saveAppLocally: (app) => {
    const list = JSON.parse(localStorage.getItem('db_apps') || '[]');
    let target = { ...app };
    if (!target.id) {
      target.id = 'app-' + Math.random().toString(36).substr(2, 9);
      target.created_at = new Date().toISOString();
      list.push(target);
    } else {
      const idx = list.findIndex(a => a.id === target.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...target };
      } else {
        list.push(target);
      }
    }
    localStorage.setItem('db_apps', JSON.stringify(list));
    return target;
  },

  // 7. Delete Connected App
  deleteApp: async (appId) => {
    if (db.isSupabaseConnected()) {
      try {
        const { error } = await supabaseClient
          .from('tb_apps_integration')
          .delete()
          .eq('id', appId);

        if (error) throw error;
      } catch (err) {
        console.warn('Supabase app delete failed, deleting from localStorage:', err);
        db.deleteAppLocally(appId);
      }
    } else {
      db.deleteAppLocally(appId);
    }
    return true;
  },

  deleteAppLocally: (appId) => {
    const list = JSON.parse(localStorage.getItem('db_apps') || '[]');
    const filtered = list.filter(a => a.id !== appId);
    localStorage.setItem('db_apps', JSON.stringify(filtered));
  }
};
