'use client';
// @generated-api-exempt: 2 key(s) [IDENTITY.ADMIN_DEVICE, IDENTITY.ADMIN_DEVICES] lack generated func

import React, { useState } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import { Button, Space, Modal, Form, Input, Select, Popconfirm, Skeleton } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePageTitle, useTenantSlug } from '@autional-cn/shared';
import { buildNavHref } from '@/lib/nav';
import { PageHeader, StatusBadge, EmptyState, ErrorState } from '@autional-cn/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, API_PATHS, extractItem } from '@autional-cn/shared';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { message } from '@/lib/antd-app';
import { handleApiError } from '@/lib/error-handler';
import { queryKeys } from '@/lib/query-keys';
import { useTenantId } from '@/hooks/use-tenant';

interface DeviceRecord {
	id: string;
	name: string;
	type: string;
	workload_subtype: string;
	hardware_id: string;
	firmware_ver: string;
	manufacturer: string;
	owner_name: string;
	created_at: string;
}

const TYPE_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
	pet: 'info',
	smart_home: 'success',
	office: 'warning',
	sensor: 'info',
};

function typeVariant(s: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
	return TYPE_VARIANT[s] || 'neutral';
}

const TYPE_LABELS: Record<string, string> = {
	pet: 'Pet',
	smart_home: 'Smart Home',
	office: 'Office',
	sensor: 'Sensor',
	iot: 'IoT',
};

function formatDate(iso: string): string {
	if (!iso) return '-';
	return new Date(iso).toLocaleDateString('zh-CN');
}

async function fetchDevices(): Promise<DeviceRecord[]> {
	const res = await apiClient.get(API_PATHS.IDENTITY.ADMIN_DEVICES);
	const data = extractItem(res.data);
	const items = data?.items ?? (Array.isArray(data) ? data : []);
	// API 返回 camelCase（workloadSubtype/hardwareId/firmwareVer/manufacturer/ownerName/createdAt），
	// 映射为页面接口期望的 snake_case 字段
	return (items as Record<string, unknown>[]).map((d) => ({
		id: (d.identityId ?? d.id ?? d.identity_id ?? '') as string,
		name: (d.name as string) || '',
		type: (d.type as string) || '',
		workload_subtype: (d.workloadSubtype ?? d.workload_subtype ?? '') as string,
		hardware_id: (d.hardwareId ?? d.hardware_id ?? '') as string,
		firmware_ver: (d.firmwareVer ?? d.firmware_ver ?? '') as string,
		manufacturer: (d.manufacturer ?? '') as string,
		owner_name: (d.ownerId ?? d.owner_id ?? d.ownerName ?? d.owner_name ?? '') as string,
		created_at: (d.createdAt ?? d.created_at ?? '') as string,
	}));
}

async function createDevice(values: Record<string, unknown>): Promise<DeviceRecord> {
	const res = await apiClient.post(API_PATHS.IDENTITY.ADMIN_DEVICES, values);
	return extractItem(res.data) ?? ({} as DeviceRecord);
}

async function deleteDevice(id: string): Promise<void> {
	await apiClient.delete(API_PATHS.IDENTITY.ADMIN_DEVICE(id));
}

