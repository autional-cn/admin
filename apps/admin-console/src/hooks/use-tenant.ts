'use client';

import { useAuthStore } from '@autional-cn/shared';

/**
 * Get current tenant ID.
 * Reads from @autional-cn/shared auth store as primary source.
 */
export function useTenantId(): string {
	return useAuthStore((s) => s.currentTenantId) ?? '';
}

/**
 * Get current tenant ID (with fallback).
 * fallback 优先取 tenants[0]（真实租户），避免硬编码 'default-tenant' 导致
 * data-classification 等页面 404（BUG-013）。仅当完全无租户数据时才用 fallback 参数。
 */
export function useTenantIdOr(fallback: string): string {
	const currentTenantId = useAuthStore((s) => s.currentTenantId);
	if (currentTenantId) return currentTenantId;
	const tenants = useAuthStore((s) => s.tenants);
	if (tenants && tenants.length > 0 && tenants[0].id) return tenants[0].id;
	return fallback;
}
