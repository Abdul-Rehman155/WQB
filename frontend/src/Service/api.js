const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const request = async (path, options = {}) => {
  // Ensure correct formatting of API paths
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  const url = `${API_BASE_URL}${cleanPath}`;
  
  // --- Token nikalne ka sahi tarika ---
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = storedUser.token || localStorage.getItem('token');

  // Support for FormData (e.g., image/file uploads)
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(data?.message || (typeof data === 'string' ? data : 'Request failed'));
  }

  return data;
};

// --- Auth APIs ---
export const loginUser = (credentials) => request('/auth/login', {
  method: 'POST',
  body: JSON.stringify(credentials)
});

export const registerUser = (userData) => request('/auth/register', {
  method: 'POST',
  body: JSON.stringify(userData)
});

export const getEmailByRole = (role) => request(`/auth/get-email-by-role/${encodeURIComponent(role)}`);

export const forgotPassword = (email) => request('/auth/forgot-password', {
  method: 'POST',
  body: JSON.stringify({ email })
});

export const resetPassword = (resetData) => request('/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify(resetData)
});

// --- Employee APIs ---
export const getEmployees = () => request('/employee');
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const normalizedPath = String(imagePath).replace(/\\/g, '/').replace(/^\/+/, '');
  return `${API_ROOT_URL}/${normalizedPath}`;
};

export const createEmployee = (employeeData) => request('/employee', {
  method: 'POST',
  body: JSON.stringify(employeeData)
});

export const updateEmployee = (id, employeeData) => request(`/employee/${id}`, {
  method: 'PUT',
  body: JSON.stringify(employeeData)
});

export const deleteEmployee = (id) => request(`/employee/${id}`, {
  method: 'DELETE'
});

// --- Events APIs ---
export const getEvents = () => request('/events');
export const createEvent = (eventData) => request('/events', {
  method: 'POST',
  body: JSON.stringify(eventData)
});

// --- Attendance APIs ---
export const getAttendanceByDate = (date) => request(`/attendance/${encodeURIComponent(date)}`);
export const getAttendance = (date) =>
  request(`/attendance${date ? `?date=${encodeURIComponent(date)}` : ''}`);
export const markAttendance = (attendanceData) => request('/attendance', {
  method: 'POST',
  body: JSON.stringify(attendanceData)
});

// --- Leave Balances API ---
export const getLeaveBalances = (year) => 
  request(`/leave-balances?year=${encodeURIComponent(year)}`);

// --- Stats API ---
export const getDashboardStats = () => request('/dashboard-stats');

// UPDATE (CRUD - U)
export const updateLeaveBalance = (data) => 
  request('/leave-balances/update', {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// RESET (CRUD - D)
export const resetLeaveBalance = (data) => 
  request('/leave-balances/reset', {
    method: 'DELETE',
    body: JSON.stringify(data)
  });

export default API_BASE_URL;