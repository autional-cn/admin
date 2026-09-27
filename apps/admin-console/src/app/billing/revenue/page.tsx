'use client';

import React, { useState } from 'react';
import { Table, Card, Row, Col, Statistic, DatePicker, Space, Select, Button } from 'antd';
import { SearchOutlined, DollarOutlined } from '@ant-design/icons';
import { useBillingRevenue, type RevenueItem } from '@/hooks/use-billing-admin';
import { PageError } from '@/components/ui/page-status';
import { useTranslation } from 'react-i18next';

const { RangePicker } = DatePicker;

export default function BillingRevenuePage() {
	const { t } = useTranslation();
	const [filters, setFilters] = useState<Record<string, unknown>>({});

	const { data: revenues = [], isLoading, error, refetch } = useBillingRevenue(filters);

	const totalRevenue = revenues.reduce((sum, r) => sum + parseFloat(r.totalRevenue || '0'), 0);
	const totalRecognized = revenues.reduce(
		(sum, r) => sum + parseFloat(r.recognizedRevenue || '0'),
		0,
	);
	const totalDeferred = revenues.reduce((sum, r) => sum + parseFloat(r.deferredRevenue || '0'), 0);

	const columns = [
		{ title: t('revenue.column.period'), dataIndex: 'period', key: 'period', width: 120 },
		{
			title: t('revenue.column.planCode'),
			dataIndex: 'planCode',
			key: 'planCode',
			width: 120,
			render: (v: string) => v || '-',
		},
		{
			title: t('revenue.column.totalRevenue'),
			dataIndex: 'totalRevenue',
			key: 'totalRevenue',
			width: 140,
			render: (v: string) => `$${parseFloat(v).toFixed(2)}`,
		},
		{
			title: t('revenue.column.recognizedRevenue'),
			dataIndex: 'recognizedRevenue',
			key: 'recognizedRevenue',
			width: 140,
			render: (v: string) => (v ? `$${parseFloat(v).toFixed(2)}` : '-'),
		},
		{
			title: t('revenue.column.deferredRevenue'),
			dataIndex: 'deferredRevenue',
			key: 'deferredRevenue',
			width: 140,
			render: (v: string) => (v ? `$${parseFloat(v).toFixed(2)}` : '-'),
		},
		{
			title: t('revenue.column.transactionCount'),
			dataIndex: 'transactionCount',
			key: 'transactionCount',
			width: 100,
		},
	];

	return (
		<div>
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
				<h1 className="text-xl font-semibold">{t('revenue.title')}</h1>
			</div>

			{error && <PageError message={t('revenue.loadError')} retry={refetch} className="mb-4" />}

			<Row gutter={16} className="mb-4">
				<Col xs={24} sm={8}>
					<Card size="small">
						<Statistic
							title={t('revenue.totalRevenue')}
							prefix="$"
							value={totalRevenue}
							precision={2}
							valueStyle={{ color: 'var(--color-success-light)' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={8}>
					<Card size="small">
						<Statistic
							title={t('revenue.recognizedRevenue')}
							prefix="$"
							value={totalRecognized}
							precision={2}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={8}>
					<Card size="small">
						<Statistic
							title={t('revenue.deferredRevenue')}
							prefix="$"
							value={totalDeferred}
							precision={2}
							valueStyle={{ color: 'var(--color-info-light)' }}
						/>
					</Card>
				</Col>
			</Row>

			<Card size="small" className="mb-4">
				<Space wrap>
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
					<Button type="primary" icon={<SearchOutlined />} onClick={() => refetch()}>
						{t('revenue.query')}
					</Button>
				</Space>
			</Card>

			<Table
				rowKey="period"
				columns={columns}
				dataSource={revenues}
				loading={isLoading}
				pagination={{ pageSize: 10 }}
				scroll={{ x: 800 }}
			/>
		</div>
	);
}
