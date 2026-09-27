'use client';

import React, { useState } from 'react';
import { Table, Card, Form, Select, DatePicker, Button, Space, Tag } from 'antd';
import { message } from '@/lib/antd-app';
import { DownloadOutlined } from '@ant-design/icons';
import { useTaxExport, type TaxExportItem } from '@/hooks/use-billing-admin';
import { PageError } from '@/components/ui/page-status';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { RangePicker } = DatePicker;

export default function BillingTaxExportPage() {
	const { t } = useTranslation();
	const [filters, setFilters] = useState<Record<string, unknown>>({});
	const { data: exports = [], isLoading, error, refetch } = useTaxExport(filters);

	const columns = [
		{ title: t('taxExport.column.id'), dataIndex: 'id', key: 'id', ellipsis: true, width: 160 },
		{ title: t('taxExport.column.period'), dataIndex: 'period', key: 'period', width: 140 },
		{
			title: t('taxExport.column.format'),
			dataIndex: 'format',
			key: 'format',
			width: 80,
			render: (v: string) => v?.toUpperCase() || '-',
		},
		{
			title: t('taxExport.column.status'),
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (v: string) => (
				<Tag color={v === 'completed' ? 'success' : v === 'processing' ? 'processing' : 'default'}>
					{v === 'completed'
						? t('taxExport.status.completed')
						: v === 'processing'
							? t('taxExport.status.processing')
							: v}
				</Tag>
			),
		},
		{
			title: t('taxExport.column.createdAt'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 160,
			render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
		},
		{
			title: t('taxExport.column.actions'),
			key: 'action',
			width: 100,
			render: (_: unknown, record: TaxExportItem) => (
				<Button
					type="link"
					icon={<DownloadOutlined />}
					disabled={record.status !== 'completed' || !record.downloadUrl}
					onClick={() => {
						if (record.downloadUrl) {
							window.open(record.downloadUrl, '_blank');
						}
					}}
				>
					{t('taxExport.download')}
				</Button>
			),
		},
	];

	return (
		<div>
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
				<h1 className="text-xl font-semibold">{t('taxExport.title')}</h1>
			</div>

			{error && <PageError message={t('taxExport.loadError')} retry={refetch} className="mb-4" />}

			<Card size="small" className="mb-4">
				<Space wrap>
					<RangePicker
						value={
							filters.period
								? (() => {
										const [sd, ed] = String(filters.period).split('_');
										return sd && ed ? [dayjs(sd), dayjs(ed)] : null;
									})()
								: null
						}
						onChange={(dates) => {
							if (dates) {
								setFilters({
									...filters,
									period: `${dates[0]?.format('YYYY-MM-DD')}_${dates[1]?.format('YYYY-MM-DD')}`,
								});
							} else {
								const { period, ...rest } = filters;
								setFilters(rest);
							}
						}}
					/>
					<Select
						placeholder={t('taxExport.formatFilter')}
						allowClear
						className="w-25"
						value={filters.format}
						onChange={(v) => setFilters({ ...filters, format: v })}
						options={[
							{ value: 'csv', label: 'CSV' },
							{ value: 'pdf', label: 'PDF' },
							{ value: 'xml', label: 'XML' },
						]}
					/>
					<Button type="primary" onClick={() => refetch()}>
						{t('taxExport.query')}
					</Button>
				</Space>
			</Card>

			<Table
				rowKey="id"
				columns={columns}
				dataSource={exports}
				loading={isLoading}
				pagination={{ pageSize: 10 }}
				scroll={{ x: 800 }}
			/>
		</div>
	);
}
