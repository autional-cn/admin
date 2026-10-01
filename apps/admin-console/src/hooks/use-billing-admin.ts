'use client';

import { extractList, extractItem } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Generated from '@autional-cn/shared/generated/api';
import {
	getBillingPlans,
	createBillingPlan,
	updateBillingPlan,
	deleteBillingPlan,
	deleteSubscription,
	changeBillingPlan,
	rollbackPlan,
	extendTrial,
	getRevenueAmortization,
	getDunningSettings,
	updateDunningSettings,
	createCreditNote,
	approveRefund,
	rejectRefund,
	executeRefund,
	getCreditBalance,
	getCreditTransactions,
} from '@/lib/api.generated';

export interface PlanItem {
	id: string;
	code: string;
	name: string;
	description?: string;
	billingCycle: string;
	monthlyPrice?: string;
	yearlyPrice?: string;
	quarterlyPrice?: string;
	weeklyPrice?: string;
	features?: unknown;
	status: string;
	isCustom?: boolean;
	createdAt: string;
}

export interface SubscriptionItem {
	id: string;
	tenantId: string;
	planCode: string;
	planName?: string;
	status: string;
	startDate: string;
	currentPeriodStart?: string;
	currentPeriodEnd?: string;
	trialEndDate?: string;
	seats?: number;
	price?: string;
	createdAt: string;
}

export interface BillingRefundItem {
	id: string;
	tenantId: string;
	invoiceNumber?: string;
	amount: string;
	reason?: string;
	status: string;
	requestedBy?: string;
	approvedBy?: string;
	createdAt: string;
}

export interface RevenueItem {
	period: string;
	planCode?: string;
	totalRevenue: string;
	recognizedRevenue?: string;
	deferredRevenue?: string;
	transactionCount?: number;
}

export interface DunningSettings {
	tenantId: string;
	gracePeriodDays: number;
	autoCancelDays: number;
	status: string;
}

export interface TaxExportItem {
	id: string;
	period: string;
	format: string;
	status: string;
	downloadUrl?: string;
	createdAt: string;
}

export interface BillingAlertItem {
	id: string;
	name: string;
	resourceType: string;
	thresholdPercent: number;
	status: string;
	notificationChannels?: string;
	appId?: string;
	tenantId?: string;
	lastTriggeredAt?: string;
	createdAt: string;
	updatedAt?: string;
}

export function useBillingPlans() {
	return useQuery({
		queryKey: queryKeys.billingAdmin.plans,
		queryFn: async () => {
			const res = await getBillingPlans();
			return extractList<PlanItem>(res);
		},
	});
}

export function useCreatePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: createBillingPlan,
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billingAdmin.plans }),
	});
}

export function useUpdatePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
			updateBillingPlan(id, data),
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billingAdmin.plans }),
	});
}

export function useDeletePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: deleteBillingPlan,
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billingAdmin.plans }),
	});
}

export function useBillingSubscriptions(params?: Record<string, unknown>) {
	return useQuery({
		queryKey: queryKeys.billingAdmin.subscriptions(params),
		queryFn: async () => {
			const res = await Generated.adminBillingSubscriptions(
				params as { page?: number; page_size?: number },
			);
			return extractList<SubscriptionItem>(res);
		},
	});
}

export function useCancelSubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: deleteSubscription,
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billingAdmin.all }),
	});
}

export function useChangePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ tenantId, data }: { tenantId: string; data: Record<string, unknown> }) =>
			changeBillingPlan(tenantId, data),
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billingAdmin.all }),
	});
}

export function useRollbackPlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: rollbackPlan,
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billingAdmin.all }),
	});
}

export function useExtendTrial() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ tenantId, data }: { tenantId: string; data: Record<string, unknown> }) =>
			extendTrial(tenantId, data),
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billingAdmin.all }),
	});
}

export function useBillingRefunds(params?: Record<string, unknown>) {
	return useQuery({
		queryKey: queryKeys.billingAdmin.refunds(params),
		queryFn: async () => {
			const res = await Generated.adminBillingRefundApprovals(params);
			return extractList<BillingRefundItem>(res);
		},
	});
}

export function useApproveRefund() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: approveRefund,
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billingAdmin.refunds() }),
	});
}

export function useRejectRefund() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: rejectRefund,
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billingAdmin.refunds() }),
	});
}

export function useExecuteRefund() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
			executeRefund(id, data),
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billingAdmin.refunds() }),
	});
}

