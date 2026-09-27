'use client';

import { extractList } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';
import { useTenantId } from '@/hooks/use-tenant';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getPermissions,
	createPermission,
	updatePermission,
	deletePermission,
} from '@/lib/api.generated';

export interface PermissionItem {
	id: string;
	code: string;
	name: string;
	description: string;
	category: string;
}

export function usePermissions() {
	const tenantId = useTenantId();
	return useQuery({
		queryKey: queryKeys.permissions.all(tenantId),
		staleTime: 300000,
		queryFn: async ({ signal }) => {
			const res = await getPermissions(undefined, signal);
			return extractList<PermissionItem>(res);
		},
	});
}

export function useCreatePermission() {
	const tenantId = useTenantId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: any) => createPermission(data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all(tenantId) }),
	});
}

export function useUpdatePermission() {
	const tenantId = useTenantId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) => updatePermission(id, data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all(tenantId) }),
	});
}

export function useDeletePermission() {
	const tenantId = useTenantId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (permissionId: string) => deletePermission(permissionId),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all(tenantId) }),
	});
}
