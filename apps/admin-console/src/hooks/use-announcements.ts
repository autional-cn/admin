'use client';

import { extractListResult } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	getAnnouncements,
	createAnnouncement,
	updateAnnouncement,
	deleteAnnouncement,
	publishAnnouncement,
	unpublishAnnouncement,
} from '@/lib/api.generated';

export interface AnnouncementRecord {
	id: string;
	tenant_id: string;
	title: string;
	content: string;
	status: 'draft' | 'scheduled' | 'published' | 'expired';
	target_roles?: string[];
	publish_at?: string;
	expire_at?: string;
	views: number;
	dismissals: number;
	created_at: string;
	updated_at: string;
}

export interface AnnouncementListParams {
	page?: number;
	page_size?: number;
	status?: string;
	search?: string;
}

export function useAnnouncements(params?: AnnouncementListParams) {
	return useQuery({
		queryKey: [...queryKeys.announcements.all, params],
		staleTime: 300000,
		queryFn: async () => {
			const res = await getAnnouncements(params);
			return extractListResult<AnnouncementRecord>(res);
		},
	});
}

export function useCreateAnnouncement() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createAnnouncement,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all }),
	});
}

export function useUpdateAnnouncement() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
			updateAnnouncement(id, data),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all }),
	});
}

export function useDeleteAnnouncement() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: deleteAnnouncement,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all }),
	});
}

export function usePublishAnnouncement() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: publishAnnouncement,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all }),
	});
}

export function useUnpublishAnnouncement() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: unpublishAnnouncement,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.announcements.all }),
	});
}
