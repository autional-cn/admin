'use client';

import React, { useState, useMemo } from 'react';
import { Table, Tag, Input, Select, DatePicker, Space, Button, Card } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePayPayments, type PaymentItem } from '@/hooks/use-pay';
import { PageError } from '@/components/ui/page-status';

const { RangePicker } = DatePicker;

export default function PayPaymentsPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [filters, setFilters] = useState<Record<string, unknown>>({});
	const [searchText, setSearchText] = useState('');

	const params = useMemo(() => {
		const p: Record<string, unknown> = {};
		if (filters.status) p.status = filters.status;
		if (filters.channel) p.channel_code = filters.channel;
		if (filters.startDate) p.start_date = filters.startDate;
		if (filters.endDate) p.end_date = filters.endDate;
		if (searchText) p.search = searchText;
		return p;
	}, [filters, searchText]);

	const { data: payments = [], isLoading, error, refetch } = usePayPayments(params);

	const channelLabels: Record<string, string> = {
		wechat: t('payPayments.channel.wechat'),
		alipay: t('payPayments.channel.alipay'),
		stripe: t('payPayments.channel.stripe'),
	};

	const columns = [
		{
			title: t('payPayments.paymentId'),
			dataIndex: 'paymentId',
			key: 'paymentId',
			ellipsis: true,
			width: 160,
		},
		{
			title: t('payPayments.userId'),
			dataIndex: 'payerId',
			key: 'payerId',
			ellipsis: true,
			width: 120,
		},
		{
			title: t('payPayments.channel'),
			dataIndex: 'channelCode',
			key: 'channelCode',
			width: 100,
			render: (v: string) => channelLabels[v] ?? v,
		},
		{
			title: t('payPayments.amount'),
			dataIndex: 'amount',
			key: 'amount',
			width: 120,
			render: (v: string, r: PaymentItem) => {
				const currLabels: Record<string, string> = { CNY: '¥', USD: '$' };
				return `${currLabels[r.currency] ?? r.currency}${parseFloat(v).toFixed(2)}`;
			},
		},
		{
			title: t('payPayments.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (v: string) => {
				const colorMap: Record<string, string> = {
					created: 'default',
					processing: 'processing',
					succeeded: 'success',
					failed: 'error',
					expired: 'warning',
				};
				const labelMap: Record<string, string> = {
					created: t('payPayments.status.created'),
					processing: t('payPayments.status.processing'),
					succeeded: t('payPayments.status.succeeded'),
					failed: t('payPayments.status.failed'),
					expired: t('payPayments.status.expired'),
				};
				return <Tag color={colorMap[v] ?? 'default'}>{labelMap[v] ?? v}</Tag>;
			},
		},
		{ title: t('payPayments.targetType'), dataIndex: 'targetType', key: 'targetType', width: 100 },
		{
			title: t('payPayments.gatewayReference'),
			dataIndex: 'gatewayReference',
			key: 'gatewayReference',
			ellipsis: true,
			width: 140,
		},
		{
			title: t('payPayments.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 160,
			render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
		},
		{
			title: t('payPayments.actions'),
			key: 'action',
			width: 80,
			render: (_: unknown, record: PaymentItem) => (
				<Button
					type="link"
					icon={<EyeOutlined />}
					onClick={() => navigate(`/pay/payments/${record.paymentId}`)}
				>
					{t('payPayments.detail')}
				</Button>
			),
		},
	];

	return (
		<div>
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
				<h1 className="text-xl font-semibold">{t('payPayments.title')}</h1>
			</div>

			{error && <PageError message={t('payPayments.loadError')} retry={refetch} className="mb-4" />}

			<Card size="small" className="mb-4">
				<Space wrap>
					<Input
						placeholder={t('payPayments.searchPlaceholder')}
						prefix={<SearchOutlined />}
						value={searchText}
						onChange={(e) => setSearchText(e.target.value)}
						onPressEnter={() => refetch()}
						className="w-[220px]"
					/>
					<Select
						placeholder={t('payPayments.status')}
						allowClear
						className="w-30"
						value={filters.status}
						onChange={(v) => setFilters({ ...filters, status: v })}
						options={[
							{ value: 'created', label: t('payPayments.status.created') },
							{ value: 'processing', label: t('payPayments.status.processing') },
							{ value: 'succeeded', label: t('payPayments.status.succeeded') },
							{ value: 'failed', label: t('payPayments.status.failed') },
							{ value: 'expired', label: t('payPayments.status.expired') },
						]}
					/>
					<Select
						placeholder={t('payPayments.channel')}
						allowClear
						className="w-30"
						value={filters.channel}
						onChange={(v) => setFilters({ ...filters, channel: v })}
						options={[
							{ value: 'wechat', label: t('payPayments.channel.wechat') },
							{ value: 'alipay', label: t('payPayments.channel.alipay') },
							{ value: 'stripe', label: t('payPayments.channel.stripe') },
						]}
					/>
					<RangePicker
						onChange={(dates) => {
							if (dates) {
								setFilters({
									...filters,
									startDate: dates[0]?.format('YYYY-MM-DD'),
									endDate: dates[1]?.format('YYYY-MM-DD'),
								});
							} else {
								const { startDate, endDate, ...rest } = filters;
								setFilters(rest);
							}
						}}
					/>
					<Button type="primary" onClick={() => refetch()}>
						{t('payPayments.search')}
					</Button>
				</Space>
			</Card>

			<Table
				rowKey="paymentId"
				columns={columns}
				dataSource={payments}
				loading={isLoading}
				pagination={{ pageSize: 10 }}
				scroll={{ x: 1200 }}
			/>
		</div>
	);
}
