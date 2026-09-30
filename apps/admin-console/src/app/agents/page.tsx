'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Popconfirm, Skeleton } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePageTitle, useTenantSlug } from '@autional-cn/shared';
import { buildNavHref } from '@/lib/nav';
import { PageHeader, StatusBadge, EmptyState, ErrorState } from '@autional-cn/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	adminAgents,
	adminAgentsPost,
	adminAgentsByAgentsDelete,
} from '@autional-cn/shared/generated/api';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { message } from '@/lib/antd-app';
import { handleApiError } from '@/lib/error-handler';
import { queryKeys } from '@/lib/query-keys';
import { useTenantId } from '@/hooks/use-tenant';

interface AgentRecord {
	id: string;
	name: string;
	description: string;
	workload_subtype: string;
	status: string;
	owner_name: string;
	rotation_days: number;
	jit_ttl: string;
	created_at: string;
}

const SUBTYPE_LABELS: Record<string, string> = {
	agent: 'Agent',
	service_account: 'Service Account',
	automation: 'Automation',
};

const SUBTYPE_COLORS: Record<string, string> = {
	agent: 'blue',
	service_account: 'green',
	automation: 'orange',
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
	active: 'success',
	disabled: 'danger',
	suspended: 'warning',
	provisioning: 'info',
};

function statusVariant(s: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
	return STATUS_VARIANT[s] || 'neutral';
}

function formatDate(iso: string): string {
	if (!iso) return '-';
	return new Date(iso).toLocaleDateString('zh-CN');
}

async function fetchAgents(): Promise<AgentRecord[]> {
	const res = await adminAgents();
	const data = res?.data ?? res;
	const items = (data as any)?.items ?? (Array.isArray(data) ? data : []);
	// API 返回 camelCase（workloadSubtype/ownerName/rotationDays/createdAt），映射为接口 snake_case
	return (items as Record<string, unknown>[]).map((d) => ({
		id: (d.identityId ?? d.id ?? d.identity_id ?? '') as string,
		name: (d.name as string) || '',
		description: (d.description as string) || '',
		workload_subtype: (d.workloadSubtype ?? d.workload_subtype ?? '') as string,
		status: (d.status as string) || '',
		owner_name: (d.ownerId ?? d.owner_id ?? d.ownerName ?? d.owner_name ?? '') as string,
		rotation_days: (d.rotationDays ?? d.rotation_days ?? 0) as number,
		jit_ttl: (d.jitTtl ?? d.jit_ttl ?? '') as string,
		created_at: (d.createdAt ?? d.created_at ?? '') as string,
	}));
}

async function createAgent(values: Record<string, unknown>): Promise<AgentRecord> {
	const res = await adminAgentsPost(values as any);
	return res?.data ?? res;
}

async function deleteAgent(id: string): Promise<void> {
	await adminAgentsByAgentsDelete(id);
}

