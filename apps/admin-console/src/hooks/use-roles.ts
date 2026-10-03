'use client';

import { queryKeys } from '@/lib/query-keys';


import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { extractList, extractItem, useCurrentTenantId } from '@autional-cn/shared';
import {
	getRoles,
	getRole,
	createRole,
	updateRole,
	deleteRole,
	getRolePermissions,
	assignRolePermissions,
	removeRolePermissions,
} from '@/lib/api.generated';

export interface RoleRecord {
	id: string;
	code: string;
	name: string;
	description: string;
	data_scope: string;
	permissionCount?: number;
	permission_count?: number;
}

export type RoleDetail = Record<string, unknown>;

export type RolePermission = Record<string, unknown>;

export function useRoles() {
	const tenantId = useCurrentTenantId() ?? '';
	return useQuery({
		queryKey: queryKeys.roles.all(tenantId),
		staleTime: 300000,
		queryFn: async ({ signal }) => {
			const res = await getRoles(undefined, signal);
			const list = extractList<RoleRecord>(res);
			return list.map((r) => ({
				...r,
				// 后端返回 permission_count（rbac RoleResponse），映射到 permissionCount 供表格展示
				permissionCount:
					r.permissionCount ?? (typeof r.permission_count === 'number' ? r.permission_count : 0),
			}));
		},
	});
}

export function useRole(id: string) {
	const tenantId = useCurrentTenantId() ?? '';
	return useQuery({
		queryKey: queryKeys.roles.detail(tenantId, id),
		staleTime: 300000,
		queryFn: async ({ signal }) => {
			const res = await getRole(id, signal);
			return extractItem<RoleDetail>(res) ?? res;
		},
		enabled: !!id,
	});
}

export function useCreateRole() {
	const tenantId = useCurrentTenantId() ?? '';
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: any) => createRole(data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roles.all(tenantId) }),
	});
}

export function useUpdateRole() {
	const tenantId = useCurrentTenantId() ?? '';
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) => updateRole(id, data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roles.all(tenantId) }),
	});
}

export function useDeleteRole() {
	const tenantId = useCurrentTenantId() ?? '';
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (roleId: string) => deleteRole(roleId),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roles.all(tenantId) }),
	});
}

export function useRolePermissions(roleId: string) {
	const tenantId = useCurrentTenantId() ?? '';
	return useQuery({
		queryKey: queryKeys.roles.permissions(tenantId, roleId),
		staleTime: 300000,
		queryFn: async ({ signal }) => {
			const res = await getRolePermissions(roleId, signal);
			return extractList<RolePermission>(res);
		},
		enabled: !!roleId,
	});
}

export function useAssignRolePermissions() {
	const tenantId = useCurrentTenantId() ?? '';
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ roleId, data }: { roleId: string; data: any }) =>
			assignRolePermissions(roleId, data),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: queryKeys.roles.all(tenantId) as unknown as readonly unknown[],
			}),
	});
}

export function useRemoveRolePermissions() {
	const tenantId = useCurrentTenantId() ?? '';
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ roleId, data }: { roleId: string; data: any }) =>
			removeRolePermissions(roleId, data),
		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: queryKeys.roles.all(tenantId) as unknown as readonly unknown[],
			}),
	});
}
