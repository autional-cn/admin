'use client';

import React, { useState } from 'react';
import { Tag, Select, Space, Card, Button, Modal, Descriptions } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePayRefunds, type RefundRecord } from '@/hooks/use-pay';
import { PageError, DataTable } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';

const statusTagColor: Record<string, string> = {
	pending: 'processing',
	succeeded: 'success',
	failed: 'error',
};

export default function PayRefundsPage() {
	const { t } = useTranslation();
	// W2-01（A-353）：筛选状态直连 hook 入参（入 queryKey → 触发新请求，wire ?status=...）
	const [status, setStatus] = useState<string | undefined>(undefined);
	const [detailModal, setDetailModal] = useState(false);
	const [selected, setSelected] = useState<RefundRecord | null>(null);

	const { data: refunds = [], isLoading, error, refetch } = usePayRefunds(
		status ? { status } : {},
	);

	// W2-01（A-354）：渲染退款状态词表 pending/succeeded/failed（非支付状态）
	const statusLabel = (v: string) =>
		v === 'pending' || v === 'succeeded' || v === 'failed' ? t(`payRefunds.status.${v}`) : v;

	const columns = [
		{
			title: t('payRefunds.refundRecordId'),
			dataIndex: 'id',
			key: 'id',
			ellipsis: true,
			width: 160,
		},
		{
			title: t('payRefunds.paymentId'),
			dataIndex: 'paymentId',
			key: 'paymentId',
			ellipsis: true,
			width: 160,
		},
		{
			title: t('payRefunds.amount'),
			dataIndex: 'amount',
			key: 'amount',
			width: 120,
			render: (v: string) => v || '-',
		},
		{
			title: t('payRefunds.reason'),
			dataIndex: 'reason',
			key: 'reason',
			ellipsis: true,
			render: (v: string) => v || '-',
		},
		{
			title: t('payRefunds.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (v: string) => <Tag color={statusTagColor[v] ?? 'default'}>{statusLabel(v)}</Tag>,
		},
		{
			title: t('payRefunds.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 160,
			render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
		},
		{
			title: t('payRefunds.actions'),
			key: 'action',
			width: 80,
			render: (_: unknown, record: RefundRecord) => (
				<Button
					type="link"
					icon={<EyeOutlined />}
					onClick={() => {
						setSelected(record);
						setDetailModal(true);
					}}
				>
					{t('payRefunds.detail')}
				</Button>
			),
		},
	];

	return (
		<div>
			<ConsolePageHeader title={t('payRefunds.title')} />

			{error && <PageError message={t('payRefunds.loadError')} retry={refetch} className="mb-4" />}

			<Card size="small" className="mb-4">
				<Space wrap>
					<Select
						placeholder={t('payRefunds.status')}
						allowClear
						className="w-30"
						value={status}
						onChange={(v) => setStatus(v as string | undefined)}
						options={[
							{ value: 'pending', label: t('payRefunds.status.pending') },
							{ value: 'succeeded', label: t('payRefunds.status.succeeded') },
							{ value: 'failed', label: t('payRefunds.status.failed') },
						]}
					/>
				</Space>
			</Card>

			<DataTable
				rowKey="id"
				columns={columns}
				dataSource={refunds}
				loading={isLoading}
				pagination={{ pageSize: 10 }}
				scroll={{ x: 1000 }}
			/>

			<Modal
				title={t('payRefunds.detailTitle')}
				open={detailModal}
				onCancel={() => {
					setDetailModal(false);
					setSelected(null);
				}}
				footer={null}
				width={640}
				className="w-full max-w-[640px]"
			>
				{selected && (
					<Descriptions column={1} bordered size="small">
						<Descriptions.Item label={t('payRefunds.refundRecordId')}>{selected.id}</Descriptions.Item>
						<Descriptions.Item label={t('payRefunds.paymentId')}>
							{selected.paymentId}
						</Descriptions.Item>
						<Descriptions.Item label={t('payRefunds.amount')}>{selected.amount}</Descriptions.Item>
						<Descriptions.Item label={t('payRefunds.reason')}>
							{selected.reason || '-'}
						</Descriptions.Item>
						<Descriptions.Item label={t('payRefunds.status')}>
							<Tag color={statusTagColor[selected.status] ?? 'default'}>
								{statusLabel(selected.status)}
							</Tag>
						</Descriptions.Item>
						<Descriptions.Item label={t('payRefunds.createdAt')}>
							{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '-'}
						</Descriptions.Item>
					</Descriptions>
				)}
			</Modal>
		</div>
	);
}
