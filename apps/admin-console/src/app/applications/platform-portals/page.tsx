'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Space, Button, Modal, Form, Input, InputNumber, message, Switch, Empty } from 'antd';
import { getAccessToken, getPortalUrl, API_BASE_URL, PLATFORM_TENANT_ID } from '@autional-cn/shared';
import { useTranslation } from 'react-i18next';
import { PageError } from '@/components/ui/page-status';
import { useTenantId } from '@/hooks/use-tenant';

export default function PlatformPortalsPage() {
	const { t } = useTranslation();
	const token = getAccessToken();
	const tenantId = useTenantId();
	// 平台内置 Portal 属平台租户数据：非平台租户会话隐藏并停取数（U320；语义与 U94 同轴）。
	const isPlatformTenant = tenantId === PLATFORM_TENANT_ID;
	const queryClient = useQueryClient();
	const [modalVisible, setModalVisible] = useState(false);
	const [editingApp, setEditingApp] = useState<any>(null);
	const [form] = Form.useForm();

	const {
		data: portals = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ['platform-portals'],
		queryFn: async () => {
			const res = await fetch(
				`${API_BASE_URL}/tenant/api/v1/admin/tenants/${PLATFORM_TENANT_ID}/applications?type=portal&is_platform=true`,
				{ headers: { Authorization: `Bearer ${token}` } },
			).then((r) => r.json());
			if (res.code !== 0) {
				throw new Error(res.message || 'Failed to load platform portals');
			}
			return Array.isArray(res.data) ? res.data : [];
		},
		enabled: !!token && isPlatformTenant,
		staleTime: 60000,
	});

	const updateMutation = useMutation({
		mutationFn: async (data: { id: string; name: string; description: string; order: number }) => {
			const res = await fetch(
				`${API_BASE_URL}/tenant/api/v1/admin/tenants/${PLATFORM_TENANT_ID}/applications/${data.id}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
					body: JSON.stringify({
						name: data.name,
						description: data.description,
						order: data.order,
					}),
				},
			).then((r) => r.json());
			if (res.code !== 0) {
				throw new Error(res.message || 'Failed to save portal');
			}
			return res;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['platform-portals'] });
			message.success(t('applications.saveSuccess', '保存成功'));
			setModalVisible(false);
		},
		onError: () => message.error(t('applications.saveFailed', '保存失败')),
	});

	const statusMutation = useMutation({
		mutationFn: async (data: { id: string; active: boolean }) => {
			const res = await fetch(
				`${API_BASE_URL}/tenant/api/v1/admin/tenants/${PLATFORM_TENANT_ID}/applications/${data.id}/${data.active ? 'activate' : 'suspend'}`,
				{
					method: 'POST',
					headers: { Authorization: `Bearer ${token}` },
					body: JSON.stringify({ reason: data.active ? '' : 'suspended by admin' }),
				},
			).then((r) => r.json());
			if (res.code !== 0) {
				throw new Error(res.message || 'Failed to update portal status');
			}
			return res;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['platform-portals'] });
			message.success(t('applications.statusUpdated', '状态已更新'));
		},
		onError: () => message.error(t('applications.statusFailed', '状态更新失败')),
	});

	const openEdit = (app: any) => {
		setEditingApp(app);
		form.setFieldsValue({ name: app.name, description: app.description, order: app.order });
		setModalVisible(true);
	};

	const handleSave = async () => {
		const values = await form.validateFields();
		updateMutation.mutate({ id: editingApp.id, ...values });
	};

	const handleToggleStatus = (app: any) => {
		statusMutation.mutate({ id: app.id, active: app.status !== 'active' });
	};

	const columns = [
		{ title: t('applications.column.code'), dataIndex: 'code', key: 'code', width: 100 },
		{
			title: t('applications.column.name'),
			dataIndex: 'name',
			key: 'name',
			render: (_: any, record: any) => (
				<Button type="link" size="small" onClick={() => openEdit(record)} className="p-0">
					{record.name}
				</Button>
			),
		},
		{
			title: t('applications.column.url'),
			key: 'url',
			render: (_: any, record: any) => {
				const url = getPortalUrl(record.code);
				return url ? (
					<a href={url} target="_blank" className="text-xs text-blue-600 hover:underline">
						{url}
					</a>
				) : (
					'-'
				);
			},
		},
		{
			title: t('applications.column.status'),
			dataIndex: 'status',
			key: 'status',
			width: 80,
			render: (_: any, record: any) => (
				<Switch
					checked={record.status === 'active'}
					size="small"
					onChange={() => handleToggleStatus(record)}
					loading={statusMutation.isPending}
				/>
			),
		},
		{
			title: t('applications.column.order'),
			dataIndex: 'order',
			key: 'order',
			width: 60,
		},
		{
			title: t('applications.column.allowedRoles'),
			key: 'roles',
			width: 180,
			render: (_: any, record: any) => {
				const roles = record.config?.portal?.allowed_roles;
				return roles ? (
					<Space size={4} wrap>
						{roles.map((r: string) => (
							<Tag key={r}>{r}</Tag>
						))}
					</Space>
				) : (
					'-'
				);
			},
		},
		{
			title: t('applications.column.oauthClient'),
			key: 'oauth',
			width: 140,
			render: (_: any, record: any) => {
				const clientId = record.config?.portal?.host ? `portal-${record.code}` : '';
				return clientId ? <code className="text-xs">{clientId}</code> : '-';
			},
		},
	];

	if (!isPlatformTenant) {
		return (
			<div>
				<div className="mb-6">
					<h1 className="text-xl font-semibold">
						{t('applications.platformPortals', 'Platform Portals')}
					</h1>
				</div>
				<Empty
					description={t(
						'applications.platformOnlyTenant',
						'平台内置 Portal 属平台租户数据，仅平台租户会话可查看。',
					)}
				/>
			</div>
		);
	}

	if (error) {
		return <PageError message={t('applications.loadError', '加载失败')} retry={refetch} />;
	}

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-xl font-semibold">
					{t('applications.platformPortals', 'Platform Portals')}
				</h1>
				<p className="text-sm text-neutral-500 mt-1">
					{t('applications.platformPortalsDesc', '平台内置的系统 Portal，对所有租户可见。')}{' '}
					{portals.length} {t('applications.portalsCount', 'portals')}
				</p>
			</div>
			<Table
				rowKey="id"
				columns={columns}
				dataSource={portals}
				loading={isLoading}
				pagination={false}
				scroll={{ x: 900 }}
			/>

			<Modal
				title={t('applications.editPortal', '编辑 Portal')}
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				onOk={handleSave}
				confirmLoading={updateMutation.isPending}
			>
				<Form form={form} layout="vertical">
					<Form.Item
						name="name"
						label={t('applications.form.name', '名称')}
						rules={[{ required: true }]}
					>
						<Input />
					</Form.Item>
					<Form.Item name="description" label={t('applications.form.description', '描述')}>
						<Input.TextArea rows={3} />
					</Form.Item>
					<Form.Item
						name="order"
						label={t('applications.form.order', '排序')}
						rules={[{ required: true }]}
					>
						<InputNumber min={0} className="w-full" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
