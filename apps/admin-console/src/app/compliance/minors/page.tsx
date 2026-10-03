'use client';
// @generated-api-exempt: 2 key(s) [IDENTITY.ADMIN_CONSENTS, TENANT.MINORS_PROTECTION] lack generated func

import React, { useState, useEffect } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import { Card, Form, InputNumber, Switch, Button, message, Spin, TimePicker, Space, Statistic, Row, Col, Tabs, Tag } from 'antd';
import {
	SafetyCertificateOutlined,
	SaveOutlined,
	ReloadOutlined,
	UserOutlined,
	AuditOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { handleApiError } from '@/lib/error-handler';

import { apiClient, API_PATHS, extractList, extractItem, useCurrentTenantId } from '@autional-cn/shared';
import { adminUsers } from '@autional-cn/shared/generated/api';
import { ConsolePageHeader, SectionCard } from '@autional-cn/ui';
import dayjs from 'dayjs';

interface MinorsProtectionConfig {
	tenant_id: string;
	daily_usage_limit_min: number;
	night_mode_start: string;
	night_mode_end: string;
	night_mode_enabled: boolean;
	monthly_spend_limit: number;
	live_stream_blocked_under_16: boolean;
	content_filter_enabled: boolean;
	child_default_max_privacy: boolean;
	minor_data_retention_days: number;
}

interface MinorUser {
	id: string;
	tenant_id: string;
	email: string;
	phone: string;
	username: string;
	status: string;
	is_minor: boolean;
	age_group: string;
	birth_date: string;
	pending_parental_consent: boolean;
	created_at: string;
}

interface ConsentRecord {
	id: string;
	user_id: string;
	parent_email: string;
	parent_phone: string;
	status: string;
	verified: boolean;
	method: string;
	recorded_at: string;
	verified_at?: string;
}

export default function MinorsProtectionPage() {
	const { t } = useTranslation();

	const AGE_GROUP_LABELS: Record<string, string> = {
		'under-14': t('compliance.minors.ageGroupUnder14'),
		'14-16': t('compliance.minors.ageGroup14to16'),
		'16-18': t('compliance.minors.ageGroup16to18'),
		adult: t('compliance.minors.ageGroupAdult'),
	};

	const STATUS_COLORS: Record<string, string> = {
		pending: 'orange',
		verified: 'green',
		expired: 'default',
		denied: 'red',
	};

	const [config, setConfig] = useState<MinorsProtectionConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [users, setUsers] = useState<MinorUser[]>([]);
	const [usersLoading, setUsersLoading] = useState(false);
	const [userTotal, setUserTotal] = useState(0);
	const [consents, setConsents] = useState<ConsentRecord[]>([]);
	const [consentsLoading, setConsentsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('config');
	const [form] = Form.useForm();
	const tenantId = useCurrentTenantId() ?? '';

	useEffect(() => {
		loadConfig();
	}, []);

	const loadConfig = async () => {
		try {
			const res = await apiClient.get(API_PATHS.TENANT.MINORS_PROTECTION(tenantId));
			setConfig(res.data.data as MinorsProtectionConfig);
			const d = res.data.data as MinorsProtectionConfig;
			form.setFieldsValue({
				daily_usage_limit_min: d.daily_usage_limit_min,
				monthly_spend_limit: d.monthly_spend_limit,
				night_mode_enabled: d.night_mode_enabled,
				night_mode_start: d.night_mode_start
					? dayjs(d.night_mode_start, 'HH:mm')
					: dayjs('22:00', 'HH:mm'),
				night_mode_end: d.night_mode_end
					? dayjs(d.night_mode_end, 'HH:mm')
					: dayjs('06:00', 'HH:mm'),
				live_stream_blocked_under_16: d.live_stream_blocked_under_16,
				content_filter_enabled: d.content_filter_enabled,
				child_default_max_privacy: d.child_default_max_privacy,
				minor_data_retention_days: d.minor_data_retention_days,
			});
		} catch {
			// 加载配置失败时保持默认设置
		} finally {
			setLoading(false);
		}
	};

	const loadUsers = async () => {
		setUsersLoading(true);
		try {
			const res = await adminUsers({ is_minor: true, page_size: 100 } as any);
			setUsers(extractList(res));
			setUserTotal(extractItem(res)?.total || 0);
		} catch (err) {
			handleApiError(err, t('compliance.minors.loadUsersFailed'));
		} finally {
			setUsersLoading(false);
		}
	};

	const loadConsents = async () => {
		setConsentsLoading(true);
		try {
			const res = await apiClient.get(API_PATHS.IDENTITY.ADMIN_CONSENTS, {
				params: { page_size: 100 },
			});
			setConsents(extractList(res.data));
		} catch {
			// 加载同意记录失败时保持空列表
		} finally {
			setConsentsLoading(false);
		}
	};

	const handleTabChange = (key: string) => {
		setActiveTab(key);
		if (key === 'users' && users.length === 0) loadUsers();
		if (key === 'consents' && consents.length === 0) loadConsents();
	};

	const handleSave = async () => {
		try {
			const values = await form.validateFields();
			setSaving(true);
			const payload: Record<string, unknown> = {};
			payload.daily_usage_limit_min = values.daily_usage_limit_min;
			payload.monthly_spend_limit = values.monthly_spend_limit;
			payload.night_mode_enabled = values.night_mode_enabled;
			payload.live_stream_blocked_under_16 = values.live_stream_blocked_under_16;
			payload.content_filter_enabled = values.content_filter_enabled;
			payload.child_default_max_privacy = values.child_default_max_privacy;
			payload.minor_data_retention_days = values.minor_data_retention_days;
			if (values.night_mode_start)
				payload.night_mode_start = values.night_mode_start.format('HH:mm');
			if (values.night_mode_end) payload.night_mode_end = values.night_mode_end.format('HH:mm');
			await apiClient.put(API_PATHS.TENANT.MINORS_PROTECTION(tenantId), payload);
			message.success(t('compliance.minors.saveSuccess'));
			loadConfig();
		} catch (err) {
			handleApiError(err, t('compliance.minors.saveFailed'));
		} finally {
			setSaving(false);
		}
	};

	const userColumns = [
		{
			title: t('compliance.minors.columnUserId'),
			dataIndex: 'id',
			key: 'id',
			width: 200,
			ellipsis: true,
		},
		{ title: t('common.email'), dataIndex: 'email', key: 'email' },
		{ title: t('compliance.minors.columnPhone'), dataIndex: 'phone', key: 'phone' },
		{
			title: t('compliance.minors.columnAgeGroup'),
			dataIndex: 'age_group',
			key: 'age_group',
			render: (v: string) => (
				<Tag color={v === 'under-14' ? 'red' : v === '14-16' ? 'orange' : 'blue'}>
					{AGE_GROUP_LABELS[v] || v}
				</Tag>
			),
		},
		{
			title: t('compliance.minors.columnParentalConsent'),
			dataIndex: 'pending_parental_consent',
			key: 'pending_parental_consent',
			render: (v: boolean) =>
				v ? (
					<Tag color="orange">{t('compliance.minors.pendingVerification')}</Tag>
				) : (
					<Tag color="green">{t('compliance.minors.verified')}</Tag>
				),
		},
		{ title: t('compliance.minors.columnStatus'), dataIndex: 'status', key: 'status' },
		{
			title: t('compliance.minors.columnCreatedAt'),
			dataIndex: 'created_at',
			key: 'created_at',
			width: 180,
		},
	];

	if (loading) return <Spin size="large" className="block mx-auto my-[100px]" />;

	return (
		<div className="p-6">
			<ConsolePageHeader title={t('compliance.minors.title')} description={t('compliance.minors.subtitle')} />

			<Row gutter={16} className="mb-6">
				<Col span={8}>
					<Card>
						<Statistic
							title={t('compliance.minors.userCount')}
							value={userTotal}
							prefix={<UserOutlined />}
						/>
					</Card>
				</Col>
				<Col span={8}>
					<Card>
						<Statistic
							title={t('compliance.minors.dailyLimit')}
							value={config?.daily_usage_limit_min || 0}
							suffix={t('compliance.minors.minutes')}
						/>
					</Card>
				</Col>
				<Col span={8}>
					<Card>
						<Statistic
							title={t('compliance.minors.curfew')}
							value={
								config?.night_mode_enabled
									? `${config.night_mode_start}-${config.night_mode_end}`
									: t('compliance.minors.curfewOff')
							}
							prefix={<SafetyCertificateOutlined />}
						/>
					</Card>
				</Col>
			</Row>

			<Tabs
				activeKey={activeTab}
				onChange={handleTabChange}
				items={[
					{
						key: 'config',
						label: t('compliance.minors.tabConfig'),
						children: (
							<>
								<SectionCard title={t('compliance.minors.sectionAntiAddiction')}>
									<Form form={form} layout="vertical" className="max-w-[600px]">
										<Form.Item
											name="daily_usage_limit_min"
											label={t('compliance.minors.dailyUsageLimit')}
											tooltip={t('compliance.minors.dailyUsageTooltip')}
										>
											<InputNumber min={0} max={1440} className="w-full" />
										</Form.Item>
										<Form.Item
											name="night_mode_enabled"
											label={t('compliance.minors.enableCurfew')}
											valuePropName="checked"
										>
											<Switch />
										</Form.Item>
										<Form.Item
											shouldUpdate={(prev, cur) =>
												prev.night_mode_enabled !== cur.night_mode_enabled
											}
										>
											{({ getFieldValue }) =>
												getFieldValue('night_mode_enabled') ? (
													<Space>
														<Form.Item
															name="night_mode_start"
															label={t('compliance.minors.curfewStart')}
														>
															<TimePicker format="HH:mm" />
														</Form.Item>
														<Form.Item
															name="night_mode_end"
															label={t('compliance.minors.curfewEnd')}
														>
															<TimePicker format="HH:mm" />
														</Form.Item>
													</Space>
												) : null
											}
										</Form.Item>
									</Form>
								</SectionCard>

								<SectionCard title={t('compliance.minors.sectionSpending')} className="mt-4">
									<Form form={form} layout="vertical" className="max-w-[600px]">
										<Form.Item
											name="monthly_spend_limit"
											label={t('compliance.minors.monthlySpendLimit')}
											tooltip={t('compliance.minors.monthlySpendTooltip')}
										>
											<InputNumber min={0} className="w-full" />
										</Form.Item>
										<Form.Item
											name="live_stream_blocked_under_16"
											label={t('compliance.minors.blockLiveUnder16')}
											valuePropName="checked"
										>
											<Switch />
										</Form.Item>
										<Form.Item
											name="content_filter_enabled"
											label={t('compliance.minors.enableContentFilter')}
											valuePropName="checked"
										>
											<Switch />
										</Form.Item>
									</Form>
								</SectionCard>

								<SectionCard title={t('compliance.minors.sectionPrivacy')} className="mt-4">
									<Form form={form} layout="vertical" className="max-w-[600px]">
										<Form.Item
											name="child_default_max_privacy"
											label={t('compliance.minors.defaultMaxPrivacy')}
											valuePropName="checked"
										>
											<Switch />
										</Form.Item>
										<Form.Item
											name="minor_data_retention_days"
											label={t('compliance.minors.dataRetentionDays')}
										>
											<InputNumber min={30} max={3650} className="w-full" />
										</Form.Item>
									</Form>
								</SectionCard>

								<div className="mt-6 text-right">
									<Button onClick={loadConfig} icon={<ReloadOutlined />} className="mr-2">
										{t('compliance.minors.reset')}
									</Button>
									<Button
										type="primary"
										onClick={handleSave}
										loading={saving}
										icon={<SaveOutlined />}
									>
										{t('compliance.minors.saveConfig')}
									</Button>
								</div>
							</>
						),
					},
					{
						key: 'users',
						label: `${t('compliance.minors.userTab')} (${userTotal})`,
						children: (
							<DataTable
								columns={userColumns}
								dataSource={users}
								rowKey="id"
								loading={usersLoading}
								pagination={{
									pageSize: 20,
									total: userTotal,
									showSizeChanger: true,
									showTotal: (total) => t('paginationTotal', { count: total }),
								}}
								scroll={{ x: 800 }}
							/>
						),
					},
					{
						key: 'consents',
						label: t('compliance.minors.parentalConsentTab'),
						children: (
							<DataTable
								columns={[
									{
										title: t('compliance.minors.columnUserId'),
										dataIndex: 'user_id',
										key: 'user_id',
										width: 200,
										ellipsis: true,
									},
									{
										title: t('compliance.minors.parentEmail'),
										dataIndex: 'parent_email',
										key: 'parent_email',
									},
									{
										title: t('compliance.minors.verificationMethod'),
										dataIndex: 'method',
										key: 'method',
									},
									{
										title: t('common.status'),
										dataIndex: 'status',
										key: 'status',
										render: (v: string) => <Tag color={STATUS_COLORS[v]}>{v}</Tag>,
									},
									{
										title: t('compliance.minors.isVerified'),
										dataIndex: 'verified',
										key: 'verified',
										render: (v: boolean) =>
											v ? (
												<Tag color="green">{t('compliance.minors.yes')}</Tag>
											) : (
												<Tag>{t('compliance.minors.no')}</Tag>
											),
									},
									{
										title: t('compliance.minors.recordTime'),
										dataIndex: 'recorded_at',
										key: 'recorded_at',
										width: 180,
									},
								]}
								dataSource={consents}
								rowKey="id"
								loading={consentsLoading}
								pagination={{ pageSize: 20 }}
								scroll={{ x: 800 }}
							/>
						),
					},
				]}
			/>
		</div>
	);
}
