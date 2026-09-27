import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
	useAuditLogs,
	useAuditStats,
	useAuditLogDetail,
	useVerifyAuditChain,
	useExportAuditLogs,
} from './use-audit-logs';

vi.mock('@/lib/api.generated', () => ({
	getAuditLogs: vi.fn(),
	getAuditLogDetail: vi.fn(),
	getAuditStats: vi.fn(),
	verifyAuditChain: vi.fn(),
	exportAuditLogs: vi.fn(),
}));

import {
	getAuditLogs,
	getAuditLogDetail,
	getAuditStats,
	verifyAuditChain,
	exportAuditLogs,
} from '@/lib/api.generated';

const mockedGetAuditLogs = vi.mocked(getAuditLogs);
const mockedGetAuditLogDetail = vi.mocked(getAuditLogDetail);
const mockedGetAuditStats = vi.mocked(getAuditStats);
const mockedVerifyAuditChain = vi.mocked(verifyAuditChain);
const mockedExportAuditLogs = vi.mocked(exportAuditLogs);

function createWrapper() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useAuditLogs', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns audit log list with params', async () => {
		const logs = [{ id: '1', action: 'login' }];
		mockedGetAuditLogs.mockResolvedValueOnce({
			items: logs,
			total: 1,
			pagination: { page: 1, pageSize: 20 },
		} as any);

		const { result } = renderHook(() => useAuditLogs({ action: 'login' }), {
			wrapper: createWrapper(),
		});
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({
			items: logs,
			pagination: { page: 1, pageSize: 20, total: 1 },
		});
		expect(mockedGetAuditLogs).toHaveBeenCalledWith({ action: 'login' }, expect.any(AbortSignal));
	});

	it('returns empty array when no data', async () => {
		mockedGetAuditLogs.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => useAuditLogs(), { wrapper: createWrapper() });
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({
			items: [],
			pagination: { page: 1, pageSize: 10, total: 0 },
		});
	});
});

describe('useAuditStats', () => {
	it('returns stats object', async () => {
		const stats = { total: 100 };
		mockedGetAuditStats.mockResolvedValueOnce({ data: stats } as any);

		const { result } = renderHook(() => useAuditStats(), { wrapper: createWrapper() });
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(stats);
	});
});

describe('useAuditLogDetail', () => {
	it('fetches detail by id', async () => {
		const log = { id: '1', action: 'login' };
		mockedGetAuditLogDetail.mockResolvedValueOnce({ data: log } as any);

		const { result } = renderHook(() => useAuditLogDetail('1'), { wrapper: createWrapper() });
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(log);
	});

	it('is disabled when id is empty', () => {
		const { result } = renderHook(() => useAuditLogDetail(''), { wrapper: createWrapper() });
		expect(result.current.isLoading).toBe(false);
		expect(result.current.fetchStatus).toBe('idle');
	});
});

describe('useVerifyAuditChain', () => {
	it('calls verifyAuditChain', async () => {
		mockedVerifyAuditChain.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => useVerifyAuditChain(), { wrapper: createWrapper() });
		await result.current.mutateAsync({});
		expect(mockedVerifyAuditChain).toHaveBeenCalledWith({});
	});
});

describe('useExportAuditLogs', () => {
	it('calls exportAuditLogs', async () => {
		mockedExportAuditLogs.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => useExportAuditLogs(), { wrapper: createWrapper() });
		await result.current.mutateAsync({ format: 'csv' });
		expect(mockedExportAuditLogs).toHaveBeenCalledWith({ format: 'csv' });
	});
});
