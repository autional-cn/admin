'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { extractList } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';
import { useTenantId } from '@/hooks/use-tenant';
import { getPermissions } from '@/lib/api.generated';

interface PermissionRecord {
	id: string;
	name?: string;
	code?: string;
}

export function usePermissionsForSelect() {
	const tenantId = useTenantId();
	const { data: perms = [] } = useQuery({
		queryKey: queryKeys.permissions.all(tenantId),
		staleTime: 60000,
		queryFn: async () => {
			const res = await getPermissions();
			return extractList<PermissionRecord>(res);
		},
	});

	return useMemo(
		() =>
			perms.map((p) => ({
				value: p.id,
				label: p.name || p.code || p.id,
			})),
		[perms],
	);
}
