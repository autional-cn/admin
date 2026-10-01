'use client';

import { extractList } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getPointRules,
	createPointRule,
	updatePointRule,
	deletePointRule,
	getPointAccounts,
	batchEarnPoints,
	getPointRiskScore,
	transferPoints,
	exchangePoints,
} from '@/lib/api.generated';
import * as Generated from '@autional-cn/shared/generated/api';
import type {
	FreezePointsRequest,
	UnfreezePointsRequest,
	ExpirePointsRequest,
	UpdateAccountStatusRequest,
	TransferPointsRequest as GenTransferPointsRequest,
	ExchangePointsRequest as GenExchangePointsRequest,
} from '@autional-cn/shared/generated/types';

export interface PointRule {
	id: string;
	name: string;
	triggerCondition: string;
	points: number;
	status: string;
}

export interface PointAccount {
	id: string;
	userId: string;
	userName?: string;
	balance: number;
	totalEarned: number;
	totalSpent: number;
}

export function usePointRules() {
	return useQuery({
		queryKey: queryKeys.points.rules,
		staleTime: 300000,
		queryFn: async () => {
			const res = await getPointRules();
			return extractList<PointRule>(res);
		},
	});
}

export function useCreatePointRule() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createPointRule,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.points.rules }),
	});
}

export function useUpdatePointRule() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
			updatePointRule(id, data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.points.rules }),
	});
}

export function useDeletePointRule() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deletePointRule,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.points.rules }),
	});
}

export function usePointAccounts() {
	return useQuery({
		queryKey: queryKeys.points.accounts,
		staleTime: 300000,
		queryFn: async () => {
			const res = await getPointAccounts();
			return extractList<PointAccount>(res);
		},
	});
}

export function useBatchEarnPoints() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: batchEarnPoints,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.points.accounts });
			queryClient.invalidateQueries({ queryKey: queryKeys.points.rules });
		},
	});
}

export interface PointTransaction {
	id?: string;
	type?: string;
	amount?: number;
	balanceBefore?: number;
	balanceAfter?: number;
	source?: string;
	description?: string;
	userId?: string;
	status?: string;
	createdAt?: string;
}

export function useTestPointRule() {
	return useMutation({
		mutationFn: (params: { id: string; data: { eventType: string } }) =>
			Generated.adminPointRulesTestPost(params.data),
	});
}

export function usePointTransactions(userId: string) {
	return useQuery({
		queryKey: queryKeys.points.transactions(userId),
		staleTime: 60000,
		queryFn: async () => {
			// U316：改接 admin 面（user 面 point 族在 admin 平面被入口平面门禁拒 403）。
			const res = await Generated.adminPointsTransactions({ user_id: userId });
			return extractList<PointTransaction>(res);
		},
		enabled: !!userId,
	});
}

export function usePointRiskScore(userId: string) {
	return useQuery({
		queryKey: queryKeys.points.riskScore(userId),
		staleTime: 300000,
		queryFn: async () => {
			return await getPointRiskScore(userId);
		},
		enabled: !!userId,
	});
}

interface TenantConfig {
	tenantId?: string;
	pointsType?: string;
	exchangeRate?: number;
	defaultExpiryDays?: number;
	expiryMode?: string;
	maxBalance?: number;
	minSpendPoints?: number;
	earnEnabled?: boolean;
	spendEnabled?: boolean;
	expireEnabled?: boolean;
	transferEnabled?: boolean;
	exchangeTransferEnabled?: boolean;
}

export function useTenantConfig() {
	return useQuery({
		queryKey: queryKeys.points.config,
		staleTime: 60000,
		queryFn: async () => {
			const res = await Generated.adminPointsConfig();
			return res?.data as TenantConfig;
		},
	});
}

export function useUpdateTenantConfig() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (data: Partial<TenantConfig>) => {
			const res = await Generated.adminPointsConfigPut(data as Record<string, unknown>);
			return res;
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.points.config }),
	});
}

export function useFreezePoints() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, data }: { userId: string; data: Record<string, unknown> }) =>
			Generated.adminPointsFreezeByPointsPost(userId, data as unknown as FreezePointsRequest),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.points.accounts });
			queryClient.invalidateQueries({ queryKey: ['point-transactions'] });
		},
	});
}

export function useUnfreezePoints() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, data }: { userId: string; data: Record<string, unknown> }) =>
			Generated.adminPointsUnfreezeByPointsPost(userId, data as unknown as UnfreezePointsRequest),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.points.accounts });
			queryClient.invalidateQueries({ queryKey: ['point-transactions'] });
		},
	});
}

export function useExpirePoints() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, data }: { userId: string; data: Record<string, unknown> }) =>
			Generated.adminPointsExpireByPointsPost(userId, data as unknown as ExpirePointsRequest),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.points.accounts });
			queryClient.invalidateQueries({ queryKey: ['point-transactions'] });
		},
	});
}

export function useUpdateAccountStatus() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, data }: { userId: string; data: Record<string, unknown> }) =>
			Generated.adminPointsStatusByPointsPut(userId, data as unknown as UpdateAccountStatusRequest),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.points.accounts });
		},
	});
}

export interface TransferPointsRequest {
	amount: number;
	to_user_id: string;
	description?: string;
	reason?: string;
	source?: string;
}

export interface ExchangePointsRequest {
	amount: number;
	exchange_type?: string;
	description?: string;
	source?: string;
}

export function useTransferPoints() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, data }: { userId: string; data: TransferPointsRequest }) =>
			transferPoints(userId, data as unknown as GenTransferPointsRequest),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.points.accounts });
			queryClient.invalidateQueries({ queryKey: ['point-transactions'] });
		},
	});
}

export function useExchangePoints() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, data }: { userId: string; data: ExchangePointsRequest }) =>
			exchangePoints(userId, data as unknown as GenExchangePointsRequest),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.points.accounts });
			queryClient.invalidateQueries({ queryKey: ['point-transactions'] });
		},
	});
}
