'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Button, Spin, Descriptions, Tag } from 'antd';
import { message } from '@/lib/antd-app';
import { SaveOutlined, ReloadOutlined, SafetyOutlined } from '@ant-design/icons';
import { extractItem } from '@autional-cn/shared';
import { useTenantId } from '@/hooks/use-tenant';
import { apiClient, API_PATHS } from '@autional-cn/shared';
import { handleApiError } from '@/lib/error-handler';
import { PageError } from '@/components/ui/page-status';
import { useTranslation } from 'react-i18next';

interface SodConfigData {
	sod_mode: 'single' | 'strict';
}

export default function SodConfigPage() {
	const { t } = useTranslation();
	const tenantId = useTenantId();
	const [form] = Form.useForm<SodConfigData>();
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [currentMode, setCurrentMode] = useState<string>('single');

	const fetchConfig = async () => {
		if (!tenantId) return;
		setLoading(true);
		setError(null);
		try {
			const res = await apiClient.get(API_PATHS.TENANT.SOD_CONFIG(tenantId));
			const item = extractItem<{ sod_mode: string }>(res);
			if (item) {
				setCurrentMode(item.sod_mode);
				form.setFieldsValue({ sod_mode: item.sod_mode as 'single' | 'strict' });
			}
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchConfig();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId]);

	const handleSave = async (values: SodConfigData) => {
		if (!tenantId) return;
		setSaving(true);
		try {
			await apiClient.put(API_PATHS.TENANT.SOD_CONFIG(tenantId), { sod_mode: values.sod_mode });
			setCurrentMode(values.sod_mode);
			message.success(t('sod.saveSuccess'));
		} catch (err) {
			handleApiError(err, t('sod.saveFailed'));
		} finally {
			setSaving(false);
		}
	};

	if (!tenantId) {
		return (
			<div className="p-6">
				<PageError message={t('common.noTenant')} />
			</div>
		);
	}

	return (
		<div className="p-6 max-w-2xl">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-2">
					<SafetyOutlined className="text-xl" />
					<h1 className="text-xl font-semibold">{t('sod.title')}</h1>
				</div>
				<Button icon={<ReloadOutlined />} onClick={fetchConfig} loading={loading}>
					{t('common.refresh')}
				</Button>
			</div>

			{error && <PageError message={t('sod.loadFailed')} retry={fetchConfig} className="mb-4" />}

			<Spin spinning={loading}>
				<Card className="mb-6">
					<Descriptions column={1} size="small" className="mb-4">
						<Descriptions.Item label={t('sod.currentMode')}>
							<Tag color={currentMode === 'strict' ? 'red' : 'blue'}>
								{currentMode === 'strict' ? t('sod.modeStrict') : t('sod.modeSingle')}
							</Tag>
						</Descriptions.Item>
					</Descriptions>

					<div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
						<strong>{t('sod.whatIs')}</strong>
						<ul className="mt-1 ml-4 list-disc space-y-1">
							<li>
								<strong>{t('sod.modeSingle')}</strong> — {t('sod.singleDesc')}
							</li>
							<li>
								<strong>{t('sod.modeStrict')}</strong> — {t('sod.strictDesc')}
							</li>
						</ul>
					</div>

					<Form
						form={form}
						layout="vertical"
						onFinish={handleSave}
						initialValues={{ sod_mode: 'single' }}
					>
						<Form.Item
							label={t('sod.modeLabel')}
							name="sod_mode"
							rules={[{ required: true, message: t('sod.modeRequired') }]}
						>
							<Select>
								<Select.Option value="single">{t('sod.modeSingle')}</Select.Option>
								<Select.Option value="strict">{t('sod.modeStrict')}</Select.Option>
							</Select>
						</Form.Item>

						<Form.Item>
							<Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />}>
								{t('common.save')}
							</Button>
						</Form.Item>
					</Form>
				</Card>
			</Spin>
		</div>
	);
}
