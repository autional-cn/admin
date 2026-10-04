import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRoles, useRole, useCreateRole, useUpdateRole, useDeleteRole } from './use-roles';

// Mock api.generated
vi.mock('@/lib/api.generated', () => ({
	getRoles: vi.fn(),
	getRole: vi.fn(),
	createRole: vi.fn(),
	updateRole: vi.fn(),
	deleteRole: vi.fn(),
	getRolePermissions: vi.fn(),
	assignRolePermissions: vi.fn(),
	removeRolePermissions: vi.fn(),
}));

import { getRoles, getRole, createRole, updateRole, deleteRole } from '@/lib/api.generated';

const mockedGetRoles = vi.mocked(getRoles);
const mockedGetRole = vi.mocked(getRole);
const mockedCreateRole = vi.mocked(createRole);
const mockedUpdateRole = vi.mocked(updateRole);
const mockedDeleteRole = vi.mocked(deleteRole);

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useRoles', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns role list on success', async () => {
		const roles = [{ id: '1', name: 'Admin', code: 'admin' }];
		mockedGetRoles.mockResolvedValueOnce({ data: { items: roles } } as any);

		const { result } = renderHook(() => useRoles(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		// TASK-AB1-18 起：列表返回 { items, total }（A-17 服务端分页单点）；
		// permission_count 契约直读（驼峰）缺省回退 0。
		expect(result.current.data).toEqual({
			items: roles.map((r) => ({ ...r, permissionCount: 0 })),
			total: 0,
		});
	});

	it('falls back to data directly if items missing', async () => {
		const roles = [{ id: '1', name: 'Admin' }];
		mockedGetRoles.mockResolvedValueOnce({ data: roles } as any);

		const { result } = renderHook(() => useRoles(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({
			items: roles.map((r) => ({ ...r, permissionCount: 0 })),
			total: 0,
		});
	});

	it('returns empty list when no data', async () => {
		mockedGetRoles.mockResolvedValueOnce({} as any);

		const { result } = renderHook(() => useRoles(), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({ items: [], total: 0 });
	});
});

describe('useRole', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('fetches single role by id', async () => {
		const role = { id: '1', name: 'Admin' };
		mockedGetRole.mockResolvedValueOnce({ data: role } as any);

		const { result } = renderHook(() => useRole('1'), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(role);
		expect(mockedGetRole).toHaveBeenCalledWith('1', expect.any(AbortSignal));
	});

	it('is disabled when id is empty', () => {
		const { result } = renderHook(() => useRole(''), { wrapper: createWrapper() });
		expect(result.current.isLoading).toBe(false);
		expect(result.current.fetchStatus).toBe('idle');
	});
});

describe('useCreateRole', () => {
	it('calls createRole and invalidates list cache', async () => {
		mockedCreateRole.mockResolvedValueOnce({} as any);

		const { result } = renderHook(() => useCreateRole(), { wrapper: createWrapper() });

		await result.current.mutateAsync({ name: 'New Role', code: 'new-role' });

		expect(mockedCreateRole).toHaveBeenCalledWith({ name: 'New Role', code: 'new-role' });
	});
});

describe('useUpdateRole', () => {
	it('calls updateRole with id and data', async () => {
		mockedUpdateRole.mockResolvedValueOnce({} as any);

		const { result } = renderHook(() => useUpdateRole(), { wrapper: createWrapper() });

		await result.current.mutateAsync({ id: '1', data: { name: 'Updated' } });

		expect(mockedUpdateRole).toHaveBeenCalledWith('1', { name: 'Updated' });
	});
});

describe('useDeleteRole', () => {
	it('calls deleteRole with id', async () => {
		mockedDeleteRole.mockResolvedValueOnce({} as any);

		const { result } = renderHook(() => useDeleteRole(), { wrapper: createWrapper() });

		await result.current.mutateAsync('1');

		expect(mockedDeleteRole).toHaveBeenCalledWith('1');
	});
});
