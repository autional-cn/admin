import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
	useSecrets,
	useCreateSecret,
	useUpdateSecret,
	useDeleteSecret,
	useRotateSecret,
	useRevokeSecret,
	type SecretRecord,
} from './use-secrets';

vi.mock('@/lib/api.generated', () => ({
	getSecrets: vi.fn(),
	createSecret: vi.fn(),
	updateSecret: vi.fn(),
	deleteSecret: vi.fn(),
	rotateSecret: vi.fn(),
	revokeSecret: vi.fn(),
}));

import {
	getSecrets,
	createSecret,
	updateSecret,
	deleteSecret,
	rotateSecret,
	revokeSecret,
} from '@/lib/api.generated';

const mockedGetSecrets = vi.mocked(getSecrets);
const mockedCreateSecret = vi.mocked(createSecret);
const mockedUpdateSecret = vi.mocked(updateSecret);
const mockedDeleteSecret = vi.mocked(deleteSecret);
const mockedRotateSecret = vi.mocked(rotateSecret);
const mockedRevokeSecret = vi.mocked(revokeSecret);

function createWrapper() {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

const mockSecret: SecretRecord = {
	id: 'sec_001',
	key: 'jwt/private-key',
	description: 'JWT signing key',
	version: 1,
	status: 'active',
	createdAt: '2025-01-15T10:30:00Z',
	updatedAt: '2025-01-15T10:30:00Z',
};

describe('useSecrets', () => {
	beforeEach(() => vi.clearAllMocks());

	it('returns secrets list on success', async () => {
		mockedGetSecrets.mockResolvedValueOnce({ data: { items: [mockSecret], total: 1 } } as any);

		const { result } = renderHook(() => useSecrets(), { wrapper: createWrapper() });
		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data).toEqual([mockSecret]);
		expect(mockedGetSecrets).toHaveBeenCalledWith(undefined);
	});

	it('passes filter params to API', async () => {
		mockedGetSecrets.mockResolvedValueOnce({ data: { items: [], total: 0 } } as any);

		const { result } = renderHook(
			() => useSecrets({ prefix: 'jwt/', status: 'active', page: 1, page_size: 20 }),
			{ wrapper: createWrapper() },
		);
		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(mockedGetSecrets).toHaveBeenCalledWith(
			expect.objectContaining({ prefix: 'jwt/', status: 'active', page: 1, page_size: 20 }),
		);
	});

	it('returns empty array when no items', async () => {
		mockedGetSecrets.mockResolvedValueOnce({} as any);

		const { result } = renderHook(() => useSecrets(), { wrapper: createWrapper() });
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual([]);
	});

	it('returns loading state initially', () => {
		mockedGetSecrets.mockReturnValue(new Promise(() => {}));
		const { result } = renderHook(() => useSecrets(), { wrapper: createWrapper() });
		expect(result.current.isLoading).toBe(true);
	});
});

describe('useCreateSecret', () => {
	beforeEach(() => vi.clearAllMocks());

	it('calls createSecret and invalidates list', async () => {
		mockedCreateSecret.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => useCreateSecret(), { wrapper: createWrapper() });

		await result.current.mutateAsync({
			key: 'api-key',
			value: 'secret-value',
			description: 'test',
		});
		expect(mockedCreateSecret).toHaveBeenCalledWith({
			key: 'api-key',
			value: 'secret-value',
			description: 'test',
		});
	});
});

describe('useUpdateSecret', () => {
	beforeEach(() => vi.clearAllMocks());

	it('calls updateSecret with key and data', async () => {
		mockedUpdateSecret.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => useUpdateSecret(), { wrapper: createWrapper() });

		await result.current.mutateAsync({ key: 'jwt/private-key', data: { description: 'Updated' } });
		expect(mockedUpdateSecret).toHaveBeenCalledWith(
			{ description: 'Updated' },
			{ key: 'jwt/private-key' },
		);
	});
});

describe('useDeleteSecret', () => {
	beforeEach(() => vi.clearAllMocks());

	it('calls deleteSecret with key', async () => {
		mockedDeleteSecret.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => useDeleteSecret(), { wrapper: createWrapper() });

		await result.current.mutateAsync('jwt/private-key');
		expect(mockedDeleteSecret).toHaveBeenCalledWith('jwt/private-key');
	});
});

describe('useRotateSecret', () => {
	beforeEach(() => vi.clearAllMocks());

	it('calls rotateSecret with key and new value', async () => {
		mockedRotateSecret.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => useRotateSecret(), { wrapper: createWrapper() });

		await result.current.mutateAsync({
			key: 'jwt/private-key',
			data: { value: 'new-secret-value' },
		});
		expect(mockedRotateSecret).toHaveBeenCalledWith(
			{ value: 'new-secret-value' },
			{ key: 'jwt/private-key' },
		);
	});
});

describe('useRevokeSecret', () => {
	beforeEach(() => vi.clearAllMocks());

	it('calls revokeSecret with key', async () => {
		mockedRevokeSecret.mockResolvedValueOnce({} as any);
		const { result } = renderHook(() => useRevokeSecret(), { wrapper: createWrapper() });

		await result.current.mutateAsync('jwt/private-key');
		expect(mockedRevokeSecret).toHaveBeenCalledWith({ key: 'jwt/private-key' });
	});
});
