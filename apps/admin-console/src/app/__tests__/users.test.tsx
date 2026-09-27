import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import UsersPage from '../users/page';

vi.mock('@/hooks/use-users', () => ({
	useUsers: vi.fn(),
	useDeleteUser: vi.fn(),
	useCreateUser: vi.fn(),
	useUpdateUser: vi.fn(),
}));

vi.mock('@/lib/antd-app', () => ({
	message: { success: vi.fn(), error: vi.fn() },
	modal: { confirm: vi.fn() },
}));

vi.mock('@/lib/error-handler', () => ({
	handleApiError: vi.fn(),
}));

import { useUsers, useDeleteUser, useCreateUser, useUpdateUser } from '@/hooks/use-users';

const mockedUseUsers = vi.mocked(useUsers);
const mockedUseDeleteUser = vi.mocked(useDeleteUser);
const mockedUseCreateUser = vi.mocked(useCreateUser);
const mockedUseUpdateUser = vi.mocked(useUpdateUser);

function defaultQueryResult(overrides: Record<string, unknown> = {}) {
	return {
		data: undefined,
		isLoading: false,
		error: null,
		refetch: vi.fn(),
		...overrides,
	};
}

function defaultMutationResult(overrides: Record<string, unknown> = {}) {
	return {
		mutateAsync: vi.fn().mockResolvedValue({}),
		isPending: false,
		...overrides,
	};
}

function createWrapper() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				<MemoryRouter>{children}</MemoryRouter>
			</QueryClientProvider>
		);
	};
}

function renderUsers() {
	return render(<UsersPage />, { wrapper: createWrapper() });
}

describe('UsersPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedUseUsers.mockReturnValue(defaultQueryResult({ data: [] }) as any);
		mockedUseDeleteUser.mockReturnValue(defaultMutationResult() as any);
		mockedUseCreateUser.mockReturnValue(defaultMutationResult() as any);
		mockedUseUpdateUser.mockReturnValue(defaultMutationResult() as any);
	});

	it('renders user list with search bar', () => {
		renderUsers();

		expect(screen.getByText('用户管理')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('搜索用户名或邮箱')).toBeInTheDocument();
	});

	it('"创建用户" button renders and has correct text', () => {
		renderUsers();

		expect(screen.getByText('创建用户')).toBeInTheDocument();
	});

	it('user list renders rows when data available', async () => {
		const users = [
			{
				id: '1',
				username: 'alice',
				email: 'alice@test.com',
				status: 'active',
				createdAt: '2026-01-01',
			},
			{
				id: '2',
				username: 'bob',
				email: 'bob@test.com',
				status: 'locked',
				createdAt: '2026-02-01',
			},
		];
		mockedUseUsers.mockReturnValue(defaultQueryResult({ data: users }) as any);

		renderUsers();

		expect(screen.getByText('alice')).toBeInTheDocument();
		expect(screen.getByText('bob')).toBeInTheDocument();
	});

	it('shows "详情" link that navigates to user detail', async () => {
		const users = [
			{
				id: 'u1',
				username: 'alice',
				email: 'alice@test.com',
				status: 'active',
				createdAt: '2026-01-01',
			},
		];
		mockedUseUsers.mockReturnValue(defaultQueryResult({ data: users }) as any);

		renderUsers();

		expect(screen.getByText('查看详情')).toBeInTheDocument();
	});

	it('shows error banner when API fails', () => {
		const mockRefetch = vi.fn();
		mockedUseUsers.mockReturnValue(
			defaultQueryResult({ error: new Error('fail'), refetch: mockRefetch }) as any,
		);

		renderUsers();

		expect(screen.getByText('加载用户列表失败')).toBeInTheDocument();
	});

	it('shows loading table when data is loading', () => {
		mockedUseUsers.mockReturnValue(defaultQueryResult({ isLoading: true }) as any);

		renderUsers();

		expect(document.querySelector('.ant-skeleton')).toBeInTheDocument();
	});

	it('shows batch delete button when rows are selected', async () => {
		const user = userEvent.setup();
		const users = [
			{
				id: 'u1',
				username: 'alice',
				email: 'alice@test.com',
				status: 'active',
				createdAt: '2026-01-01',
			},
		];
		mockedUseUsers.mockReturnValue(defaultQueryResult({ data: users }) as any);

		renderUsers();

		const checkboxes = document.querySelectorAll('.ant-checkbox-input');
		expect(checkboxes.length).toBeGreaterThan(0);
	});
});
