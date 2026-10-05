'use client';

import React, { useState } from 'react';
import { useCurrentTenantId } from '@autional-cn/shared';
import { useTranslation } from 'react-i18next';
import { Form, Input, InputNumber, Select, Button, Card, Spin, Switch, Space, Empty } from 'antd';
import { message } from '@/lib/antd-app';

import {
	useWalletPolicy,
	useUpdateWalletPolicy,
	type WalletPolicy,
} from '@/hooks/use-wallet-admin';
import { handleApiError } from '@/lib/error-handler';
import { PageError } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';

// W1-05（A-381/A-382）：表单字段与后端 WalletPolicyUpdateRequest（16 指针字段）逐一对齐。
// 币种在表单里是数组（Select tags），加载时 CSV→数组、提交时数组→CSV（AC-B3-W1-05-3）。
function policyToFormValues(policy: WalletPolicy) {
	return {
		...policy,
		supportedCurrencies: policy.supportedCurrencies ? policy.supportedCurrencies.split(',') : [],
	};
}

export default function WalletPolicyPage() {
	const { t } = useTranslation();
	const tenantId = useCurrentTenantId() ?? '';
	const [appId, setAppId] = useState('default');
	const { data: policy, isLoading, error, refetch } = useWalletPolicy(tenantId, appId);
	const updateMut = useUpdateWalletPolicy();
	const [form] = Form.useForm();
	// AC-B3-W1-05-1：无策略（404）→ 创建入口；点按进入空白表单，提交走同一 PUT（upsert 创建路径）。
	const [creating, setCreating] = useState(false);

	// 404 = 尚未配置策略（ADM-014），其余错误走 PageError。
	const isNotFound = (error as any)?.response?.status === 404 || (error as any)?.status === 404;

	const handleSave = async (values: Record<string, unknown>) => {
		try {
			const data: Record<string, unknown> = { ...values };
			const currencies = values.supportedCurrencies as string[] | undefined;
			// 数组 ↔ CSV：后端字段是逗号分隔字符串
			if (currencies) {
				data.supportedCurrencies = currencies.join(',');
			}
			await updateMut.mutateAsync({ tenantId, appId, data });
			setCreating(false);
			message.success(t('walletPolicy.saved'));
		} catch (err) {
			handleApiError(err, t('walletPolicy.saveFailed'));
		}
	};

	React.useEffect(() => {
		// 创建态用空白表单（新建挂载 initialValues={{}}），不回填旧数据
		if (policy && !creating) {
			form.setFieldsValue(policyToFormValues(policy));
		}
	}, [policy, creating]);

	return (
		<div>
			<ConsolePageHeader title={t('walletPolicy.title')} />

			<Card size="small" className="mb-4 max-w-xs">
				<Form.Item label={t('walletPolicy.appId')} className="mb-0">
					<Input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="default" />
				</Form.Item>
			</Card>

			{isLoading ? (
				<div className="flex justify-center py-8">
					<Spin />
				</div>
			) : error && !isNotFound ? (
				<PageError message={t('walletPolicy.loadError')} retry={refetch} />
			) : !policy && !creating ? (
				// AC-B3-W1-05-1：404 → 创建入口（不再是无路可走的空态）
				<Empty description={t('walletPolicy.notConfigured')} className="py-8">
					<Button type="primary" onClick={() => setCreating(true)}>
						{t('walletPolicy.createPolicy')}
					</Button>
				</Empty>
			) : (
				<Card className="max-w-2xl">
					<Form form={form} layout="vertical" onFinish={handleSave} initialValues={{}}>
						<Form.Item name="maxBalance" label={t('walletPolicy.fieldMaxBalance')}>
							<InputNumber
								className="w-full"
								precision={2}
								placeholder={t('walletPolicy.fieldMaxBalancePlaceholder')}
							/>
						</Form.Item>
						<Form.Item name="dailyWithdrawLimit" label={t('walletPolicy.fieldDailyWithdrawLimit')}>
							<InputNumber
								className="w-full"
								precision={2}
								placeholder={t('walletPolicy.fieldDailyWithdrawPlaceholder')}
							/>
						</Form.Item>
						<Form.Item
							name="monthlyWithdrawLimit"
							label={t('walletPolicy.fieldMonthlyWithdrawLimit')}
						>
							<InputNumber className="w-full" precision={2} />
						</Form.Item>
						<Form.Item name="minWithdrawAmount" label={t('walletPolicy.fieldMinWithdrawAmount')}>
							<InputNumber className="w-full" precision={2} />
						</Form.Item>
						<Form.Item name="autoApproveLimit" label={t('walletPolicy.fieldAutoApproveLimit')}>
							<InputNumber className="w-full" precision={2} />
						</Form.Item>
						<Form.Item
							name="supportedCurrencies"
							label={t('walletPolicy.fieldSupportedCurrencies')}
						>
							<Select mode="tags" placeholder={t('walletPolicy.fieldCurrenciesPlaceholder')} />
						</Form.Item>
						<Space className="mb-4" size="large">
							<Form.Item
								name="transferEnabled"
								label={t('walletPolicy.fieldTransferEnabled')}
								valuePropName="checked"
								className="mb-0"
							>
								<Switch />
							</Form.Item>
							<Form.Item
								name="withdrawalRequireReview"
								label={t('walletPolicy.fieldWithdrawalRequireReview')}
								valuePropName="checked"
								className="mb-0"
							>
								<Switch />
							</Form.Item>
						</Space>
						<Form.Item name="rateLimitPerMin" label={t('walletPolicy.fieldRateLimitPerMin')}>
							<InputNumber
								className="w-full"
								placeholder={t('walletPolicy.fieldRateLimitPerMinPlaceholder')}
								min={0}
							/>
						</Form.Item>
						<Form.Item name="rateLimitPerHour" label={t('walletPolicy.fieldRateLimitPerHour')}>
							<InputNumber
								className="w-full"
								placeholder={t('walletPolicy.fieldRateLimitPerHourPlaceholder')}
								min={0}
							/>
						</Form.Item>
						<Button type="primary" htmlType="submit" loading={updateMut.isPending}>
							{t('walletPolicy.save')}
						</Button>
					</Form>
				</Card>
			)}
		</div>
	);
}
