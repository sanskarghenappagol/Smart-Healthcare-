const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('pes_healthcare_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('pes_healthcare_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('pes_healthcare_token');
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password?: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  registerPatient: (patientData: any) =>
    apiRequest('/auth/register-patient', { method: 'POST', body: JSON.stringify(patientData) }),
  getMe: () => apiRequest('/auth/me'),
  switchDemoRole: (role: 'admin' | 'doctor' | 'patient') =>
    apiRequest('/auth/switch-demo', { method: 'POST', body: JSON.stringify({ role }) }),

  // Patients
  getPatients: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/patients${qs}`);
  },
  getPatient: (id: string) => apiRequest(`/patients/${id}`),
  updatePatient: (id: string, data: any) =>
    apiRequest(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePatient: (id: string) => apiRequest(`/patients/${id}`, { method: 'DELETE' }),

  // Doctors
  getDoctors: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/doctors${qs}`);
  },
  getDoctor: (id: string) => apiRequest(`/doctors/${id}`),
  createDoctor: (data: any) => apiRequest('/doctors', { method: 'POST', body: JSON.stringify(data) }),
  updateDoctor: (id: string, data: any) =>
    apiRequest(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addAvailability: (doctorId: string, data: any) =>
    apiRequest(`/doctors/${doctorId}/availability`, { method: 'POST', body: JSON.stringify(data) }),
  deleteAvailability: (doctorId: string, slotId: number) =>
    apiRequest(`/doctors/${doctorId}/availability/${slotId}`, { method: 'DELETE' }),

  // Appointments
  getAppointments: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/appointments${qs}`);
  },
  getAppointment: (id: number) => apiRequest(`/appointments/${id}`),
  bookAppointment: (data: { p_id?: string; doctor_id: string; appointment_date: string }) =>
    apiRequest('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id: number, status: string) =>
    apiRequest(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Prescriptions
  getPrescriptions: () => apiRequest('/prescriptions'),
  getPrescription: (id: number) => apiRequest(`/prescriptions/${id}`),
  createPrescription: (data: any) =>
    apiRequest('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),

  // Medicines
  getMedicines: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/medicines${qs}`);
  },
  createMedicine: (data: any) => apiRequest('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicine: (id: number, data: any) =>
    apiRequest(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adjustStock: (id: number, quantity_change: number) =>
    apiRequest(`/medicines/${id}/adjust-stock`, { method: 'POST', body: JSON.stringify({ quantity_change }) }),

  // Bills & Payments
  getBills: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/bills${qs}`);
  },
  getBill: (id: number) => apiRequest(`/bills/${id}`),
  payBill: (data: { bill_id: number; method: string; amount: number }) =>
    apiRequest('/bills/pay', { method: 'POST', body: JSON.stringify(data) }),

  // MongoDB
  getLabReports: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/mongodb/lab-reports${qs}`);
  },
  createLabReport: (data: any) =>
    apiRequest('/mongodb/lab-reports', { method: 'POST', body: JSON.stringify(data) }),
  updateLabReport: (reportId: string, data: any) =>
    apiRequest(`/mongodb/lab-reports/${reportId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLabReport: (reportId: string) =>
    apiRequest(`/mongodb/lab-reports/${reportId}`, { method: 'DELETE' }),

  getReviews: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/mongodb/reviews${qs}`);
  },
  createReview: (data: any) =>
    apiRequest('/mongodb/reviews', { method: 'POST', body: JSON.stringify(data) }),
  deleteReview: (reviewId: string) =>
    apiRequest(`/mongodb/reviews/${reviewId}`, { method: 'DELETE' }),

  getAuditLogs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/mongodb/audit-logs${qs}`);
  },

  // DBMS Lab & ACID Simulator
  simulateAcidTransaction: (data: { mode: 'commit' | 'rollback'; patient_id?: string; doctor_id?: string; custom_amount?: number }) =>
    apiRequest('/dbms/acid-simulate', { method: 'POST', body: JSON.stringify(data) }),
  getDbmsQueries: () => apiRequest('/dbms/queries'),
  runDbmsQuery: (data: { query_id?: string; custom_sql?: string }) =>
    apiRequest('/dbms/run-query', { method: 'POST', body: JSON.stringify(data) }),

  // Stats
  getOverviewStats: () => apiRequest('/stats/overview'),
  getHealth: () => apiRequest('/health')
};
