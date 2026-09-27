'use client';

import { extractList, extractItem } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getComplianceStatus,
	getDSARs,
	updateDSAR,
	executeErasure,
	getRetentionPolicies,
	getSODRules,
	getISOControls,
} from '@/lib/api.generated';
import * as Generated from '@autional-cn/shared/generated/api';
import type {
	CreateRetentionPolicyRequest,
	UpdateRetentionPolicyRequest,
	CreateConsentRequest,
	RevokeConsentRequest,
} from '@autional-cn/shared/generated/types';

interface ComplianceStatus {
	score?: number;
	expiredPolicies?: number;
	[key: string]: unknown;
}

interface DSAR {
	id: string;
	requesterEmail: string;
	type: string;
	status: string;
	createdAt: string;
	description?: string;
}

interface RetentionPolicy {
	id: string;
	name: string;
	resourceType: string;
	retentionDays: number;
	actionAfterExpiry: string;
	status: string;
}

interface SODRule {
	id: string;
	name: string;
	roleA: string;
	roleB: string;
	description: string;
}

interface ISOControl {
	id: string;
	controlId: string;
	title: string;
	domain: string;
	complianceStatus: string;
}

interface Consent {
	id: string;
	userId: string;
	scope: string;
	granted: boolean;
	ipAddress?: string;
	recordedAt?: string;
	revokedAt?: string;
	version?: string;
}

export function useComplianceStatus() {
	return useQuery({
		queryKey: queryKeys.compliance.status,
		queryFn: async () => {
			const res = await getComplianceStatus();
			return extractItem<ComplianceStatus>(res) ?? ({} as ComplianceStatus);
		},
	});
}

export function useDSARs() {
	return useQuery({
		queryKey: queryKeys.compliance.dsars,
		queryFn: async () => {
			const res = await getDSARs();
			return extractList<DSAR>(res);
		},
	});
}

export function useUpdateDSAR() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
			updateDSAR(id, data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.compliance.dsars }),
	});
}

export function useExecuteErasure() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => executeErasure(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.compliance.dsars }),
	});
}

export function useRetentionPolicies() {
	return useQuery({
		queryKey: queryKeys.compliance.retentionPolicies,
		staleTime: 300000,
		queryFn: async () => {
			const res = await getRetentionPolicies();
			return extractList<RetentionPolicy>(res);
		},
	});
}

export function useSODRules() {
	return useQuery({
		queryKey: queryKeys.compliance.sodRules,
		staleTime: 300000,
		queryFn: async () => {
			const res = await getSODRules();
			return extractList<SODRule>(res);
		},
	});
}

export function useISOControls() {
	return useQuery({
		queryKey: queryKeys.compliance.isoControls,
		staleTime: 300000,
		queryFn: async () => {
			const res = await getISOControls();
			return extractList<ISOControl>(res);
		},
	});
}

export function useCreateRetentionPolicy() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: Record<string, unknown>) =>
			Generated.adminComplianceRetentionPoliciesPost(
				data as unknown as CreateRetentionPolicyRequest,
			),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.compliance.retentionPolicies }),
	});
}

export function useUpdateRetentionPolicy() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
			Generated.adminComplianceRetentionPoliciesByRetentionPoliciesPut(
				id,
				data as unknown as UpdateRetentionPolicyRequest,
			),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: queryKeys.compliance.retentionPolicies }),
	});
}

export function useConsents() {
	return useQuery({
		queryKey: queryKeys.compliance.consents,
		staleTime: 30000,
		queryFn: async () => {
			const res = await Generated.adminComplianceGdprConsent();
			return extractList<Consent>(res);
		},
	});
}

export function useCreateConsent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: Record<string, unknown>) =>
			Generated.adminComplianceGdprConsentPost(data as unknown as CreateConsentRequest),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.compliance.consents }),
	});
}

export function useRevokeConsent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: { userId: string; purpose: string }) =>
			Generated.adminComplianceGdprConsentDelete(data as unknown as RevokeConsentRequest),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.compliance.consents }),
	});
}
