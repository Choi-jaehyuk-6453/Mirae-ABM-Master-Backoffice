import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
let connectionConfig = null;

// Initial high-quality mock data for Demo Mode
// Initial high-quality mock data for Demo Mode
const INITIAL_MOCK_EMPLOYEES = [
  { emp_id: 1, name: '김민준', company_name: '미래에이비엠', site_name: '본사', department: '미래전략팀', role: '부장', phone: '010-1234-5678', email: 'mj.kim@miraeabm.co.kr', status: '재직', authority: '본사관리자' },
  { emp_id: 2, name: '이서연', company_name: '미래에이비엠', site_name: '본사', department: '경영관리팀', role: '과장', phone: '010-2345-6789', email: 'sy.lee@miraeabm.co.kr', status: '재직', authority: '본사관리자' },
  { emp_id: 3, name: '박우진', company_name: '다원피엠씨', site_name: '연암대학교', department: '보안팀', role: '팀장', phone: '010-3456-7890', email: 'wj.park@dawonpmc.co.kr', status: '재직', authority: '현장관리자' },
  { emp_id: 4, name: '최지우', company_name: '정다운세상', site_name: '연암대학교', department: '미화소독팀', role: '조장', phone: '010-4567-8901', email: 'jw.choi@jungdown.co.kr', status: '재직', authority: '일반사용자' },
  { emp_id: 5, name: '정해인', company_name: '다원엔텍', site_name: '서초 현장', department: '현장 관리소', role: '소장', phone: '010-5678-9012', email: 'hi.jung@dawonentec.co.kr', status: '재직', authority: '현장관리자' },
  { emp_id: 6, name: '강동원', company_name: '다원피엠씨', site_name: '서초 현장', department: '경비반', role: '반장', phone: '010-6789-0123', email: 'dw.kang@dawonpmc.co.kr', status: '휴직', authority: '일반사용자' },
  { emp_id: 7, name: '윤아름', company_name: '정다운세상', site_name: '역삼 빌딩', department: '미화반', role: '사원', phone: '010-7890-1234', email: 'ar.yoon@jungdown.co.kr', status: '퇴사', authority: '일반사용자' },
  { emp_id: 8, name: '한지민', company_name: '미래에이비엠', site_name: '본사', department: '임원', role: '대표이사', phone: '010-8901-2345', email: 'jm.han@miraeabm.co.kr', status: '재직', authority: '본사관리자' },
  { emp_id: 9, name: '송중기', company_name: '다원엔텍', site_name: '연암대학교', department: '기술팀', role: '대리', phone: '010-9012-3456', email: 'jk.song@dawonentec.co.kr', status: '재직', authority: '일반사용자' }
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

// Initialize localStorage if empty
const initLocalStorage = () => {
  // If db_employees exists but doesn't have company_name, we clear it to reload INITIAL_MOCK_EMPLOYEES
  const existingEmployees = localStorage.getItem('db_employees');
  if (existingEmployees) {
    try {
      const parsed = JSON.parse(existingEmployees);
      if (parsed.length > 0 && (!parsed[0].hasOwnProperty('company_name') || !parsed[0].hasOwnProperty('email'))) {
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
            authority: employee.authority || '일반사용자'
          }
        ])
        .select();
 
      if (error) throw error;
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
        authority: employee.authority || '일반사용자'
      };
      list.push(newEmp);
      localStorage.setItem('db_employees', JSON.stringify(list));
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
          authority: e.authority || '일반사용자'
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
          authority: e.authority || '일반사용자'
        };
      });

      const updatedList = [...list, ...newRecords];
      localStorage.setItem('db_employees', JSON.stringify(updatedList));
      return newRecords;
    }
  },

  // 4. Update Employee
  updateEmployee: async (emp_id, updates) => {
    if (db.isSupabaseConnected()) {
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
          authority: updates.authority
        })
        .eq('emp_id', emp_id)
        .select();
 
      if (error) throw error;
      return data[0];
    } else {
      // Demo Mode
      const list = JSON.parse(localStorage.getItem('db_employees') || '[]');
      const idx = list.findIndex(e => e.emp_id === Number(emp_id));
      if (idx === -1) throw new Error('해당 직원을 찾을 수 없습니다.');
      
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
        authority: updates.authority ?? list[idx].authority
      };
      
      localStorage.setItem('db_employees', JSON.stringify(list));
      return list[idx];
    }
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
