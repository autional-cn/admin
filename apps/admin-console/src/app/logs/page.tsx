'use client';

import React, { useState } from 'react';
import { Table, Input, DatePicker, Space, Button, Spin, Empty, Card } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getMyAuditLogs } from '@/lib/api.generated';
import { PageError } from '@autional-cn/ui/antd';

export default function LogsPage() {
	const { t } = useTranslation();
	const [params, setParams] = useState<Record<string, unknown>>({});

	const { data, isLoading, error, refetch } = useQuery({
		queryKey: queryKeys.myAuditLogs.all(params),
		queryFn: () => getMyAuditLogs(params),
	});

	// ADM-005: apiClient 已把 { code, items } unwrap 成 { items, total }（无 data 字段），
	// 取 items 而非 data
	const logs = Array.isArray(data) ? data : ((data as any)?.items ?? []);

	const columns = [
		{
			title: t('logs.column.time'),
			dataIndex: 'createdAt',
			key: 'createdAt',
			render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
		},
		{ title: t('logs.column.action'), dataIndex: 'action', key: 'action' },
		{ title: t('logs.column.target'), dataIndex: 'targetType', key: 'targetType' },
		{ title: t('logs.column.detail'), dataIndex: 'message', key: 'message', ellipsis: true },
	];

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl font-semibold">{t('logs.title')}</h1>
				<Space>
					<Input.Search
						placeholder={t('logs.search')}
						onSearch={(v) => setParams((p) => ({ ...p, keyword: v || undefined }))}
						style={{ width: 240 }}
					/>
					<Button icon={<ReloadOutlined />} onClick={() => refetch()}>
						{t('common.refresh')}
					</Button>
				</Space>
			</div>

			{error && <PageError message={t('logs.loadError')} retry={refetch} className="mb-4" />}

			{isLoading ? (
				<Spin className="flex justify-center py-12" />
			) : logs.length === 0 ? (
				<Empty description={t('logs.noData')} />
			) : (
				<Table
					rowKey="id"
					columns={columns}
					dataSource={logs}
					pagination={{ pageSize: 20 }}
					scroll={{ x: 800 }}
				/>
			)}
		</div>
	);
}
