'use client';

import React, { useState } from 'react';
import { Input, Button, Empty } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { message } from '@/lib/antd-app';

export default function TracesPage() {
	const { t } = useTranslation();
	const [search, setSearch] = useState('');

	// ADM-007: 后端无 admin 域可用的 traces 端点，不再发起 404 请求，
	// 显示明确的"功能不可用"降级态
	const unavailable = true;

	const handleUnavailable = () => {
		message.info(t('traces.unavailable', 'Tracing endpoint not configured for this portal'));
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl font-semibold">{t('traces.title')}</h1>
				<div className="flex gap-2">
					<Input.Search
						placeholder={t('traces.search')}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onSearch={handleUnavailable}
						style={{ width: 300 }}
						enterButton={<SearchOutlined />}
					/>
					<Button icon={<ReloadOutlined />} onClick={handleUnavailable}>
						{t('common.refresh')}
					</Button>
				</div>
			</div>

			{unavailable && (
				<Empty
					description={t('traces.unavailable', 'Tracing endpoint not configured for this portal')}
				/>
			)}
		</div>
	);
}
