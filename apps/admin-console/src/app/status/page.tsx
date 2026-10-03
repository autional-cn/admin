'use client';

import React from 'react';
import { Card, Row, Col, Statistic, Tag, Spin, Empty, Button } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { statusOverview } from '@autional-cn/shared/generated/api';
import { PageError } from '@autional-cn/ui/antd';

export default function StatusPage() {
	const { t } = useTranslation();

	// ADM-006: 经 gateway 调用 status-service 正确端点（generated statusOverview()，JWT + X-Tenant-ID 自动注入），
	// 原 fetch('/bff/status') 404 + 空数组假阳性
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ['status-overview'],
		queryFn: async () => {
			return statusOverview();
		},
	});

	// 兼容解包：{ services } / { data: { services } } / 扁平数组
	const services = Array.isArray(data)
		? data
		: ((data as any)?.services ?? (data as any)?.data?.services ?? []);

	// ADM-006: 空数组（请求失败/无数据）时不显示"全部正常"
	const overall =
		services.length === 0
			? t('status.noData')
			: services.every((s: any) => s.status === 'operational')
				? t('status.allOperational')
				: t('status.someIssues');

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl font-semibold">{t('status.title')}</h1>
				<Button icon={<ReloadOutlined />} onClick={() => refetch()}>
					{t('common.refresh')}
				</Button>
			</div>

			<div className="mb-6">
				<Card>
					<Statistic
						title={t('status.overall')}
						value={overall}
						prefix={
							services.length > 0 && services.every((s: any) => s.status === 'operational') ? (
								<CheckCircleOutlined style={{ color: 'var(--color-success)' }} />
							) : services.length > 0 ? (
								<CloseCircleOutlined style={{ color: 'var(--color-danger)' }} />
							) : null
						}
					/>
				</Card>
			</div>

			{error && <PageError message={t('status.loadError')} retry={refetch} className="mb-4" />}

			{isLoading ? (
				<Spin className="flex justify-center py-12" />
			) : services.length === 0 ? (
				<Empty description={t('status.noData')} />
			) : (
				<Row gutter={[16, 16]}>
					{services.map((svc: any) => (
						<Col xs={24} sm={12} lg={8} key={svc.name}>
							<Card>
								<div className="flex items-center justify-between">
									<span className="font-medium">{svc.name}</span>
									<Tag color={svc.status === 'operational' ? 'success' : 'error'}>
										{svc.status === 'operational' ? t('status.operational') : t('status.degraded')}
									</Tag>
								</div>
								{svc.latency && (
									<p className="mt-2 text-sm text-gray-500">
										{t('status.latency')}: {svc.latency}ms
									</p>
								)}
							</Card>
						</Col>
					))}
				</Row>
			)}
		</div>
	);
}