export function useBillingRevenue(params?: Record<string, unknown>) {
	return useQuery({
		queryKey: queryKeys.billingAdmin.revenue(params),
		queryFn: async () => {
			const res = await getRevenueAmortization(params);
			return extractList<RevenueItem>(res);
		},
	});
}

export function useDunningSettings(tenantId: string) {
	return useQuery({
		queryKey: queryKeys.billingAdmin.dunning(tenantId),
		queryFn: async () => {
			const res = await getDunningSettings(tenantId);
			return extractItem<DunningSettings>(res);
		},
		enabled: !!tenantId,
	});
}

export function useUpdateDunningSettings() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ tenantId, data }: { tenantId: string; data: Record<string, unknown> }) =>
			updateDunningSettings(tenantId, data),
		onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.billingAdmin.all }),
	});
}

export function useTaxExport(params?: Record<string, unknown>) {
	return useQuery({
		queryKey: queryKeys.billingAdmin.taxExport(params),
		queryFn: async () => {
			const res = await Generated.adminBillingTaxExports(params);
			return extractList<TaxExportItem>(res);
		},
	});
}

// U316：用量告警读写改接 admin 面（user 面在 admin 平面被入口平面门禁拒 403）
export function useBillingAlerts(params?: Record<string, unknown>) {
	return useQuery({
		queryKey: queryKeys.billingAdmin.alerts(params),
		queryFn: async () => {
			const res = await Generated.adminBillingAlerts(params);
			return extractList<BillingAlertItem>(res);
		},
	});
}

export function useCreateBillingAlert() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (data: Record<string, unknown>) => Generated.adminBillingAlertsPost(data),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['billing-admin', 'alerts'] }),
	});
}

export function useUpdateBillingAlert() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
			Generated.adminBillingAlertsByAlertsPut(id, data),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['billing-admin', 'alerts'] }),
	});
}

export function useDeleteBillingAlert() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => Generated.adminBillingAlertsByAlertsDelete(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['billing-admin', 'alerts'] }),
	});
}

export interface CreditNoteItem {
	creditNoteNumber?: string;
	invoiceNumber?: string;
	amount?: number;
	status?: string;
	reason?: string;
	issuedAt?: string;
	appliedAt?: string;
}

export function useCreditNote(number: string) {
	return useQuery({
		queryKey: queryKeys.billingAdmin.creditNote(number),
		queryFn: async () => {
			const res = await Generated.adminBillingCreditNoteByCreditNote(number);
			return extractItem<CreditNoteItem>(res);
		},
		enabled: !!number,
	});
}

export function useCreateCreditNote() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			invoiceNumber,
			data,
		}: {
			invoiceNumber: string;
			data: Record<string, unknown>;
		}) => createCreditNote(invoiceNumber, data),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['billing-admin', 'credit-notes'] }),
	});
}

export function useCancelCreditNote() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (number: string) => Generated.adminBillingCreditNoteByCreditNotePut(number),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['billing-admin', 'credit-notes'] }),
	});
}

export function useDeleteCreditNote() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (number: string) => Generated.adminBillingCreditNoteByCreditNoteDelete(number),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['billing-admin', 'credit-notes'] }),
	});
}

export interface CreditBalanceItem {
	tenantId?: string;
	balance?: number;
	currency?: string;
	updatedAt?: string;
}

export function useCreditBalance(tenantId: string) {
	return useQuery({
		queryKey: queryKeys.billingAdmin.creditBalance(tenantId),
		queryFn: async () => {
			const res = await getCreditBalance(tenantId);
			return extractItem<CreditBalanceItem>(res);
		},
		enabled: !!tenantId,
	});
}

export interface CreditTransactionItem {
	id?: string;
	tenantId?: string;
	amount?: number;
	balance?: number;
	source?: string;
	sourceId?: string;
	remark?: string;
	createdAt?: string;
	type?: string;
}

export interface CreditTransactionListData {
	items?: CreditTransactionItem[];
	total?: number;
}

export function useCreditTransactions(
	tenantId: string,
	params?: { page?: number; pageSize?: number; source?: string },
) {
	return useQuery({
		queryKey: queryKeys.billingAdmin.creditTransactions(tenantId, params),
		queryFn: async () => {
			// U316：改接 admin 面（user 面 credit-transactions 在 admin 平面被入口平面门禁拒 403）。
			const res = await getCreditTransactions(tenantId, {
				page: params?.page,
				page_size: params?.pageSize,
				source: params?.source,
			});
			const data = res as CreditTransactionListData;
			return data;
		},
		enabled: !!tenantId,
	});
}
