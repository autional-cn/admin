import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers, useUser, useDeleteUser } from './use-users';

vi.mock('@/lib/api.generated', () => ({
	getUsers: vi.fn(),
	getUser: vi.fn(),
	deleteUser: vi.fn(),
	getUserLoginHistories: vi.fn(),
	getUserRoles: vi.fn(),
	assignUserRoles: vi.fn(),
	removeUserRoles: vi.fn(),
	unlockUser: vi.fn(),
	resetUserPassword: vi.fn(),
	resetUserMFA: vi.fn(),
	updateUserStatus: vi.fn(),
}));

import { getUsers, getUser, deleteUser } from '@/lib/api.generated';

const mockedGetUsers = vi.mocked(getUsers);
const mockedGetUser = vi.mocked(getUser);
const mockedDeleteUser = vi.mocked(deleteUser);

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useUsers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns user list with fallback', async () => {
		const users = [{ id: '1', username: 'alice' }];
		mockedGetUsers.mockResolvedValueOnce({ data: { items: users } } as any);

		const { result } = renderHook(() => useUsers({ search: 'ali' }), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(users);
	});
});

describe('useUserDetail', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('fetches user detail by id', async () => {
		const user = { id: '1', username: 'alice' };
		// 真实后端详情响应为 { data: { user: {...}, identities: [...] } }（嵌套 user）
		mockedGetUser.mockResolvedValueOnce({ data: { user, identities: [] } } as any);

		const { result } = renderHook(() => useUser('1'), { wrapper: createWrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(user);
	});
});

describe('useDeleteUser', () => {
	it('calls deleteUser with id', async () => {
		mockedDeleteUser.mockResolvedValueOnce({} as any);

		const { result } = renderHook(() => useDeleteUser(), { wrapper: createWrapper() });

		await result.current.mutateAsync('1');

		expect(mockedDeleteUser).toHaveBeenCalledWith('1');
	});
});
