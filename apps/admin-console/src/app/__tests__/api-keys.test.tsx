import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from '@/i18n/locales/zh-CN.json';
import ApiKeysPage from '../api-keys/page';

i18n.use(initReactI18next).init({
	resources: { 'zh-CN': { translation: zhCN } },
	lng: 'zh-CN',
	fallbackLng: 'zh-CN',
	interpolation: { escapeValue: false },
	react: { useSuspense: false },
});

vi.mock('@/hooks/use-api-keys', () => ({
	useApiKeys: vi.fn(),
	useCreateApiKey: vi.fn(),
	useDeleteApiKey: vi.fn(),
	useRotateApiKey: vi.fn(),
	useUpdateApiKeyScopes: vi.fn(),
	useUpdateApiKeyStatus: vi.fn(),
}));

import {
	useApiKeys,
	useCreateApiKey,
	useDeleteApiKey,
	useRotateApiKey,
} from '@/hooks/use-api-keys';

const mockedUseApiKeys = vi.mocked(useApiKeys);
const mockedUseCreateApiKey = vi.mocked(useCreateApiKey);
const mockedUseDeleteApiKey = vi.mocked(useDeleteApiKey);
const mockedUseRotateApiKey = vi.mocked(useRotateApiKey);

const mockKeys = [
	{
		id: 'ak-1',
		name: '开发环境密钥',
		keyPrefix: 'dev_abc',
		scopes: ['read', 'write'],
		status: 'active',
		environment: 'development',
		createdAt: '2026-01-01T00:00:00Z',
	},
	{
		id: 'ak-2',
		name: '生产环境密钥',
		keyPrefix: 'prod_xyz',
		scopes: ['read'],
		status: 'active',
		environment: 'production',
		createdAt: '2026-01-02T00:00:00Z',
	},
];

function renderPage() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return render(
		<QueryClientProvider client={queryClient}>
			<I18nextProvider i18n={i18n}>
				<ApiKeysPage />
			</I18nextProvider>
		</QueryClientProvider>,
	);
}

describe('ApiKeysPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedUseApiKeys.mockReturnValue({
			data: mockKeys,
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as any);
		mockedUseCreateApiKey.mockReturnValue({
			mutateAsync: vi.fn().mockResolvedValue({ data: { key: 'new-secret-key-123' } }),
			isPending: false,
		} as any);
		mockedUseDeleteApiKey.mockReturnValue({ mutateAsync: vi.fn() } as any);
		mockedUseRotateApiKey.mockReturnValue({
			mutateAsync: vi.fn().mockResolvedValue({ data: { key: 'rotated-key-456' } }),
			isPending: false,
		} as any);
	});

	// === Button Tests ===
	it('renders title', () => {
		renderPage();
		expect(screen.getByText('API 密钥')).toBeTruthy();
	});

	it('renders create button', () => {
		renderPage();
		expect(screen.getByText('创建 API 密钥')).toBeTruthy();
	});

	// === Table Tests ===
	it('renders table with key names', () => {
		renderPage();
		expect(screen.getByText('开发环境密钥')).toBeTruthy();
		expect(screen.getByText('生产环境密钥')).toBeTruthy();
	});

	it('displays key prefix truncated', () => {
		renderPage();
		expect(screen.getByText(/dev_abc/)).toBeTruthy();
	});

	it('displays environment info', () => {
		renderPage();
		expect(screen.getByText('development')).toBeTruthy();
		expect(screen.getByText('production')).toBeTruthy();
	});

	// === State Tests: empty ===
	it('shows empty state when no data', () => {
		mockedUseApiKeys.mockReturnValue({
			data: [],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		} as any);
		renderPage();
		expect(screen.queryByText('开发环境密钥')).toBeNull();
	});

	// === State Tests: loading ===
	it('shows loading spinner', () => {
		mockedUseApiKeys.mockReturnValue({
			data: [],
			isLoading: true,
			error: null,
			refetch: vi.fn(),
		} as any);
		renderPage();
		expect(document.querySelector('.ant-spin')).toBeTruthy();
	});

	// === State Tests: error ===
	it('shows error state', () => {
		mockedUseApiKeys.mockReturnValue({
			data: [],
			isLoading: false,
			error: new Error('API Error'),
			refetch: vi.fn(),
		} as any);
		renderPage();
		expect(screen.getByText('加载 API 密钥失败')).toBeTruthy();
	});
});
