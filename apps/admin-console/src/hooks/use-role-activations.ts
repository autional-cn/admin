'use client';

import { extractList } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoleActivations, approveActivation, revokeActivation } from '@/lib/api.generated';

export interface RoleActivation {
	id: string;
	tenant_id: string;
	user_id: string;
	role_id: string;
	status: 'active' | 'pending' | 'revoked' | 'expired';
	justification: string;
	activated_at: string;
	expire_at: string;
	revoked_at: string;
	created_at: string;
}

export function useRoleActivations(status?: string) {
	const params: Record<string, string> = {};
	if (status && status !== 'all') {
		params.status = status;
	}
	return useQuery({
		queryKey: [...queryKeys.roleActivations.all, { status }],
		staleTime: 30000,
		queryFn: async () => {
			const res = await getRoleActivations(params);
			return extractList<RoleActivation>(res);
		},
	});
}

export function useApproveActivation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) => approveActivation(id, reason),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roleActivations.all }),
	});
}

export function useRevokeActivation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) => revokeActivation(id, reason),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.roleActivations.all }),
	});
}
