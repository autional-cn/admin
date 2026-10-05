'use client';

import React, { useState } from 'react';
import { useCurrentTenantId } from '@autional-cn/shared';
import { useTranslation } from 'react-i18next';
import { Tag, Button, Modal, Form, Input, Select } from 'antd';
import { message } from '@/lib/antd-app';

import { useWalletDisputes, useResolveDispute, type Dispute } from '@/hooks/use-wallets';
import { handleApiError } from '@/lib/error-handler';
import { PageError, DataTable } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';

// W1-03（A-370+A-372）：裁决契约键 resolution/remark（旧 result/reason 错配）；
// 选项值域 = 服务端裁决词表 resolved/rejected（旧 approved/partial 幽灵值被 oneof 拒）；
// 撤 amount 列（服务端无此字段，toFixed 假声明崩溃）；去幽灵 'open'（按钮条件仅 pending）；
// 标签本地化 + 文案去资金承诺（原「通过（退款）/部分退款」）。
export default function WalletDisputesPage() {
	const { t } = useTranslation();
	const tenantId = useCurrentTenantId() ?? '';
	const { data: disputes = [], isLoading, error, refetch } = useWalletDisputes(tenantId);
	const resolveMut = useResolveDispute();

	const [resolveModal, setResolveModal] = useState(false);
	const [current, setCurrent] = useState<Dispute | null>(null);
	const [form] = Form.useForm();

	const handleResolve = async (values: { resolution: string; remark: string }) => {
		if (!current || !tenantId) return;
		try {
			await resolveMut.mutateAsync({
				tenantId,
				id: current.id,
				data: { resolution: values.resolution, remark: values.remark },
			});
			message.success(t('walletDisputes.resolved'));
			setResolveModal(false);
			form.resetFields();
		} catch (err) {
			handleApiError(err, t('walletDisputes.resolveFailed'));
		}
	};

	const columns = [
		{ title: t('walletDisputes.colId'), dataIndex: 'id', key: 'id', ellipsis: true, width: 160 },
		{
			title: t('walletDisputes.colTransactionId'),
			dataIndex: 'transactionId',
			key: 'transactionId',
			ellipsis: true,
			width: 160,
		},
		{ title: t('walletDisputes.colReason'), dataIndex: 'reason', key: 'reason', ellipsis: true },
		{
			title: t('walletDisputes.colStatus'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (v: string) => {
				const colorMap: Record<string, string> = {
					pending: 'warning',
					resolved: 'success',
					rejected: 'error',
				};
				const labelMap: Record<string, string> = {
					pending: t('walletDisputes.statusPending'),
					resolved: t('walletDisputes.statusResolved'),
					rejected: t('walletDisputes.statusRejected'),
				};
				return <Tag color={colorMap[v] ?? 'default'}>{labelMap[v] ?? v}</Tag>;
			},
		},
		{
			title: t('walletDisputes.colCreatedAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 160,
			render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
		},
		{
			title: t('walletDisputes.colActions'),
			key: 'action',
			width: 80,
			render: (_: unknown, record: Dispute) => (
				<Button
					type="link"
					size="small"
					disabled={record.status !== 'pending'}
					onClick={() => {
						setCurrent(record);
						form.resetFields();
						setResolveModal(true);
					}}
				>
					{t('walletDisputes.handle')}
				</Button>
			),
		},
	];

	return (
		<div>
			<ConsolePageHeader title={t('walletDisputes.title')} />

			{error && (
				<PageError message={t('walletDisputes.loadError')} retry={refetch} className="mb-4" />
			)}

			<DataTable
				rowKey="id"
				columns={columns}
				dataSource={disputes}
				loading={isLoading}
				pagination={{ pageSize: 10 }}
				scroll={{ x: 1000 }}
			/>

			<Modal
				title={t('walletDisputes.resolveTitle')}
				open={resolveModal}
				onCancel={() => {
					setResolveModal(false);
					setCurrent(null);
					form.resetFields();
				}}
				onOk={() => form.submit()}
				className="w-full max-w-[560px]"
			>
				<Form form={form} layout="vertical" onFinish={handleResolve}>
					<Form.Item
						name="resolution"
						label={t('walletDisputes.fieldResolution')}
						rules={[{ required: true }]}
					>
						<Select
							options={[
								{ value: 'resolved', label: t('walletDisputes.resultResolved') },
								{ value: 'rejected', label: t('walletDisputes.resultRejected') },
							]}
						/>
					</Form.Item>
					<Form.Item
						name="remark"
						label={t('walletDisputes.fieldRemark')}
						rules={[{ required: true }]}
					>
						<Input.TextArea rows={3} placeholder={t('walletDisputes.fieldRemarkPlaceholder')} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
