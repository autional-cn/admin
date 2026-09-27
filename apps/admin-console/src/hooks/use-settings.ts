'use client';

import { queryKeys } from '@/lib/query-keys';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Settings page uses updateUser and changePassword directly from api.generated
// This hook file is kept for future SSO/settings expansion
export function useSettings() {
	return useQuery({
		queryKey: queryKeys.settings.all,
		staleTime: 300000,
		queryFn: async () => {
			return {};
		},
	});
}

export function useUpdateSettings() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (_data: Record<string, unknown>) => {
			// placeholder for future settings API
			return {};
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
	});
}
