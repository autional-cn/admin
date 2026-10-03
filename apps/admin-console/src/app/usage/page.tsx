'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Select, Spin, Empty, Button } from 'antd';
import { ReloadOutlined, BarChartOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getUsageTimeline, getUsageEndpoints } from '@/lib/api.generated';
import { useTenantIdOr } from '@/hooks/use-tenant';
import { PageError } from '@autional-cn/ui/antd';

export default function UsagePage() {
	const { t } = useTranslation();
	const [days, setDays] = useState<number>(7);
	// ADM-008: 用量端点需要 tenantId 路径参数（billing-service router.go 确认）
	const tenantId = useTenantIdOr('');

	const {
		data: timeline,
		isLoading: tlLoading,
		error: tlError,
		refetch: refetchTimeline,
	} = useQuery({
		queryKey: ['usage', 'timeline', days],
		queryFn: async () => {
			// ADM-008: 需带 tenant_id；U316：改接 admin 面（user 面在 admin 平面被入口平面门禁拒 403）
			const res = await getUsageTimeline(tenantId, { days });
			return res;
		},
	});

	const { data: endpoints, isLoading: epLoading } = useQuery({
		queryKey: ['usage', 'endpoints'],
		queryFn: async () => {
			const res = await getUsageEndpoints(tenantId);
			return res;
		},
	});

	// apiClient 已 unwrap：{ code, items } → { items }，取 items 而非 data
	const timelineData = Array.isArray(timeline) ? timeline : ((timeline as any)?.items ?? []);
	const endpointData = Array.isArray(endpoints) ? endpoints : ((endpoints as any)?.items ?? []);

	const timelineColumns = [
		{ title: t('usage.column.date'), dataIndex: 'date', key: 'date' },
		{ title: t('usage.column.requests'), dataIndex: 'count', key: 'count' },
	];

	const endpointColumns = [
		{ title: t('usage.column.endpoint'), dataIndex: 'endpoint', key: 'endpoint' },
		{ title: t('usage.column.calls'), dataIndex: 'count', key: 'count' },
	];

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl font-semibold">{t('usage.title')}</h1>
				<Select value={days} onChange={setDays} style={{ width: 120 }}>
					<Select.Option value={7}>{t('usage.last7Days')}</Select.Option>
					<Select.Option value={30}>{t('usage.last30Days')}</Select.Option>
					<Select.Option value={90}>{t('usage.last90Days')}</Select.Option>
				</Select>
			</div>

			{tlError && (
				<PageError message={t('usage.loadError')} retry={refetchTimeline} className="mb-4" />
			)}

			<Row gutter={[16, 16]} className="mb-6">
				<Col span={8}>
					<Card>
						<Statistic
							title={t('usage.totalRequests')}
							value={timelineData.reduce((s: number, r: any) => s + (r.count || 0), 0)}
							prefix={<BarChartOutlined />}
						/>
					</Card>
				</Col>
			</Row>

			<Card title={t('usage.timeline')} className="mb-6">
				{tlLoading ? (
					<Spin className="flex justify-center py-12" />
				) : timelineData.length === 0 ? (
					<Empty description={t('usage.noData')} />
				) : (
					<Table
						rowKey="date"
						columns={timelineColumns}
						dataSource={timelineData}
						pagination={false}
						scroll={{ x: 600 }}
					/>
				)}
			</Card>

			<Card title={t('usage.topEndpoints')}>
				{epLoading ? (
					<Spin className="flex justify-center py-12" />
				) : endpointData.length === 0 ? (
					<Empty description={t('usage.noData')} />
				) : (
					<Table
						rowKey="endpoint"
						columns={endpointColumns}
						dataSource={endpointData}
						pagination={{ pageSize: 10 }}
						scroll={{ x: 600 }}
					/>
				)}
			</Card>
		</div>
	);
}