export default function DevicesPage() {
	const { t } = useTranslation();
	usePageTitle(t('devices.title'));
	const navigate = useNavigate();
	const tenantSlug = useTenantSlug();
	const queryClient = useQueryClient();
	const tenantId = useTenantId();
	const [modalVisible, setModalVisible] = useState(false);
	const [form] = Form.useForm();

	const {
		data: devices = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: queryKeys.devices.all(tenantId),
		queryFn: fetchDevices,
		staleTime: 300000,
	});

	const createMut = useMutation({
		mutationFn: createDevice,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices.all(tenantId) }),
	});

	const deleteMut = useMutation({
		mutationFn: deleteDevice,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.devices.all(tenantId) }),
	});

	const handleCreate = async (values: Record<string, unknown>) => {
		try {
			await createMut.mutateAsync(values);
			message.success(t('devices.createSuccess'));
			setModalVisible(false);
			form.resetFields();
		} catch (err) {
			handleApiError(err, t('devices.createFailed'));
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteMut.mutateAsync(id);
			message.success(t('devices.deleteSuccess'));
		} catch (err) {
			handleApiError(err, t('devices.deleteFailed'));
		}
	};

	const columns = [
		{
			title: t('devices.column.name'),
			dataIndex: 'name',
			key: 'name',
			render: (v: string, record: DeviceRecord) => (
				<a onClick={() => navigate(buildNavHref(`/devices/${record.id}`, tenantSlug))} className="font-medium">
					{v}
				</a>
			),
		},
		{
			title: t('devices.column.type'),
			dataIndex: 'workload_subtype',
			key: 'type',
			render: (v: string) => (
				<StatusBadge variant={typeVariant(v)}>
					{t(`devices.type.${v}`, { defaultValue: TYPE_LABELS[v] || v }) || '-'}
				</StatusBadge>
			),
		},
		{
			title: t('devices.column.owner'),
			dataIndex: 'owner_name',
			key: 'owner_name',
			render: (v: string) => v || '-',
		},
		{
			title: t('devices.column.hardwareId'),
			dataIndex: 'hardware_id',
			key: 'hardware_id',
			render: (v: string) => (v ? <code className="text-xs">{v}</code> : '-'),
		},
		{
			title: t('devices.column.firmware'),
			dataIndex: 'firmware_ver',
			key: 'firmware_ver',
			render: (v: string) => v || '-',
		},
		{
			title: t('devices.column.created'),
			dataIndex: 'created_at',
			key: 'created_at',
			render: (v: string) => formatDate(v),
		},
		{
			title: t('devices.column.actions'),
			key: 'action',
			render: (_: unknown, record: DeviceRecord) => (
				<Space size="small">
					<Button
						type="link"
						icon={<EditOutlined />}
						onClick={(e) => {
							e.stopPropagation();
							navigate(buildNavHref(`/devices/${record.id}`, tenantSlug));
						}}
					>
						{t('common.edit')}
					</Button>
					<Popconfirm
						title={t('devices.confirmDelete')}
						description={t('devices.deleteWarning')}
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
				<PageHeader title={t('devices.title')} subtitle={t('devices.subtitle')} />
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => {
						form.resetFields();
						setModalVisible(true);
					}}
				>
					{t('devices.createBtn')}
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
					title={t('devices.loadError')}
					message={t('devices.loadErrorHint')}
					onRetry={() => refetch()}
				/>
			)}

			{!isLoading && !error && devices.length === 0 && (
				<div className="flex flex-col items-center gap-4">
					<EmptyState title={t('devices.emptyTitle')} description={t('devices.emptyDesc')} />
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							form.resetFields();
							setModalVisible(true);
						}}
					>
						{t('devices.createBtn')}
					</Button>
				</div>
			)}

			{!isLoading && !error && devices.length > 0 && (
				<DataTable
					rowKey="id"
					columns={columns}
					dataSource={devices}
					pagination={{ pageSize: 10 }}
					scroll={{ x: 800 }}
					onRow={(record) => ({
						onClick: () => navigate(buildNavHref(`/devices/${record.id}`, tenantSlug)),
						style: { cursor: 'pointer' },
					})}
				/>
			)}

			<Modal
				title={t('devices.createBtn')}
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
						<Input placeholder={t('devices.form.namePlaceholder')} />
					</Form.Item>
					<Form.Item
						name="workload_subtype"
						label={t('devices.form.subtype')}
						rules={[{ required: true }]}
						initialValue="sensor"
					>
						<Select
							options={[
								{ value: 'pet', label: t('devices.type.pet') },
								{ value: 'smart_home', label: t('devices.type.smartHome') },
								{ value: 'office', label: t('devices.type.office') },
								{ value: 'sensor', label: t('devices.type.sensor') },
							]}
						/>
					</Form.Item>
					<Form.Item name="hardware_id" label={t('devices.form.hardwareId')}>
						<Input placeholder={t('devices.form.hardwareIdPlaceholder')} />
					</Form.Item>
					<Form.Item name="firmware_ver" label={t('devices.form.firmware')}>
						<Input placeholder={t('devices.form.firmwarePlaceholder')} />
					</Form.Item>
					<Form.Item name="manufacturer" label={t('devices.form.manufacturer')}>
						<Input placeholder={t('devices.form.manufacturerPlaceholder')} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
