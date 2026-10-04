// TASK-AB1-15（fix-admin-b1-guard-contract / A-232 · A-233 前端面）：
// compliance 首页两卡恢复 + 写控件精确角色门（useIsAdminRole）。
//
//   AC-AB1-19：security_admin 会话首页自评分卡/策略卡渲染数据（非 403 空态/非受限摘要）。
//   AC-AB1-20：security_admin 会话下写控件（DSAR 标记完成/执行删除、留存编辑、同意撤销、
//              管理策略入口、新建同意、新建策略）不可见；admin 全部可见。
//
// 口径：真实页面 + 真实 useIsAdminRole（shared 精确角色判定）；数据 hooks mock 为固定记录；
// 自评分/策略卡的两条直连 apiClient.get 以 spy 注入 camel 形状 200 响应（与响应拦截器同构）。

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { apiClient, useAuthStore } from '@autional-cn/shared';

vi.mock('@/hooks/use-compliance', () => ({
	useDSARs: () => ({
		data: [
			{
				id: 'd1',
				requesterEmail: 'a@example.com',
				type: 'access',
				status: 'pending',
				createdAt: '2026-01-01',
			},
		],
		isLoading: false,
	}),
	useUpdateDSAR: () => ({ mutateAsync: vi.fn() }),
	useExecuteErasure: () => ({ mutateAsync: vi.fn() }),
	useRetentionPolicies: () => ({
		data: [
			{
				id: 'p1',
				name: '默认留存',
				resourceType: 'audit_logs',
				retentionDays: 365,
				actionAfterExpiry: 'delete',
				status: 'active',
			},
		],
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
	useSODRules: () => ({ data: [], isLoading: false }),
	useISOControls: () => ({ data: [], isLoading: false }),
	useCreateRetentionPolicy: () => ({ mutateAsync: vi.fn() }),
	useUpdateRetentionPolicy: () => ({ mutateAsync: vi.fn() }),
	useConsents: () => ({
		data: [
			{
				id: 'c1',
				userId: 'u1',
				scope: 'marketing',
				granted: true,
				recordedAt: '2026-01-01T00:00:00Z',
				version: 'v1',
			},
		],
		isLoading: false,
	}),
	useCreateConsent: () => ({ mutateAsync: vi.fn() }),
	useRevokeConsent: () => ({ mutateAsync: vi.fn() }),
}));

import CompliancePage from '../page';

const SCORE = 87;
const STANDARDS = [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }, { id: 's5' }, { id: 's6' }, { id: 's7' }];

function seedSession(role: string): void {
	useAuthStore.setState({
		user: { id: 'u-1', username: 'tester' } as never,
		accessToken: 'test-token',
		refreshToken: 'test-refresh',
		tenants: [{ id: 'tenant-a', name: 'Tenant A', role }],
		currentTenantId: 'tenant-a',
		permissions: ['audit:read', 'compliance:read'],
		isAuthenticated: true,
	});
}

function resetAuthStore(): void {
	useAuthStore.setState({
		user: null,
		accessToken: null,
		refreshToken: null,
		tenants: [],
		currentTenantId: null,
		permissions: [],
		isAuthenticated: false,
	});
	window.localStorage.clear();
}

function renderPage() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<MemoryRouter>
				<CompliancePage />
			</MemoryRouter>
		</QueryClientProvider>,
	);
}

async function switchTab(label: string) {
	fireEvent.click(await screen.findByText(label));
}

describe('AC-AB1-19：首页两卡渲染数据（SA 非受限）', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		resetAuthStore();
		vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
			if (String(url).includes('/score')) {
				return { data: { code: 0, message: 'ok', data: { overallScore: SCORE } } } as never;
			}
			return { data: { code: 0, message: 'ok', data: { standards: STANDARDS } } } as never;
		});
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		resetAuthStore();
	});

	it('security_admin：自评分卡/策略卡有值，非受限摘要空态', async () => {
		seedSession('security_admin');
		renderPage();

		expect(await screen.findByText(String(SCORE))).toBeTruthy();
		expect(screen.getByText('合规评分')).toBeTruthy();
		expect(screen.getByText('遵守标准')).toBeTruthy();
		expect(screen.getByText(String(STANDARDS.length))).toBeTruthy();
		// 非 AuditStatsOnly 受限态
		expect(screen.queryByText(/在当前模式下/)).toBeNull();
	});

	it('admin：两卡同样有值（对照组）', async () => {
		seedSession('admin');
		renderPage();

		expect(await screen.findByText(String(SCORE))).toBeTruthy();
		expect(screen.getByText(String(STANDARDS.length))).toBeTruthy();
	});
});

describe('AC-AB1-20：写控件角色门', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		resetAuthStore();
		vi.spyOn(apiClient, 'get').mockImplementation(async () => {
			return { data: { code: 0, message: 'ok', data: { overallScore: 0, standards: [] } } } as never;
		});
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		resetAuthStore();
	});

	describe('security_admin（写控件零渲染）', () => {
		beforeEach(() => {
			seedSession('security_admin');
		});

		it('dashboard：管理策略入口不可见', async () => {
			renderPage();
			await screen.findByText('合规评分');
			expect(screen.queryByText('管理策略')).toBeNull();
		});

		it('DSAR：写按钮不可见，读入口（详情）可见', async () => {
			renderPage();
			await switchTab('GDPR DSAR');
			expect(await screen.findByText('详情')).toBeTruthy();
			expect(screen.queryByText('标记完成')).toBeNull();
			expect(screen.queryByText('执行删除')).toBeNull();
		});

		it('留存策略：新建/编辑均不可见（表格只读）', async () => {
			renderPage();
			await switchTab('留存策略');
			expect(await screen.findByText('默认留存')).toBeTruthy();
			expect(screen.queryByText('新建策略')).toBeNull();
			expect(screen.queryByText('编辑')).toBeNull();
		});

		it('同意管理：新建/撤销均不可见', async () => {
			renderPage();
			await switchTab('同意管理');
			expect(await screen.findByText('marketing')).toBeTruthy();
			expect(screen.queryByText('新建同意记录')).toBeNull();
			expect(screen.queryByText('撤销')).toBeNull();
		});
	});

	describe('admin（写控件全渲染）', () => {
		beforeEach(() => {
			seedSession('admin');
		});

		it('dashboard：管理策略入口可见', async () => {
			renderPage();
			expect(await screen.findByText('管理策略')).toBeTruthy();
		});

		it('DSAR：标记完成/执行删除可见', async () => {
			renderPage();
			await switchTab('GDPR DSAR');
			expect(await screen.findByText('标记完成')).toBeTruthy();
			expect(screen.getByText('执行删除')).toBeTruthy();
		});

		it('留存策略：新建/编辑均可见', async () => {
			renderPage();
			await switchTab('留存策略');
			expect(await screen.findByText('新建策略')).toBeTruthy();
			expect(screen.getByText('编辑')).toBeTruthy();
		});

		it('同意管理：新建/撤销均可见', async () => {
			renderPage();
			await switchTab('同意管理');
			expect(await screen.findByText('新建同意记录')).toBeTruthy();
			expect(screen.getByText('撤销')).toBeTruthy();
		});
	});
});
