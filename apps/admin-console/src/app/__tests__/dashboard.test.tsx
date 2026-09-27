import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../page';

vi.mock('@/hooks/use-users', () => ({
	useUsers: vi.fn(),
	useActiveSessions: vi.fn(),
}));

vi.mock('@/hooks/use-roles', () => ({
	useRoles: vi.fn(),
}));

vi.mock('@/hooks/use-audit-logs', () => ({
	useAuditStats: vi.fn(),
	useAuditLogs: vi.fn(),
}));

vi.mock('@/hooks/use-announcements', () => ({
	useAnnouncements: vi.fn(),
}));

vi.mock('@/hooks/use-dashboard-summary', () => ({
	useTenantSummary: vi.fn(),
}));

import { useUsers, useActiveSessions } from '@/hooks/use-users';
import { useRoles } from '@/hooks/use-roles';
import { useAuditStats, useAuditLogs } from '@/hooks/use-audit-logs';
import { useAnnouncements } from '@/hooks/use-announcements';
import { useTenantSummary } from '@/hooks/use-dashboard-summary';

const mockedUseUsers = vi.mocked(useUsers);
const mockedUseActiveSessions = vi.mocked(useActiveSessions);
const mockedUseRoles = vi.mocked(useRoles);
const mockedUseAuditStats = vi.mocked(useAuditStats);
const mockedUseAuditLogs = vi.mocked(useAuditLogs);
const mockedUseAnnouncements = vi.mocked(useAnnouncements);
const mockedUseTenantSummary = vi.mocked(useTenantSummary);

function defaultQueryResult(overrides: Record<string, unknown> = {}) {
	return {
		data: undefined,
		isLoading: false,
		error: null,
		refetch: vi.fn(),
		...overrides,
	};
}

function createWrapper() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

function renderDashboard() {
	return render(<DashboardPage />, { wrapper: createWrapper() });
}

describe('DashboardPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedUseUsers.mockReturnValue(defaultQueryResult() as any);
		mockedUseActiveSessions.mockReturnValue(defaultQueryResult() as any);
		mockedUseRoles.mockReturnValue(defaultQueryResult() as any);
		mockedUseAuditStats.mockReturnValue(defaultQueryResult() as any);
		mockedUseAuditLogs.mockReturnValue(defaultQueryResult() as any);
		mockedUseAnnouncements.mockReturnValue(defaultQueryResult({ data: [] }) as any);
		mockedUseTenantSummary.mockReturnValue({
			tenantName: 'Test',
			memberCount: 0,
			rolesCount: 0,
			activeSessionsCount: 0,
			apiKeysCount: 0,
			secretsCount: 0,
			isLoading: false,
		} as any);
	});

	it('renders without crashing', () => {
		renderDashboard();
		expect(screen.getByText('仪表盘')).toBeInTheDocument();
	});

	it('shows 4 stat cards: total users, new users today, active sessions, role count', async () => {
		mockedUseUsers.mockReturnValue(defaultQueryResult({ data: [{ id: '1' }] }) as any);
		mockedUseActiveSessions.mockReturnValue(defaultQueryResult({ data: 5 }) as any);
		mockedUseRoles.mockReturnValue(defaultQueryResult({ data: [{ id: '2' }] }) as any);
		mockedUseAuditStats.mockReturnValue(defaultQueryResult({ data: {} }) as any);

		renderDashboard();

		expect(screen.getByText('总用户数')).toBeInTheDocument();
		expect(screen.getByText('今日新增')).toBeInTheDocument();
		expect(screen.getAllByText('活跃会话').length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText('角色数量')).toBeInTheDocument();
	});

	it('shows skeleton placeholders when data is loading', () => {
		mockedUseUsers.mockReturnValue(defaultQueryResult({ isLoading: true }) as any);
		mockedUseActiveSessions.mockReturnValue(defaultQueryResult({ isLoading: true }) as any);
		mockedUseRoles.mockReturnValue(defaultQueryResult({ isLoading: true }) as any);
		mockedUseAuditStats.mockReturnValue(defaultQueryResult({ isLoading: true }) as any);

		renderDashboard();

		const skeletons = document.querySelectorAll('.ant-skeleton');
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it('shows error banner when API fails with retry button', async () => {
		const mockRefetch = vi.fn();
		mockedUseUsers.mockReturnValue(
			defaultQueryResult({ error: new Error('fail'), refetch: mockRefetch }) as any,
		);

		renderDashboard();

		expect(screen.getByText('加载失败')).toBeInTheDocument();
		const retryBtn = screen.getByText('重试');
		expect(retryBtn).toBeInTheDocument();
	});

	it('error renders outside of stat Card container', async () => {
		const mockRefetch = vi.fn();
		mockedUseUsers.mockReturnValue(
			defaultQueryResult({ error: new Error('fail'), refetch: mockRefetch }) as any,
		);

		renderDashboard();

		const errorEl = screen.getByText('加载失败');
		const card = errorEl.closest('.ant-card');
		expect(card).toBeNull();
	});

	it('shows recent logins list when data available', async () => {
		const logins = [
			{
				id: '1',
				timestamp: '2026-05-20T10:00:00Z',
				operatorId: 'Alice',
				status: 200,
				ip: '1.2.3.4',
			},
		];
		mockedUseAuditLogs.mockReturnValue(defaultQueryResult({ data: { items: logins } }) as any);

		renderDashboard();

		expect(screen.getByText('最近登录')).toBeInTheDocument();
		expect(screen.getByText('Alice')).toBeInTheDocument();
	});

	it('shows "0" for stats when empty data returned', () => {
		mockedUseUsers.mockReturnValue(defaultQueryResult({ data: [] }) as any);
		mockedUseActiveSessions.mockReturnValue(defaultQueryResult({ data: 0 }) as any);
		mockedUseRoles.mockReturnValue(defaultQueryResult({ data: [] }) as any);
		mockedUseAuditStats.mockReturnValue(defaultQueryResult({ data: {} }) as any);

		renderDashboard();

		const zeros = screen.getAllByText('0');
		expect(zeros.length).toBeGreaterThanOrEqual(4);
	});
});
