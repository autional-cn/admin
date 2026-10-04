import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
	usePermissions,
	useCreatePermission,
	useUpdatePermission,
	useDeletePermission,
} from './use-permissions';

vi.mock('@/lib/api.generated', () => ({
	getPermissions: vi.fn(),
	createPermission: vi.fn(),
	updatePermission: vi.fn(),
	deletePermission: vi.fn(),
}));

import {
	getPermissions,
	createPermission,
	updatePermission,
	deletePermission,
} from '@/lib/api.generated';

const mockedGetPermissions = vi.mocked(getPermissions);
const mockedCreatePermission = vi.mocked(createPermission);
const mockedUpdatePermission = vi.mocked(updatePermission);
const mockedDeletePermission = vi.mocked(deletePermission);

function createWrapper() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('usePermissions', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns permission list', async () => {
		const perms = [{ id: '1', name: 'read:users', code: 'read:users' }];
		mockedGetPermissions.mockResolvedValueOnce({ data: { items: perms } } as any);

		const { result } = renderHook(() => usePermissions(), { wrapper: createWrapper() });
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		// TASK-AB1-18 起：列表返回 { items, total }（A-14 服务端分页单点）。
		expect(result.current.data).toEqual({ items: perms, total: 0 });
	});

	it('returns empty list when no data', async () => {
		mockedGetPermissions.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => usePermissions(), { wrapper: createWrapper() });
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({ items: [], total: 0 });
	});
});

describe('useCreatePermission', () => {
	it('calls createPermission', async () => {
		mockedCreatePermission.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => useCreatePermission(), { wrapper: createWrapper() });
		await result.current.mutateAsync({
			name: 'Test',
			code: 'test',
			resource: 'users',
			action: 'read',
		});
		expect(mockedCreatePermission).toHaveBeenCalledWith({
			name: 'Test',
			code: 'test',
			resource: 'users',
			action: 'read',
		});
	});
});

describe('useUpdatePermission', () => {
	it('calls updatePermission with id and data', async () => {
		mockedUpdatePermission.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => useUpdatePermission(), { wrapper: createWrapper() });
		await result.current.mutateAsync({ id: '1', data: { name: 'Updated' } });
		expect(mockedUpdatePermission).toHaveBeenCalledWith('1', { name: 'Updated' });
	});
});

describe('useDeletePermission', () => {
	it('calls deletePermission with id', async () => {
		mockedDeletePermission.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => useDeletePermission(), { wrapper: createWrapper() });
		await result.current.mutateAsync('1');
		expect(mockedDeletePermission).toHaveBeenCalledWith('1');
	});
});
