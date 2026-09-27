'use client';

import React from 'react';
import { useNavigate } from 'react-router';
import {
	LogoutOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	UserOutlined,
} from '@ant-design/icons';
import { Layout, Button, Avatar, Dropdown, Space, Typography, Select, Tag } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore, useLogout } from '@autional-cn/shared';
import { LanguageSwitcher, ThemeToggle } from '@autional-cn/ui';
import { useTranslation } from 'react-i18next';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

/**
 * Header component.
 * Includes sidebar collapse toggle, tenant selector, user dropdown.
 */
export function Header() {
	const navigate = useNavigate();
	const collapsed = useUIStore((s) => s.sidebarCollapsed);
	const toggleSidebar = useUIStore((s) => s.toggleSidebar);

	const user = useAuthStore((s) => s.user);
	const tenants = useAuthStore((s) => s.tenants);
	const currentTenantId = useAuthStore((s) => s.currentTenantId);
	const switchTenant = useAuthStore((s) => s.switchTenant);
	const handleLogout = useLogout();

	const queryClient = useQueryClient();
	const { t } = useTranslation();

	const userMenuItems = [
		{
			key: 'profile',
			icon: <UserOutlined />,
			label: t('common.profile'),
			onClick: () => navigate('/settings'),
		},
		{
			key: 'logout',
			icon: <LogoutOutlined />,
			label: t('common.logout'),
			onClick: handleLogout,
		},
	];

	return (
		<AntHeader className="flex items-center justify-between bg-[var(--color-bg-surface)] px-6 border-b border-[var(--color-border)]">
			<Button
				type="text"
				icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
				onClick={toggleSidebar}
				aria-label={collapsed ? t('header.expandSidebar') : t('header.collapseSidebar')}
				aria-expanded={!collapsed}
			/>

			<Space size="large">
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

				<Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
					<Space className="cursor-pointer" aria-label={t('header.userMenu')}>
						<Avatar className="!bg-blue-500">{user?.username?.[0]?.toUpperCase() || 'A'}</Avatar>
						<Text>{user?.username || t('common.admin')}</Text>
					</Space>
				</Dropdown>
			</Space>
		</AntHeader>
	);
}
