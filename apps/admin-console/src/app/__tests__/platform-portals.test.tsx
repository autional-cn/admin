import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlatformPortalsPage from '../applications/platform-portals/page';

vi.mock('@/hooks/use-tenant', () => ({
	useTenantId: vi.fn(),
}));

vi.mock('@autional-cn/shared', () => ({
	getAccessToken: vi.fn(() => 'test-token'),
	getPortalUrl: vi.fn((code: string) => `https://${code}.portal.test`),
	API_BASE_URL: 'https://api.test',
}));

import { useTenantId } from '@/hooks/use-tenant';

const mockedUseTenantId = vi.mocked(useTenantId);

const PLATFORM_TENANT_ID = '01KSQCBNVMS6SX64PJS937CE33';
const OTHER_TENANT_ID = '01AAAA1111BBBB2222CCCC3333';

const portalFixture = {
	id: 'p-1',
	code: 'platform-admin',
	name: '平台管理台',
	description: '平台内置管理台',
	status: 'active',
	order: 1,
	config: { portal: { allowed_roles: ['super_admin'], host: 'platform-admin.portal.test' } },
};

function createWrapper() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

function renderPage() {
	return render(<PlatformPortalsPage />, { wrapper: createWrapper() });
}

describe('PlatformPortalsPage (U320)', () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.clearAllMocks();
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
	});

	it('non-platform tenant: hides portals and does not fetch', async () => {
		mockedUseTenantId.mockReturnValue(OTHER_TENANT_ID);
		renderPage();

		expect(
			await screen.findByText('平台内置 Portal 属平台租户数据，仅平台租户会话可查看。'),
		).toBeInTheDocument();
		expect(document.querySelector('.ant-table')).toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('platform tenant: fetches platform portals and renders rows', async () => {
		mockedUseTenantId.mockReturnValue(PLATFORM_TENANT_ID);
		fetchMock.mockResolvedValue({
			json: async () => ({ code: 0, message: 'ok', data: [portalFixture] }),
		});
		renderPage();

		expect(await screen.findByText('平台管理台')).toBeInTheDocument();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string> }];
		expect(url).toContain(`/tenants/${PLATFORM_TENANT_ID}/applications`);
		expect(url).toContain('is_platform=true');
		expect(init.headers.Authorization).toBe('Bearer test-token');
	});

	it('platform tenant + error envelope: surfaces error instead of swallowing it', async () => {
		mockedUseTenantId.mockReturnValue(PLATFORM_TENANT_ID);
		fetchMock.mockResolvedValue({
			json: async () => ({ code: 500, message: 'boom', data: null }),
		});
		renderPage();

		expect(await screen.findByText('加载应用列表失败')).toBeInTheDocument();
		expect(screen.getByText('重试')).toBeInTheDocument();
	});
});
