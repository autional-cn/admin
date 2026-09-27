'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { extractList } from '@autional-cn/shared';
import { queryKeys } from '@/lib/query-keys';
import { useTenantId } from '@/hooks/use-tenant';
import { getRoles } from '@/lib/api.generated';

interface RoleRecord {
	id: string;
	name?: string;
	code?: string;
}

export function useRolesForSelect() {
	const tenantId = useTenantId();
	const { data: roles = [] } = useQuery({
		queryKey: queryKeys.roles.all(tenantId),
		staleTime: 60000,
		queryFn: async () => {
			const res = await getRoles();
			return extractList<RoleRecord>(res);
		},
	});

	return useMemo(
		() =>
			roles.map((r) => ({
				value: r.id,
				label: r.name || r.code || r.id,
			})),
		[roles],
	);
}
