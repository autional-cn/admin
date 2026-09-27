'use client';

import { extractList, extractItem } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';
import { useTenantId } from '@/hooks/use-tenant';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getUsers,
	getUser,
	createUser,
	updateUser,
	deleteUser,
	updateUserStatus,
	unlockUser,
	resetUserPassword,
	resetUserMFA,
	getActiveSessionCount,
} from '@/lib/api.generated';

export interface UserRecord {
	id: string;
	username: string;
	email: string;
	status: string;
	createdAt: string;
	mustChangePassword?: boolean;
	passwordChangedAt?: string;
	passwordStatus?: 'normal' | 'expiring' | 'expired' | 'must_change';
}

export interface UserDetail {
	id: string;
	username: string;
	email: string;
	status: string;
	createdAt: string;
	lastLoginAt?: string;
	mfaEnabled?: boolean;
}

function derivePasswordStatus(u: Record<string, unknown>): 'normal' | 'must_change' {
	if (u.must_change_password) return 'must_change';
	if (!u.password_changed_at) return 'must_change';
	return 'normal';
}

export function useUsers(params?: Record<string, unknown>) {
	const tenantId = useTenantId();
	return useQuery({
		queryKey: queryKeys.users.list(tenantId, params),
		queryFn: async ({ signal }) => {
			const res = await getUsers(params, signal);
			const raw = extractList<Record<string, unknown>>(res);
			return raw.map((u) => ({
				id: String(u.id ?? ''),
				username: (u.username as string) ?? '',
				email: (u.email as string) ?? '',
				status: (u.status as string) ?? '',
				createdAt: (u.created_at as string) ?? '',
				mustChangePassword: u.must_change_password as boolean,
				passwordChangedAt: (u.password_changed_at as string) ?? undefined,
				passwordStatus: derivePasswordStatus(u),
			})) as UserRecord[];
		},
	});
}

export function useActiveSessions() {
	const tenantId = useTenantId();
	return useQuery({
		queryKey: queryKeys.users.activeSessions(tenantId),
		queryFn: async ({ signal }) => {
			const res = await getActiveSessionCount(signal);
			return res?.count ?? 0;
		},
	});
}

export function useUser(id: string) {
	const tenantId = useTenantId();
	return useQuery({
		queryKey: queryKeys.users.detail(tenantId, id),
		queryFn: async ({ signal }) => {
			const res = await getUser(id, signal);
			const item = extractItem<Record<string, unknown>>(res);
			// 后端详情响应为 { data: { user: {...}, identities: [...] } }，
			// 兼容扁平 { data: {...} } 两种形状（真实 API 为嵌套 user 对象）
			const detail = (item?.user ?? item) as UserDetail | null;
			return detail;
		},
		enabled: !!id,
	});
}

export function useCreateUser() {
	const tenantId = useTenantId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: Record<string, unknown>) => createUser(data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all(tenantId) }),
	});
}

export function useUpdateUser() {
	const tenantId = useTenantId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
			updateUser(id, data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all(tenantId) }),
	});
}

export function useDeleteUser() {
	const tenantId = useTenantId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteUser(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all(tenantId) }),
	});
}