export default function AgentsPage() {
	const { t } = useTranslation();
	usePageTitle(t('agents.title'));
	const navigate = useNavigate();
	const tenantSlug = useTenantSlug();
	const queryClient = useQueryClient();
	const tenantId = useTenantId();
	const [modalVisible, setModalVisible] = useState(false);
	const [form] = Form.useForm();

	const {
		data: agents = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: queryKeys.agents.all(tenantId),
		queryFn: fetchAgents,
		staleTime: 300000,
	});

	const createMut = useMutation({
		mutationFn: createAgent,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.agents.all(tenantId) }),
	});

	const deleteMut = useMutation({
		mutationFn: deleteAgent,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.agents.all(tenantId) }),
	});

	const handleCreate = async (values: Record<string, unknown>) => {
		try {
			await createMut.mutateAsync(values);
			message.success(t('agents.createSuccess'));
			setModalVisible(false);
			form.resetFields();
		} catch (err) {
			handleApiError(err, t('agents.createFailed'));
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteMut.mutateAsync(id);
			message.success(t('agents.deleteSuccess'));
		} catch (err) {
			handleApiError(err, t('agents.deleteFailed'));
		}
	};

	const columns = [
		{
			title: t('agents.column.name'),
			dataIndex: 'name',
			key: 'name',
			render: (v: string, record: AgentRecord) => (
				<a onClick={() => navigate(buildNavHref(`/agents/${record.id}`, tenantSlug))} className="font-medium">
					{v}
				</a>
			),
		},
		{
			title: t('agents.column.subtype'),
			dataIndex: 'workload_subtype',
			key: 'workload_subtype',
			render: (v: string) => (
				<Tag color={SUBTYPE_COLORS[v] || 'default'}>
					{t(`agents.type.${v}`, { defaultValue: SUBTYPE_LABELS[v] || v || '-' })}
				</Tag>
			),
		},
		{
			title: t('agents.column.status'),
			dataIndex: 'status',
			key: 'status',
			render: (v: string) => (
				<StatusBadge variant={statusVariant(v)}>
					{t(`agents.status.${v}`, { defaultValue: v || '-' })}
				</StatusBadge>
			),
		},
		{
			title: t('agents.column.owner'),
			dataIndex: 'owner_name',
			key: 'owner_name',
			render: (v: string) => v || '-',
		},
		{
			title: t('agents.column.created'),
			dataIndex: 'created_at',
			key: 'created_at',
			render: (v: string) => formatDate(v),
		},
		{
			title: t('agents.column.actions'),
			key: 'action',
			render: (_: unknown, record: AgentRecord) => (
				<Space size="small">
					<Button
						type="link"
						icon={<EditOutlined />}
						onClick={(e) => {
							e.stopPropagation();
							navigate(buildNavHref(`/agents/${record.id}`, tenantSlug));
						}}
					>
						{t('common.edit')}
					</Button>
					<Popconfirm
						title={t('agents.confirmDelete')}
						description={t('agents.deleteWarning')}
						onConfirm={() => handleDelete(record.id)}
						okText={t('common.delete')}
						okButtonProps={{ danger: true }}
						cancelText={t('common.cancel')}
					>
						<Button
							type="link"
							danger
							icon={<DeleteOutlined />}
							onClick={(e) => e.stopPropagation()}
						>
							{t('common.delete')}
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div className="p-6">
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
				<PageHeader
					title={t('agents.title')}
					subtitle={t('agents.subtitle')}
				/>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => {
						form.resetFields();
						setModalVisible(true);
					}}
				>
					{t('agents.createBtn')}
				</Button>
			</div>

			{isLoading && (
				<div className="space-y-3">
					<Skeleton active />
					<Skeleton active />
					<Skeleton active />
				</div>
			)}

			{!isLoading && error && (
				<ErrorState
					title={t('agents.loadError')}
					message={t('agents.loadErrorHint')}
					onRetry={() => refetch()}
				/>
			)}

			{!isLoading && !error && agents.length === 0 && (
				<div className="flex flex-col items-center gap-4">
					<EmptyState title={t('agents.emptyTitle')} description={t('agents.emptyDesc')} />
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							form.resetFields();
							setModalVisible(true);
						}}
					>
						{t('agents.createBtn')}
					</Button>
				</div>
			)}

			{!isLoading && !error && agents.length > 0 && (
				<Table
					rowKey="id"
					columns={columns}
					dataSource={agents}
					pagination={{ pageSize: 10 }}
					scroll={{ x: 800 }}
					onRow={(record) => ({
						onClick: () => navigate(buildNavHref(`/agents/${record.id}`, tenantSlug)),
						style: { cursor: 'pointer' },
					})}
				/>
			)}

			<Modal
				title={t('agents.createBtn')}
				open={modalVisible}
				onCancel={() => {
					setModalVisible(false);
					form.resetFields();
				}}
				onOk={() => form.submit()}
				confirmLoading={createMut.isPending}
				destroyOnHidden
				className="w-full max-w-[560px]"
			>
				<Form form={form} layout="vertical" onFinish={handleCreate}>
					<Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}>
						<Input placeholder={t('agents.form.namePlaceholder')} />
					</Form.Item>
					<Form.Item name="description" label={t('common.description')}>
						<Input.TextArea rows={3} placeholder={t('agents.form.descPlaceholder')} />
					</Form.Item>
					<Form.Item
						name="workload_subtype"
						label={t('agents.form.subtype')}
						rules={[{ required: true }]}
						initialValue="agent"
					>
						<Select
							options={[
								{ value: 'agent', label: t('agents.subtype.agent') },
								{ value: 'service_account', label: t('agents.subtype.serviceAccount') },
								{ value: 'automation', label: t('agents.subtype.automation') },
							]}
						/>
					</Form.Item>
					<Form.Item name="rotation_days" label={t('agents.form.rotationDays')} initialValue={90}>
						<Input type="number" placeholder="90" />
					</Form.Item>
					<Form.Item name="jit_ttl" label="JIT TTL" initialValue="1h">
						<Input placeholder="1h, 30m, 5m" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
