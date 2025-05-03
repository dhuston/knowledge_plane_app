import React from 'react';
import { render, act, renderHook } from '@testing-library/react';
import { AdminProvider, useAdmin, AdminViews } from '../AdminContext';

describe('AdminContext', () => {
  it('provides correct default values', () => {
    const { result } = renderHook(() => useAdmin(), {
      wrapper: ({ children }) => <AdminProvider>{children}</AdminProvider>
    });

    expect(result.current.activeView).toBe(AdminViews.DASHBOARD);
    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.breadcrumbs).toEqual([
      { label: 'Admin Console' },
      { label: 'Dashboard' }
    ]);
  });

  it('allows changing the active view', () => {
    const { result } = renderHook(() => useAdmin(), {
      wrapper: ({ children }) => <AdminProvider>{children}</AdminProvider>
    });

    act(() => {
      result.current.setActiveView(AdminViews.USERS);
    });

    expect(result.current.activeView).toBe(AdminViews.USERS);
  });

  it('allows updating breadcrumbs', () => {
    const { result } = renderHook(() => useAdmin(), {
      wrapper: ({ children }) => <AdminProvider>{children}</AdminProvider>
    });

    const newBreadcrumbs = [
      { label: 'Admin Console' },
      { label: 'Users' }
    ];

    act(() => {
      result.current.setBreadcrumbs(newBreadcrumbs);
    });

    expect(result.current.breadcrumbs).toEqual(newBreadcrumbs);
  });

  it('handles refreshData function correctly', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useAdmin(), {
      wrapper: ({ children }) => <AdminProvider>{children}</AdminProvider>
    });

    let refreshPromise: Promise<void>;
    
    act(() => {
      refreshPromise = result.current.refreshData();
    });
    
    // Should set isRefreshing to true immediately
    expect(result.current.isRefreshing).toBe(true);
    
    // Fast-forward timer to complete the refresh
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await refreshPromise;
    
    // Should set isRefreshing back to false after completion
    expect(result.current.isRefreshing).toBe(false);
    
    jest.useRealTimers();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    const { result } = renderHook(() => useAdmin());
    
    expect(result.error).toEqual(Error('useAdmin must be used within an AdminProvider'));
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});