'use client';

// Simple client-side authentication
// In a production app, you would want to use a more robust solution

// Default admin credentials (in a real app, these would be stored securely)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'network-admin';

// Session storage key
const AUTH_TOKEN_KEY = 'network-map-auth-token';

// Check if user is authenticated
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
  return !!token;
}

// Login function
export function login(username: string, password: string): boolean {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // In a real app, you would generate a proper token or use an auth service
    sessionStorage.setItem(AUTH_TOKEN_KEY, 'authenticated');
    return true;
  }
  return false;
}

// Logout function
export function logout(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
} 