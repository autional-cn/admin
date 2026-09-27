'use client';

import { extractItem, extractList } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';
import type { NotificationStatsResponse, ReadReportResponse } from '@autional-cn/shared/generated/types';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getNotificationTemplates,
	getNotificationStats,
	createNotificationTemplate,
	updateNotificationTemplate,
	deleteNotificationTemplate,
	testNotification,
	getNotificationsReadReport,
	broadcastNotification,
} from '@/lib/api.generated';
import * as Generated from '@autional-cn/shared/generated/api';

export interface TrendPoint {
	date: string;
	sent: number;
	read: number;
}

export interface NotificationTemplateRecord {
	id: string;
	name: string;
	channel: 'inapp' | 'email' | 'sms' | 'push';
	status: 'active' | 'inactive';
	updatedAt: string;
	contentZh?: string;
	contentEn?: string;
}

export function useNotificationStats() {
	return useQuery({
		queryKey: queryKeys.notifications.stats,
		staleTime: 30000,
		queryFn: async () => {
			const res = await getNotificationStats();
			const data = extractItem<NotificationStatsResponse>(res);
			return data ?? { totalSent: 0, totalRead: 0, readRate: 0, byType: {} };
		},
	});
}

export function useNotificationTemplates() {
	return useQuery({
		queryKey: queryKeys.notifications.all,
		staleTime: 60000,
		queryFn: async () => {
			const res = await getNotificationTemplates();
			return extractList<NotificationTemplateRecord>(res);
		},
	});
}

export function useCreateNotificationTemplate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createNotificationTemplate,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
	});
}

export function useUpdateNotificationTemplate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
			updateNotificationTemplate(id, data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
	});
}

export function useDeleteNotificationTemplate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteNotificationTemplate,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
	});
}

export function useTestNotification() {
	return useMutation({
		mutationFn: testNotification,
	});
}

export function useNotificationTrend(days: number = 30) {
	return useQuery({
		queryKey: queryKeys.notifications.trend(days),
		staleTime: 60000,
		queryFn: async () => {
			const res = await Generated.notificationsTrend({ days });
			const unwrapped = extractList<TrendPoint>(res);
			return unwrapped;
		},
	});
}

export function useBroadcastNotification() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: broadcastNotification,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.notifications.stats });
		},
	});
}

export function useNotificationsReadReport() {
	return useQuery({
		queryKey: queryKeys.notifications.readReport,
		staleTime: 30000,
		queryFn: async () => {
			const res = await getNotificationsReadReport();
			const data = extractItem<ReadReportResponse>(res);
			return data ?? { readCount: 0, unreadCount: 0, readRate: 0, totalSent: 0 };
		},
	});
}
