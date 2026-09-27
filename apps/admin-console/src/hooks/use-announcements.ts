'use client';

import { extractList } from '@autional-cn/shared';
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
	title: string;
	type: 'global' | 'targeted';
	status: 'draft' | 'published' | 'archived';
	publishedAt?: string;
	content?: string;
	targets?: string[];
}

export function useAnnouncements() {
	return useQuery({
		queryKey: queryKeys.announcements.all,
		staleTime: 300000,
		queryFn: async () => {
			const res = await getAnnouncements();
			return extractList<AnnouncementRecord>(res);
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
