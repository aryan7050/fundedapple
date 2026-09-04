const API_BASE = 'http://localhost:4000/api';

function getAuthToken() {
  return sessionStorage.getItem('fundedapple_access_token') || '';
}

function getRefreshToken() {
  return sessionStorage.getItem('fundedapple_refresh_token') || '';
}

function clearAuthAndRedirect() {
  sessionStorage.removeItem('fundedappleLoggedIn');
  sessionStorage.removeItem('fundedappleAccount');
  sessionStorage.removeItem('fundedapple_access_token');
  sessionStorage.removeItem('fundedapple_refresh_token');
  sessionStorage.removeItem('fundedapple_user');
  sessionStorage.removeItem('fundedapple_user_name');
  if (!window.location.pathname.endsWith('login.html')) {
    window.location.href = 'login.html';
  }
}

// Multiple API calls can hit a 401 around the same moment (e.g. a page
// that fires several requests on load). Sharing one in-flight refresh
// promise stops that from firing the /auth/refresh endpoint multiple
// times in parallel.
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};
        if (!response.ok) throw new Error(data.error || 'Session refresh failed');
        sessionStorage.setItem('fundedapple_access_token', data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

const AUTH_ENDPOINTS_NO_RETRY = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/verify-email', '/auth/resend-otp'];

async function apiRequest(path, options = {}, isRetry = false) {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const isAuthEndpoint = AUTH_ENDPOINTS_NO_RETRY.some((p) => path.startsWith(p));

    // Access token expired mid-session — refresh it once, silently,
    // and retry the exact same request instead of surfacing an error.
    if (response.status === 401 && !isRetry && !isAuthEndpoint && getRefreshToken()) {
      try {
        await refreshAccessToken();
        return apiRequest(path, options, true);
      } catch (refreshError) {
        // Refresh token itself is invalid/expired (e.g. after 7 days) —
        // this is the one case where the user genuinely needs to log in again.
        clearAuthAndRedirect();
        throw new Error('Your session expired. Please log in again.');
      }
    }

    const err = new Error(data.error || 'Request failed');
    err.data = data;
    throw err;
  }

  return data;
}

async function registerUser(payload) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function loginUser(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function fetchGoogleClientId() {
  return apiRequest('/auth/google-client-id');
}

async function googleSignIn(credential) {
  return apiRequest('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

async function uploadKycDocument(file, side, isRetry = false) {
  if (!(file instanceof File)) {
    throw new Error('Please select a valid image file.');
  }

  if (side !== 'front' && side !== 'back') {
    throw new Error('Invalid document side.');
  }

  const token = getAuthToken();
  if (!token) {
    throw new Error('Your session has expired. Please log in again.');
  }

  const formData = new FormData();
  formData.append('document', file, file.name || `${side}.jpg`);
  formData.append('side', side);

  let response;

  try {
    response = await fetch(`${API_BASE}/kyc/upload-document`, {
      method: 'POST',
      headers: {
        // IMPORTANT: do NOT set Content-Type here.
        // The browser adds multipart/form-data + the correct boundary.
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch (networkError) {
    throw new Error('Could not connect to the backend. Make sure the backend is running on port 4000.');
  }

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (_parseError) {
    data = { error: text || 'Upload failed.' };
  }

  // KYC upload uses a multipart request, so it cannot go through
  // apiRequest(). Handle access-token refresh explicitly here.
  if (response.status === 401 && !isRetry && getRefreshToken()) {
    try {
      await refreshAccessToken();
      return uploadKycDocument(file, side, true);
    } catch (_refreshError) {
      clearAuthAndRedirect();
      throw new Error('Your session expired. Please log in again.');
    }
  }

  if (!response.ok) {
    const err = new Error(
      data.error || `Document upload failed (${response.status}).`
    );
    err.data = data;
    throw err;
  }

  if (!data.url) {
    throw new Error('Upload completed but the server did not return an image URL.');
  }

  return data;
}

async function verifyEmailOtp(payload) {
  return apiRequest('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function resendEmailOtp(payload) {
  return apiRequest('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function fetchPlans() {
  return apiRequest('/plans');
}

async function createCheckoutSession(payload) {
  return apiRequest('/payments/create-checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function confirmPayment(orderId) {
  return apiRequest(`/payments/confirm/${orderId}`);
}

async function fetchPayoutHistory() {
  return apiRequest('/payouts/history');
}

async function requestPayout(payload) {
  return apiRequest('/payouts/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function fetchTickets() {
  return apiRequest('/tickets');
}

async function createTicket(payload) {
  return apiRequest('/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function fetchKycStatus() {
  return apiRequest('/kyc/status');
}

async function submitKyc(payload) {
  return apiRequest('/kyc/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function fetchAdminDashboard() {
  return apiRequest('/admin/dashboard');
}

async function fetchAdminKyc(status) {
  const query = status ? `?status=${status}` : '';
  return apiRequest(`/admin/kyc${query}`);
}

async function reviewKyc(userId, payload) {
  return apiRequest(`/admin/kyc/${userId}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function fetchAdminTickets() {
  return apiRequest('/admin/tickets');
}

async function updateTicketStatus(ticketId, status) {
  return apiRequest(`/admin/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

async function fetchAdminPayouts() {
  return apiRequest('/admin/payouts');
}

async function updatePayoutStatus(payoutId, status) {
  return apiRequest(`/admin/payouts/${payoutId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

async function fetchAdminOrders() {
  return apiRequest('/admin/orders');
}

async function fetchAdminUsers() {
  return apiRequest('/admin/users');
}

async function fetchDashboardSummary() {
  return apiRequest('/dashboard/summary');
}

async function createOrder(payload) {
  return apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}