import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';

// Mock the api module
vi.mock('../../services/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api';

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });
  vi.clearAllMocks();
});

describe('authStore', () => {
  it('should have correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('login should update auth state', async () => {
    const mockData = {
      data: {
        user: { id: 'u1', username: 'sylvain', email: 's@test.com', role: 'user' },
        token: 'access-token',
        refreshToken: 'refresh-token',
      },
    };
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    await act(async () => {
      await useAuthStore.getState().login('s@test.com', 'Password1');
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('access-token');
    expect(state.user?.username).toBe('sylvain');
  });

  it('logout should clear auth state', async () => {
    useAuthStore.setState({ user: { id: 'u1' } as any, token: 'tok', isAuthenticated: true });
    (authApi.logout as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await act(async () => {
      await useAuthStore.getState().logout();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('initAuth should set isLoading to false when no token', async () => {
    useAuthStore.setState({ token: null, isLoading: true });
    await act(async () => {
      await useAuthStore.getState().initAuth();
    });
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('initAuth should fetch user when token exists', async () => {
    useAuthStore.setState({ token: 'existing-token', isLoading: true });
    const mockUser = { id: 'u1', username: 'sylvain', email: 's@test.com', role: 'user' };
    (authApi.getMe as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { user: mockUser } });

    await act(async () => {
      await useAuthStore.getState().initAuth();
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.user?.username).toBe('sylvain');
  });

  it('updateUser should merge user fields', () => {
    useAuthStore.setState({
      user: { id: 'u1', username: 'old_name', email: 's@test.com', role: 'user' } as any,
    });
    useAuthStore.getState().updateUser({ username: 'new_name' });
    expect(useAuthStore.getState().user?.username).toBe('new_name');
  });
});
