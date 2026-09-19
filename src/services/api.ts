import {
  Submission,
  SubmissionDetail,
  SubmissionStats,
  User,
  FormSection,
  FormVersion,
} from '../types/panel';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('propkart_panel_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('propkart_panel_token', token);
  } else {
    localStorage.removeItem('propkart_panel_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(json.message || `Request failed with status ${res.status}`);
    (error as any).status = res.status;
    (error as any).errorCode = json.errorCode;
    throw error;
  }

  return json.data !== undefined ? json.data : json;
}

// ==========================================
// AUTH API
// ==========================================

export async function loginApi(email: string, password: string): Promise<{ token: string; user: User }> {
  const data = await request<{ accessToken: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setAuthToken(data.accessToken);
  return { token: data.accessToken, user: data.user };
}

export async function getMeApi(): Promise<User> {
  const data = await request<any>('/auth/me');
  return data.user || data;
}

// ==========================================
// SUBMISSIONS API
// ==========================================

export interface SubmissionsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  property_type?: string;
  city?: string;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_dir?: string;
}

export async function fetchSubmissions(query: SubmissionsQuery = {}): Promise<{
  submissions: Submission[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}> {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      params.append(k, String(v));
    }
  });

  const res = await fetch(`${BASE_URL}/admin/submissions?${params.toString()}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || 'Failed to fetch submissions');
  }

  const json = await res.json();
  return {
    submissions: json.data || [],
    pagination: json.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
  };
}

export async function fetchSubmissionStats(): Promise<SubmissionStats> {
  return request<SubmissionStats>('/admin/submissions/stats');
}

export async function fetchSubmissionDetail(id: string): Promise<SubmissionDetail> {
  return request<SubmissionDetail>(`/admin/submissions/${id}`);
}

export async function updateSubmissionStatus(id: string, status: string, note?: string): Promise<Submission> {
  return request<Submission>(`/admin/submissions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  });
}

export async function assignSubmission(id: string, assignedTo: string | null): Promise<Submission> {
  return request<Submission>(`/admin/submissions/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assigned_to: assignedTo }),
  });
}

export async function updateSubmissionData(id: string, fields: Record<string, any>): Promise<Submission> {
  return request<Submission>(`/admin/submissions/${id}/data`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
}

export async function addTelecallerNote(id: string, note: string, callStatus?: string): Promise<any> {
  return request(`/admin/submissions/${id}/notes`, {
    method: 'POST',
    body: JSON.stringify({ note, call_status: callStatus }),
  });
}

export async function convertSubmissionToProperty(id: string): Promise<any> {
  return request(`/admin/submissions/${id}/convert-to-property`, {
    method: 'POST',
  });
}

// ==========================================
// FORM BUILDER API
// ==========================================

export async function fetchActiveFormSchema(): Promise<any> {
  return request('/forms/active');
}

export async function fetchVersionSchema(versionId: string): Promise<{
  version: FormVersion;
  sections: FormSection[];
}> {
  return request<{ version: FormVersion; sections: FormSection[] }>(
    `/admin/forms/versions/${versionId}/schema`
  );
}

export async function saveVersionSchema(versionId: string, sections: FormSection[]): Promise<any> {
  return request(`/admin/forms/versions/${versionId}/schema`, {
    method: 'PUT',
    body: JSON.stringify({ sections }),
  });
}

export async function publishFormVersion(versionId: string): Promise<FormVersion> {
  return request<FormVersion>(`/admin/forms/versions/${versionId}/publish`, {
    method: 'POST',
  });
}

export async function createNewDraftVersion(formId: string, changelog?: string): Promise<FormVersion> {
  return request<FormVersion>(`/admin/forms/${formId}/versions`, {
    method: 'POST',
    body: JSON.stringify({ changelog }),
  });
}

export async function fetchTelecallers(): Promise<User[]> {
  try {
    const users = await request<User[]>('/users');
    return users.filter((u) => u.role === 'Telecaller' || u.role === 'Admin' || u.role === 'Sales');
  } catch (e) {
    return [
      { id: '1e61f4f9-6358-4572-9395-6a1ac8d0292b', email: 'telecaller@gmail.com', full_name: 'Telecaller 1', role: 'Telecaller' },
      { id: '1696ca0e-151d-4a05-934a-77507c2b22d4', email: 'telecaller2@gmail.com', full_name: 'Telecaller 2', role: 'Telecaller' },
      { id: 'a0a0da7e-c6ff-411c-9588-9ef3b6f2a679', email: 'jay@nbpropertytech.com', full_name: 'Soni Jaykumar', role: 'Admin' },
    ];
  }
}
