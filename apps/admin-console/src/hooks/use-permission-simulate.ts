'use client';

import { useMutation } from '@tanstack/react-query';
import { simulatePermission } from '@/lib/api.generated';

export interface SimulateCheck {
	resource: string;
	action: string;
}

export interface SimulateResult {
	resource: string;
	action: string;
	allowed: boolean;
}

export function useSimulatePermission() {
	return useMutation({
		mutationFn: (params: { userId: string; checks: SimulateCheck[] }) =>
			simulatePermission({ userId: params.userId, checks: params.checks }),
	});
}
