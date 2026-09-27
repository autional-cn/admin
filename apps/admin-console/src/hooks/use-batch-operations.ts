'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import {
	batchAssignRoles,
	batchRemoveRoles,
	batchAssignPermissions,
	batchRevokePermissions,
} from '@/lib/api.generated';

export interface BatchResult {
	total: number;
	succeeded: number;
	failed: number;
	errors?: Array<{ item: string; error: string }>;
}

function extractBatchResult(res: unknown): BatchResult {
	if (res && typeof res === 'object' && 'data' in res) {
		const d = (res as Record<string, unknown>).data;
		if (d && typeof d === 'object') return d as BatchResult;
	}
	if (res && typeof res === 'object' && 'total' in res) return res as BatchResult;
	return { total: 0, succeeded: 0, failed: 0 };
}

export function useBatchAssignRoles() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			userIds: string[];
			roleIds: string[];
			sodOverride?: boolean;
		}): Promise<BatchResult> => {
			const payload: Record<string, unknown> = {
				userIds: data.userIds,
				roleIds: data.roleIds,
			};
			if (data.sodOverride) payload.sod_override = true;
			const res = await batchAssignRoles(payload);
			return extractBatchResult(res);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.batchOperations.all }),
	});
}

export function useBatchRemoveRoles() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: { userIds: string[]; roleIds: string[] }): Promise<BatchResult> => {
			await batchRemoveRoles({ userIds: data.userIds, roleIds: data.roleIds });
			return {
				total: data.roleIds.length + data.userIds.length,
				succeeded: data.roleIds.length + data.userIds.length,
				failed: 0,
			};
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.batchOperations.all }),
	});
}

export function useBatchAssignPermissions() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			roleIds: string[];
			permissionIds: string[];
		}): Promise<BatchResult> => {
			const res = await batchAssignPermissions({
				roleIds: data.roleIds,
				permissionIds: data.permissionIds,
			});
			return extractBatchResult(res);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.batchOperations.all }),
	});
}

export function useBatchRevokePermissions() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: {
			roleIds: string[];
			permissionIds: string[];
		}): Promise<BatchResult> => {
			await batchRevokePermissions({ roleIds: data.roleIds, permissionIds: data.permissionIds });
			return {
				total: data.roleIds.length + data.permissionIds.length,
				succeeded: data.roleIds.length + data.permissionIds.length,
				failed: 0,
			};
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.batchOperations.all }),
	});
}
