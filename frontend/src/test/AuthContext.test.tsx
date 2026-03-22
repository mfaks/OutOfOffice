import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthProvider', () => {
  it('starts with no user and no token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('restores persisted auth from localStorage on mount', async () => {
    localStorage.setItem(
      'hermes_auth',
      JSON.stringify({ token: 'abc123', email: 'user@example.com' }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(result.current.user?.email).toBe('user@example.com');
      expect(result.current.token).toBe('abc123');
    });
  });

  it('login sets user and token on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'tok-xyz' }), {
        status: 200,
      }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(() => result.current.login('a@b.com', 'pass'));
    expect(result.current.user?.email).toBe('a@b.com');
    expect(result.current.token).toBe('tok-xyz');
  });

  it('login persists auth to localStorage', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: 'tok-persist' }), {
        status: 200,
      }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(() => result.current.login('b@b.com', 'pass'));
    const stored = JSON.parse(localStorage.getItem('hermes_auth')!);
    expect(stored.token).toBe('tok-persist');
    expect(stored.email).toBe('b@b.com');
  });

  it('login throws on API error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: 'Invalid credentials' }), {
        status: 401,
      }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.login('x@x.com', 'bad');
      } catch (e) {
        error = e as Error;
      }
    });
    expect(error?.message).toBe('Invalid credentials');
  });

  it('logout clears user, token, and localStorage', async () => {
    localStorage.setItem(
      'hermes_auth',
      JSON.stringify({ token: 'tok', email: 'u@u.com' }),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.token).toBe('tok'));
    act(() => result.current.logout());
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('hermes_auth')).toBeNull();
  });
});
