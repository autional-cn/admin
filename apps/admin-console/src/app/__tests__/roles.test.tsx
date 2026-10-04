import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import RolesPage from '../roles/page';

vi.mock('@/hooks/use-roles', () => ({
	useRoles: vi.fn(),
	useCreateRole: vi.fn(),
	useUpdateRole: vi.fn(),
	useDeleteRole: vi.fn(),
	useRolePermissions: vi.fn(),
	useAssignRolePermissions: vi.fn(),
	useRemoveRolePermissions: vi.fn(),
}));

vi.mock('@/hooks/use-permissions', () => ({
	usePermissions: vi.fn(),
}));

vi.mock('@/hooks/use-role-hierarchy', () => ({
	useCloneRole: vi.fn(),
}));

vi.mock('@/lib/antd-app', () => ({
	message: { success: vi.fn(), error: vi.fn() },
	modal: { confirm: vi.fn() },
}));

vi.mock('@/lib/error-handler', () => ({
	handleApiError: vi.fn(),
}));

import {
	useRoles,
	useCreateRole,
	useUpdateRole,
	useDeleteRole,
	useRolePermissions,
	useAssignRolePermissions,
	useRemoveRolePermissions,
} from '@/hooks/use-roles';
import { usePermissions } from '@/hooks/use-permissions';
import { useCloneRole } from '@/hooks/use-role-hierarchy';

const mockedUseRoles = vi.mocked(useRoles);
const mockedUseCreateRole = vi.mocked(useCreateRole);
const mockedUseUpdateRole = vi.mocked(useUpdateRole);
const mockedUseDeleteRole = vi.mocked(useDeleteRole);
const mockedUseRolePermissions = vi.mocked(useRolePermissions);
const mockedUseAssignRolePermissions = vi.mocked(useAssignRolePermissions);
const mockedUseRemoveRolePermissions = vi.mocked(useRemoveRolePermissions);
const mockedUsePermissions = vi.mocked(usePermissions);
const mockedUseCloneRole = vi.mocked(useCloneRole);

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

function renderRoles() {
	return render(<RolesPage />, { wrapper: createWrapper() });
}

describe('RolesPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// TASK-AB1-18 起：useRoles/usePermissions 返回 { items, total }（服务端分页单点）
		mockedUseRoles.mockReturnValue(defaultQueryResult({ data: { items: [], total: 0 } }) as any);
		mockedUseCreateRole.mockReturnValue(defaultMutationResult() as any);
		mockedUseUpdateRole.mockReturnValue(defaultMutationResult() as any);
		mockedUseDeleteRole.mockReturnValue(defaultMutationResult() as any);
		mockedUseRolePermissions.mockReturnValue(defaultQueryResult({ data: [] }) as any);
		mockedUseAssignRolePermissions.mockReturnValue(defaultMutationResult() as any);
		mockedUseRemoveRolePermissions.mockReturnValue(defaultMutationResult() as any);
		mockedUsePermissions.mockReturnValue(
			defaultQueryResult({ data: { items: [], total: 0 } }) as any,
		);
		mockedUseCloneRole.mockReturnValue(defaultMutationResult() as any);
	});

	it('renders role list heading', () => {
		renderRoles();

		expect(screen.getByText('角色权限')).toBeInTheDocument();
	});

	it('create role button renders', () => {
		renderRoles();

		expect(screen.getByText('创建角色')).toBeInTheDocument();
	});

	it('role list renders rows when data available', () => {
		const roles = [
			{ id: '1', code: 'admin', name: '管理员', description: '系统管理员', permissionCount: 5 },
			{ id: '2', code: 'editor', name: '编辑', description: '内容编辑', permissionCount: 3 },
		];
		mockedUseRoles.mockReturnValue(
			defaultQueryResult({ data: { items: roles, total: roles.length } }) as any,
		);

		renderRoles();

		expect(screen.getByText('admin')).toBeInTheDocument();
		expect(screen.getByText('管理员')).toBeInTheDocument();
		expect(screen.getByText('editor')).toBeInTheDocument();
	});

	it('shows permission assignment button for each role', () => {
		const roles = [
			{ id: '1', code: 'admin', name: '管理员', description: '系统管理员', permissionCount: 5 },
		];
		mockedUseRoles.mockReturnValue(
			defaultQueryResult({ data: { items: roles, total: roles.length } }) as any,
		);

		renderRoles();

		expect(screen.getByText('分配权限')).toBeInTheDocument();
	});

	it('shows error banner when roles API fails', () => {
		const mockRefetch = vi.fn();
		mockedUseRoles.mockReturnValue(
			defaultQueryResult({ error: new Error('fail'), refetch: mockRefetch }) as any,
		);

		renderRoles();

		expect(screen.getByText('加载角色列表失败')).toBeInTheDocument();
	});

	it('shows loading table when data is loading', () => {
		mockedUseRoles.mockReturnValue(defaultQueryResult({ isLoading: true }) as any);

		renderRoles();

		expect(document.querySelector('.ant-spin')).toBeInTheDocument();
	});

	it('clicking "权限管理" opens drawer', async () => {
		const user = userEvent.setup();
		const roles = [
			{ id: '1', code: 'admin', name: '管理员', description: '系统管理员', permissionCount: 5 },
		];
		mockedUseRoles.mockReturnValue(
			defaultQueryResult({ data: { items: roles, total: roles.length } }) as any,
		);

		renderRoles();

		await user.click(screen.getByText('分配权限'));

		expect(screen.getByText('权限配置 - 管理员')).toBeInTheDocument();
	});
});
