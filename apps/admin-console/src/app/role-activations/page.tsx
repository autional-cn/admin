'use client';

import React, { useState } from 'react';
import { Button, Space, Tag, Modal, Form, Input, Select } from 'antd';
import { message, modal } from '@/lib/antd-app';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
	useRoleActivations,
	useApproveActivation,
	useRevokeActivation,
} from '@/hooks/use-role-activations';
import type { RoleActivation } from '@/hooks/use-role-activations';
import { handleApiError } from '@/lib/error-handler';
import { PageError, DataTable } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';

const STATUS_MAP: Record<string, { color: string; label: string }> = {
	active: { color: 'green', label: '' },
	pending: { color: 'orange', label: '' },
	revoked: { color: 'red', label: '' },
	expired: { color: 'default', label: '' },
};

export default function RoleActivationsPage() {
	const { t } = useTranslation();
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [actionTarget, setActionTarget] = useState<{
		id: string;
		type: 'approve' | 'revoke';
	} | null>(null);
	const [form] = Form.useForm();

	const {
		data = [],
		isLoading,
		error,
		refetch,
	} = useRoleActivations(statusFilter !== 'all' ? statusFilter : undefined);
	const approveMut = useApproveActivation();
	const revokeMut = useRevokeActivation();

	const statusLabels: Record<string, string> = {
		active: t('roleActivations.statusActive'),
		pending: t('roleActivations.statusPending'),
		revoked: t('roleActivations.statusRevoked'),
		expired: t('roleActivations.statusExpired'),
	};

	const handleAction = async (values: { reason: string }) => {
		if (!actionTarget) return;
		try {
			if (actionTarget.type === 'approve') {
				await approveMut.mutateAsync({ id: actionTarget.id, reason: values.reason });
				message.success(t('roleActivations.approveSuccess'));
			} else {
				await revokeMut.mutateAsync({ id: actionTarget.id, reason: values.reason });
				message.success(t('roleActivations.revokeSuccess'));
			}
			setActionTarget(null);
			form.resetFields();
		} catch (err) {
			handleApiError(err, t('roleActivations.operationFailed'));
		}
	};

	const confirmAction = (id: string, type: 'approve' | 'revoke') => {
		setActionTarget({ id, type });
		const defaultReason =
			type === 'approve'
				? t('roleActivations.defaultApproveReason')
				: t('roleActivations.defaultRevokeReason');
		form.setFieldsValue({ reason: defaultReason });
	};

	const truncate = (s: string, len = 8) =>
		s && s.length > len * 2 ? `${s.slice(0, len)}...${s.slice(-len)}` : s;

	const columns = [
		{
			title: t('roleActivations.columnUserId'),
			dataIndex: 'userId',
			key: 'userId',
			width: 200,
			render: (v: string) => (
				<code className="text-xs bg-neutral-200 px-1 rounded">{truncate(v)}</code>
			),
		},
		{
			title: t('roleActivations.columnRoleId'),
			dataIndex: 'roleId',
			key: 'roleId',
			width: 200,
			render: (v: string) => (
				<code className="text-xs bg-neutral-200 px-1 rounded">{truncate(v)}</code>
			),
		},
		{
			title: t('common.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (v: string) => {
				const cfg = STATUS_MAP[v] || { color: 'default', label: v };
				return <Tag color={cfg.color}>{statusLabels[v] || cfg.label}</Tag>;
			},
		},
		{
			title: t('roleActivations.columnJustification'),
			dataIndex: 'justification',
			key: 'justification',
			ellipsis: true,
		},
		{
			title: t('roleActivations.columnExpireAt'),
			dataIndex: 'expireAt',
			key: 'expireAt',
			width: 140,
			render: (v: string) => (v ? new Date(v).toLocaleDateString('zh-CN') : '-'),
		},
		{
			title: t('roleActivations.columnCreatedAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 140,
			render: (v: string) => (v ? new Date(v).toLocaleDateString('zh-CN') : '-'),
		},
		{
			title: t('common.actions'),
			key: 'action',
			width: 120,
			render: (_: any, record: RoleActivation) => (
				<Space size="small">
					{record.status === 'pending' && (
						<Button
							type="link"
							icon={<CheckOutlined />}
							loading={approveMut.isPending}
							onClick={() => confirmAction(record.id, 'approve')}
						>
							{t('roleActivations.approve')}
						</Button>
					)}
					{record.status === 'active' && (
						<Button
							type="link"
							danger
							icon={<CloseOutlined />}
							loading={revokeMut.isPending}
							onClick={() => confirmAction(record.id, 'revoke')}
						>
							{t('common.revoke')}
						</Button>
					)}
				</Space>
			),
		},
	];

	return (
		<div>
			<ConsolePageHeader title={t('roleActivations.title')} />

			{error && (
				<PageError message={t('roleActivations.loadError')} retry={refetch} className="mb-4" />
			)}
			<div className="flex gap-4 mb-4 flex-wrap">
				<Select
					placeholder={t('common.status')}
					value={statusFilter}
					onChange={setStatusFilter}
					options={[
						{ label: t('common.all'), value: 'all' },
						{ label: t('roleActivations.statusActive'), value: 'active' },
						{ label: t('roleActivations.statusPending'), value: 'pending' },
						{ label: t('roleActivations.statusRevoked'), value: 'revoked' },
						{ label: t('roleActivations.statusExpired'), value: 'expired' },
					]}
					className="w-40"
				/>
			</div>

			<DataTable
				rowKey="id"
				columns={columns}
				dataSource={data as RoleActivation[]}
				loading={isLoading}
				pagination={{ pageSize: 15 }}
				scroll={{ x: 800 }}
			/>

			<Modal
				title={
					actionTarget?.type === 'approve'
						? t('roleActivations.modalApproveTitle')
						: t('roleActivations.modalRevokeTitle')
				}
				open={!!actionTarget}
				onCancel={() => {
					setActionTarget(null);
					form.resetFields();
				}}
				onOk={() => form.submit()}
				destroyOnHidden
				className="w-full max-w-[560px]"
			>
				<Form form={form} layout="vertical" onFinish={handleAction}>
					<Form.Item
						name="reason"
						label={t('roleActivations.reason')}
						rules={[{ required: true, message: t('roleActivations.reasonRequired') }]}
					>
						<Input.TextArea rows={3} placeholder={t('roleActivations.reasonPlaceholder')} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
