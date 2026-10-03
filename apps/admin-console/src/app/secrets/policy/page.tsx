'use client';

import { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Button, Space, Spin } from 'antd';
import { message } from '@/lib/antd-app';
import { ConsolePageHeader, SectionCard } from '@autional-cn/ui';
import { apiClient, extractItem } from '@autional-cn/shared';
import {
	adminSecretsPolicy,
	adminSecretsPolicyPut,
	adminSecretsPolicyDelete,
} from '@autional-cn/shared/generated/api';
import { useTranslation } from 'react-i18next';

interface SecretPolicyResponse {
	tenant_id: string;
	default_ttl: string;
	max_ttl: string;
	auto_rotate_days: number;
	notification_days_before: number;
	max_versions: number;
	require_rotation_for_fallback_keys: boolean;
}

// 根因修复 (2026-08-13): 后端 default_ttl/max_ttl 是 time.Duration 纳秒
// （如 31536000000000000 = 8760h），此前表单 Input 原样显示纳秒、保存原样提交。
// 显示/编辑统一用小时，保存转回纳秒（后端契约不变）。
const NS_PER_HOUR = 3600e9; // 3600 * 1e9

/** 纳秒 → 小时（保留最多 2 位小数，整小时则无小数） */
function nsToHours(ns: string | number | null | undefined): string {
	if (ns == null || ns === '') return '';
	const n = typeof ns === 'number' ? ns : Number(ns);
	if (!Number.isFinite(n)) return '';
	const h = n / NS_PER_HOUR;
	return Number.isInteger(h) ? String(h) : String(Math.round(h * 100) / 100);
}

/** 小时 → 纳秒（number，匹配后端 time.Duration 的 JSON number 契约）；
 *  非法/空返回 undefined（前端校验拦截，不提交空值）。 */
function hoursToNs(h: string | number | null | undefined): number | undefined {
	if (h == null || h === '') return undefined;
	const v = typeof h === 'number' ? h : Number(h);
	if (!Number.isFinite(v)) return undefined;
	return Math.round(v * NS_PER_HOUR);
}

export default function SecretPolicyPage() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [form] = Form.useForm();

	const fetchPolicy = () => {
		setLoading(true);
		setError(null);
		adminSecretsPolicy()
			.then((res) => {
				const policy = extractItem(res) as SecretPolicyResponse;
				if (policy) {
					form.setFieldsValue({
					// 纳秒 → 小时显示（placeholder 已是 "0h"/"8760h"）
					// camelCase/snake_case 双兼容：generated 客户端可能驼峰化，后端 DTO 为 snake_case
					default_ttl: nsToHours((policy as any).defaultTtl ?? (policy as any).default_ttl),
					max_ttl: nsToHours((policy as any).maxTtl ?? (policy as any).max_ttl),
					auto_rotate_days: (policy as any).autoRotateDays ?? (policy as any).auto_rotate_days,
					notification_days_before:
						(policy as any).notificationDaysBefore ?? (policy as any).notification_days_before ?? 7,
					max_versions: (policy as any).maxVersions ?? (policy as any).max_versions ?? 100,
					require_rotation_for_fallback_keys:
						(policy as any).requireRotationForFallbackKeys ??
						(policy as any).require_rotation_for_fallback_keys ??
						false,
					});
				}
			})
			.catch(() => {
				setError(t('secrets.policy.loadError'));
			})
			.finally(() => setLoading(false));
	};

	useEffect(() => {
		fetchPolicy();
	}, []);

	const handleSave = async (values: Record<string, unknown>) => {
		setSaving(true);
		try {
			// 小时 → 纳秒转回（后端契约 time.Duration）
			const payload: Record<string, unknown> = { ...values };
			if (payload.default_ttl != null && payload.default_ttl !== '') {
				payload.default_ttl = hoursToNs(payload.default_ttl as string);
			}
			if (payload.max_ttl != null && payload.max_ttl !== '') {
				payload.max_ttl = hoursToNs(payload.max_ttl as string);
			}
			await adminSecretsPolicyPut(payload);
			message.success(t('secrets.policy.saveSuccess'));
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			message.error(msg || t('secrets.policy.saveError'));
		} finally {
			setSaving(false);
		}
	};

	const handleReset = async () => {
		try {
			await adminSecretsPolicyDelete();
			await fetchPolicy();
			message.success(t('secrets.policy.resetSuccess'));
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			message.error(msg || t('secrets.policy.saveError'));
		}
	};

	return (
		<div>
			<ConsolePageHeader title={t('secrets.policy.title')} description={t('secrets.policy.description')} />

			{loading ? (
				<Spin size="large" className="flex justify-center mt-16" />
			) : error ? (
				<div className="text-red-500 mt-8 text-center">{error}</div>
			) : (
				<Form form={form} layout="vertical" onFinish={handleSave}>
					<SectionCard title={t('secrets.policy.title')}>
						<Form.Item
							name="default_ttl"
							label={t('secrets.policy.defaultTtl')}
							extra={t('secrets.policy.defaultTtlHint')}
						>
							<Input placeholder="0h" className="w-60" />
						</Form.Item>

						<Form.Item
							name="max_ttl"
							label={t('secrets.policy.maxTtl')}
							extra={t('secrets.policy.maxTtlHint')}
						>
							<Input placeholder="8760h" className="w-60" />
						</Form.Item>

						<Form.Item name="auto_rotate_days" label={t('secrets.policy.autoRotate')}>
							<InputNumber min={0} className="w-60" />
						</Form.Item>

						<Form.Item
							name="notification_days_before"
							label={t('secrets.policy.notifyBefore')}
							initialValue={7}
						>
							<InputNumber min={0} className="w-60" />
						</Form.Item>

						<Form.Item
							name="max_versions"
							label={t('secrets.policy.maxVersions')}
							initialValue={100}
						>
							<InputNumber min={1} max={1000} className="w-60" />
						</Form.Item>

						<Form.Item
							name="require_rotation_for_fallback_keys"
							label={t('secrets.policy.requireRotation')}
							valuePropName="checked"
						>
							<Switch />
						</Form.Item>
					</SectionCard>

					<Space className="mt-4">
						<Button onClick={handleReset}>{t('secrets.policy.resetDefaults')}</Button>
						<Button type="primary" htmlType="submit" loading={saving}>
							{t('secrets.policy.save')}
						</Button>
					</Space>
				</Form>
			)}
		</div>
	);
}
