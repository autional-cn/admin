'use client';

import React from 'react';
import { useNavigate } from 'react-router';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Layout, Button, Space, Typography, Select, Tag } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/ui-store';
import {
	useAuthStore,
	useLogout,
	usePortalCatalog,
	useTenantSlug,
} from '@autional-cn/shared';
import { LanguageSwitcher, PortalSwitcher, ThemeToggle, UserMenu } from '@autional-cn/ui';
import { useTranslation } from 'react-i18next';
import { buildNavHref } from '@/lib/nav';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

/**
 * Header component.
 * Includes sidebar collapse toggle, portal switcher, tenant selector, user menu.
 */
export function Header() {
	const navigate = useNavigate();
	const tenantSlug = useTenantSlug();
	const collapsed = useUIStore((s) => s.sidebarCollapsed);
	const toggleSidebar = useUIStore((s) => s.toggleSidebar);

	const user = useAuthStore((s) => s.user);
	const tenants = useAuthStore((s) => s.tenants);
	const currentTenantId = useAuthStore((s) => s.currentTenantId);
	const switchTenant = useAuthStore((s) => s.switchTenant);
	const handleLogout = useLogout();

	const queryClient = useQueryClient();
	const { t } = useTranslation();

	// 管理面平面（audiences [admin, platform]）：控制台侧走 admin 受众端点
	const { portals } = usePortalCatalog({
		tenantId: currentTenantId,
		slug: tenantSlug,
		audience: 'admin',
	});

	return (
		<AntHeader className="sticky top-0 z-10 flex items-center justify-between h-[var(--layout-header-height)] bg-[var(--color-bg-surface)] px-6 border-b border-[var(--color-border)]">
			<Button
				type="text"
				icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
				onClick={toggleSidebar}
				aria-label={collapsed ? t('header.expandSidebar') : t('header.collapseSidebar')}
				aria-expanded={!collapsed}
			/>

			<Space size="large">
				<PortalSwitcher portals={portals} currentPortal="admin" />
				<LanguageSwitcher />
				<ThemeToggle />
				{tenants.length === 0 ? (
					<Text type="secondary" className="text-xs">
						{t('tenant.noTenants')}
					</Text>
				) : tenants.length === 1 ? (
					<Tag color="blue">{tenants[0].name}</Tag>
				) : (
					<Select
						value={currentTenantId || undefined}
						onChange={(value) => {
							switchTenant(value);
							queryClient.invalidateQueries();
						}}
						options={tenants.map((t) => ({ label: t.name, value: t.id }))}
						className="min-w-40"
						placeholder={t('common.selectTenant')}
						size="small"
						aria-label={t('header.switchTenant')}
					/>
				)}

				<UserMenu
					user={user}
					items={[
						{
							key: 'settings',
							type: 'settings',
							onClick: () => navigate(buildNavHref('/settings', tenantSlug)),
						},
						{ key: 'logout', type: 'logout', onClick: handleLogout },
					]}
				/>
			</Space>
		</AntHeader>
	);
}
