'use client';

import { extractList } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';
import { useTenantId } from '@/hooks/use-tenant';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getAbacPolicies,
	createAbacPolicy,
	updateAbacPolicy,
	deleteAbacPolicy,
} from '@/lib/api.generated';

export interface ABACPolicy {
	id: string;
	tenant_id: string;
	name: string;
	description: string;
	priority: number;
	condition: string;
	effect: 'allow' | 'deny';
	enabled: boolean;
	created_at: string;
	updated_at: string;
}

export function useAbacPolicies() {
	const tenantId = useTenantId();
	return useQuery({
		queryKey: queryKeys.abacPolicies.all(tenantId),
		staleTime: 300000,
		queryFn: async ({ signal }) => {
			const res = await getAbacPolicies(undefined, signal);
			return extractList<ABACPolicy>(res);
		},
	});
}

export function useCreateAbacPolicy() {
	const tenantId = useTenantId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: any) => createAbacPolicy(data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.abacPolicies.all(tenantId) }),
	});
}

export function useUpdateAbacPolicy() {
	const tenantId = useTenantId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) => updateAbacPolicy(id, data),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.abacPolicies.all(tenantId) }),
	});
}

export function useDeleteAbacPolicy() {
	const tenantId = useTenantId();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => deleteAbacPolicy(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.abacPolicies.all(tenantId) }),
	});
}
