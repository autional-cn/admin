'use client';

import React, { useEffect } from 'react';
import { Form, InputNumber, Select, Button, Card, Skeleton } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { usePageTitle } from '@autional-cn/shared';
import { PageHeader, SectionCard, ErrorState } from '@autional-cn/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractItem } from '@autional-cn/shared';
import { adminPoliciesNhi, adminPoliciesNhiPut } from '@autional-cn/shared/generated/api';
import { message } from '@/lib/antd-app';
import { handleApiError } from '@/lib/error-handler';
import { queryKeys } from '@/lib/query-keys';
import { useTranslation } from 'react-i18next';

interface NhiPolicy {
	agent_max_count?: number;
	agent_default_ttl?: string;
	robot_max_count?: number;
	device_max_per_owner?: number;
	rotation_days_default?: number;
}

async function fetchNhiPolicy(): Promise<NhiPolicy> {
	const res = await adminPoliciesNhi();
	// 根因修复 (2026-08-13): generated 已解包，extractItem(res.data) → null → 表单永远空
	const data = extractItem(res);
	return data ?? {};
}

async function saveNhiPolicy(values: NhiPolicy): Promise<NhiPolicy> {
	const res = await adminPoliciesNhiPut(values);
	return extractItem(res) ?? {};
}

export default function NhiPolicyPage() {
	const { t } = useTranslation();
	usePageTitle(t('nhiPolicy.pageTitle'));
	const queryClient = useQueryClient();
	const [form] = Form.useForm();

	const {
		data: policy,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: queryKeys.nhiPolicy.all,
		queryFn: fetchNhiPolicy,
		staleTime: 300000,
	});

	useEffect(() => {
		if (policy) {
			form.setFieldsValue(policy);
		}
	}, [policy, form]);

	const saveMut = useMutation({
		mutationFn: saveNhiPolicy,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.nhiPolicy.all });
		},
	});

	const handleSave = async (values: NhiPolicy) => {
		try {
			await saveMut.mutateAsync(values);
			message.success(t('nhiPolicy.saveSuccess'));
		} catch (err) {
			handleApiError(err, t('nhiPolicy.saveFailed'));
		}
	};

	if (isLoading) {
		return (
			<div className="p-6 space-y-3">
				<Skeleton active />
				<Skeleton active />
				<Skeleton active />
			</div>
		);
	}

	if (error && !policy) {
		return (
			<div className="p-6">
				<ErrorState
					title={t('nhiPolicy.loadError')}
					message={t('nhiPolicy.loadErrorHint')}
					onRetry={() => refetch()}
				/>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="mb-6">
				<PageHeader
					title={t('nhiPolicy.title')}
					subtitle={t('nhiPolicy.subtitle')}
				/>
			</div>

			<Form
				form={form}
				layout="vertical"
				onFinish={handleSave}
				initialValues={{
					agent_max_count: 100,
					agent_default_ttl: '1h',
					robot_max_count: 50,
					device_max_per_owner: 10,
					rotation_days_default: 90,
				}}
			>
				<SectionCard title={t('nhiPolicy.section.agentDefaults')}>
					<Form.Item
						name="agent_max_count"
						label={t('nhiPolicy.agentMaxCount')}
						rules={[{ required: true, message: t('nhiPolicy.required') }]}
					>
						<InputNumber min={1} max={10000} className="w-50" />
					</Form.Item>
					<Form.Item
						name="agent_default_ttl"
						label={t('nhiPolicy.agentDefaultTtl')}
						rules={[{ required: true, message: t('nhiPolicy.required') }]}
					>
						<Select
							className="w-50"
							options={[
								{ value: '5m', label: t('nhiPolicy.ttl.5m') },
								{ value: '15m', label: t('nhiPolicy.ttl.15m') },
								{ value: '30m', label: t('nhiPolicy.ttl.30m') },
								{ value: '1h', label: t('nhiPolicy.ttl.1h') },
							]}
						/>
					</Form.Item>
				</SectionCard>

				<SectionCard title={t('nhiPolicy.section.robotDefaults')} className="mt-6">
					<Form.Item
						name="robot_max_count"
						label={t('nhiPolicy.robotMaxCount')}
						rules={[{ required: true, message: t('nhiPolicy.required') }]}
					>
						<InputNumber min={1} max={10000} className="w-50" />
					</Form.Item>
				</SectionCard>

				<SectionCard title={t('nhiPolicy.section.deviceDefaults')} className="mt-6">
					<Form.Item
						name="device_max_per_owner"
						label={t('nhiPolicy.deviceMaxPerOwner')}
						rules={[{ required: true, message: t('nhiPolicy.required') }]}
					>
						<InputNumber min={1} max={1000} className="w-50" />
					</Form.Item>
				</SectionCard>

				<SectionCard title={t('nhiPolicy.section.securityDefaults')} className="mt-6">
					<Form.Item
						name="rotation_days_default"
						label={t('nhiPolicy.rotationDaysDefault')}
						rules={[{ required: true, message: t('nhiPolicy.required') }]}
					>
						<InputNumber min={1} max={365} className="w-50" />
					</Form.Item>
				</SectionCard>

				<div className="mt-6">
					<Button
						type="primary"
						htmlType="submit"
						icon={<SaveOutlined />}
						loading={saveMut.isPending}
						size="large"
					>
						{t('nhiPolicy.savePolicy')}
					</Button>
				</div>
			</Form>
		</div>
	);
}
