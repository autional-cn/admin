'use client';

import {
	useQuery,
	useMutation,
	useQueryClient,
	type UseQueryOptions,
	type UseMutationOptions,
} from '@tanstack/react-query';

/**
 * Generic API Query Hook factory
 * Wraps useQuery with standard configuration
 */
export function createQueryHook<T, P = void>(
	resourceKey: string,
	fetcher: (params?: P) => Promise<T>,
) {
	return function useApiQuery(
		params?: P,
		options?: Omit<UseQueryOptions<T, Error, T, [string, P | undefined]>, 'queryKey' | 'queryFn'>,
	) {
		return useQuery({
			queryKey: [resourceKey, params],
			queryFn: () => fetcher(params),
			...options,
		});
	};
}

/**
 * Generic API Mutation Hook factory
 * Wraps useMutation, auto-invalidates related queries
 */
export function createMutationHook<TData, TVariables>(
	resourceKey: string,
	mutator: (variables: TVariables) => Promise<TData>,
	invalidateKeys?: string[],
) {
	return function useApiMutation(
		options?: Omit<UseMutationOptions<TData, Error, TVariables>, 'mutationFn'>,
	) {
		const queryClient = useQueryClient();
		return useMutation({
			mutationFn: mutator,
			onSuccess: () => {
				const keysToInvalidate = [resourceKey, ...(invalidateKeys || [])];
				keysToInvalidate.forEach((key) => {
					queryClient.invalidateQueries({ queryKey: [key] });
				});
			},
			...options,
		});
	};
}
