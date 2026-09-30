/**
 * 生成导航链接 URL — 统一带 tenantSlug 绝对路径（与 user/security/platform 门户口径一致）。
 *
 * BrowserRouter basename 恒为 "/"（见 main.tsx），控制台路由挂载在 /:tenantSlug，
 * 因此所有站内导航必须使用带 tenantSlug 的绝对路径（/demo/users），
 * 否则会退化为无 slug 形态：'users' 会被当成租户 slug。
 */
export function buildNavHref(path: string, tenantSlug?: string): string {
	if (typeof window === 'undefined') return path;
	return tenantSlug ? `/${tenantSlug}${path === '/' ? '' : path}` : path;
}

/**
 * 剥离 pathname 的租户段前缀，供菜单选中态/展开态比对使用
 * （菜单 key 是站内相对路径，如 '/users'；location.pathname 是 '/demo/users'）。
 */
export function stripTenantPrefix(pathname: string, tenantSlug?: string): string {
	if (!tenantSlug) return pathname;
	const prefix = `/${tenantSlug}`;
	if (pathname === prefix) return '/';
	if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
	return pathname;
}
