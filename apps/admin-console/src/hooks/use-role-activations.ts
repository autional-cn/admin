'use client';

import { extractList } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoleActivations, approveActivation, revokeActivation } from '@/lib/api.generated';

// RC-5（TASK-AB1-27 补）：契约键 camel 直读（响应拦截器已 snake→camel），禁止 snake 双读。
// wire 锚：service-rbac interfaces.go:134-138 / dto.go:126（user_id/role_id/expire_at/created_at snake json tag）。
export interface RoleActivation {
	id: string;
	tenantId: string;
	userId: string;
	roleId: string;
	status: 'active' | 'pending' | 'revoked' | 'expired';
	justification: string;
	activatedAt: string;
	expireAt: string;
	revokedAt: string;
	createdAt: string;
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
