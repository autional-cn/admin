'use client';

import React, { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Tag, Row, Col, Space, Spin, Statistic, Skeleton } from 'antd';
import { message } from '@/lib/antd-app';
import { CheckCircleOutlined, SendOutlined, SwapRightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
	useChannelStats,
	useCommunicationDashboard,
	useMessageLogs,
	useCommunicationProviders,
	useSaveCommunicationProvider,
} from '@/hooks/use-communication';
import { getCommunicationHealth } from '@/lib/api.generated';
import { handleApiError } from '@/lib/error-handler';
import { PageError, DataTable } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';

interface HealthStatus {
	channel: string;
	status: 'healthy' | 'unhealthy' | 'unknown';
	latency?: string;
}

export default function CommunicationPage() {
	const { t } = useTranslation();
	const [activeTab, setActiveTab] = useState('dashboard');
	const [healthMap, setHealthMap] = useState<Record<string, HealthStatus>>({});
	const [checkingHealth, setCheckingHealth] = useState<Record<string, boolean>>({});
	const [savingChannel, setSavingChannel] = useState<string | null>(null);

	const { data: dashboard, isLoading: dashLoading } = useCommunicationDashboard();
	const { data: logs = [], isLoading: logsLoading, error, refetch } = useMessageLogs();
	const { data: stats } = useChannelStats();
	const { data: providers = [] } = useCommunicationProviders();
	const saveProviderMut = useSaveCommunicationProvider();

	const [emailForm] = Form.useForm();
	const [smsForm] = Form.useForm();
	const [pushForm] = Form.useForm();
	const channelForms: Record<string, ReturnType<typeof Form.useForm>[0]> = {
		email: emailForm,
		sms: smsForm,
		push: pushForm,
	};

	const CHANNELS = [
		{ key: 'email', label: t('communication.channel.email'), icon: '📧' },
		{ key: 'sms', label: t('communication.channel.sms'), icon: '📱' },
		{ key: 'push', label: t('communication.channel.push'), icon: '🔔' },
	];

	const statusLabels: Record<string, string> = {
		sent: t('communication.status.sent'),
		delivered: t('communication.status.delivered'),
		failed: t('communication.status.failed'),
		pending: t('communication.status.pending'),
		scheduled: t('communication.status.scheduled'),
		cancelled: t('communication.status.cancelled'),
		partial: t('communication.status.partial'),
		opened: t('communication.status.opened'),
	};

	const statusColors: Record<string, string> = {
		sent: 'blue',
		delivered: 'green',
		failed: 'red',
		pending: 'default',
		scheduled: 'orange',
		cancelled: 'default',
		partial: 'warning',
		opened: 'cyan',
	};

	const getHealthText = (status: string) => {
		if (status === 'healthy') return t('communication.status.normal');
		if (status === 'unhealthy') return t('communication.status.abnormal');
		return t('communication.status.unknown');
	};

	const handleCheckHealth = async (channel: string) => {
		setCheckingHealth((prev) => ({ ...prev, [channel]: true }));
		try {
			const res: unknown = await getCommunicationHealth(channel);
			const data = res as Record<string, unknown> | undefined;
			setHealthMap((prev) => ({
				...prev,
				[channel]: {
					channel,
					status: (data?.status as HealthStatus['status']) || 'unknown',
					latency: data?.latency as string | undefined,
				},
			}));
		} catch (err) {
			setHealthMap((prev) => ({
				...prev,
				[channel]: { channel, status: 'unhealthy' },
			}));
			handleApiError(err, t('communication.healthCheckFailed'));
		} finally {
			setCheckingHealth((prev) => ({ ...prev, [channel]: false }));
		}
	};

	const handleSaveConfig = async (channel: string, values: Record<string, unknown>) => {
		setSavingChannel(channel);
		try {
			const existing = (providers as Array<{ channel: string; id?: string }>).find(
				(p) => p.channel === channel,
			);
			await saveProviderMut.mutateAsync({
				id: existing?.id,
				channel,
				data: values,
			});
			const chLabel = CHANNELS.find((c) => c.key === channel)?.label;
			message.success(
				t('communication.saveConfigSuccess').replace('{channel}', chLabel || channel),
			);
		} catch (err) {
			handleApiError(err, t('communication.saveConfigFailed'));
		} finally {
			setSavingChannel(null);
		}
	};

	const logColumns = [
		{ title: t('communication.id'), dataIndex: 'id', key: 'id', ellipsis: true },
		{
			title: t('communication.channel'),
			dataIndex: 'channel',
			key: 'channel',
			render: (v: string) => <Tag>{v?.toUpperCase()}</Tag>,
		},
		{ title: t('communication.recipient'), dataIndex: 'recipient', key: 'recipient' },
		{
			title: t('common.status'),
			dataIndex: 'status',
			key: 'status',
			render: (v: string) => <Tag color={statusColors[v] || 'default'}>{statusLabels[v] || v}</Tag>,
		},
		{ title: t('communication.sendTime'), dataIndex: 'sentAt', key: 'sentAt' },
	];

	const dashboardTab = (
		<div>
			<Row gutter={[16, 16]}>
				<Col xs={24} sm={12} md={6}>
					<Card>
						{dashLoading ? (
							<Skeleton active paragraph={{ rows: 0 }} />
						) : (
							<Statistic
								title={t('communication.totalSent30d')}
								value={dashboard?.totalSent ?? 0}
								prefix={<SendOutlined className="text-info" />}
							/>
						)}
					</Card>
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Card>
						{dashLoading ? (
							<Skeleton active paragraph={{ rows: 0 }} />
						) : (
							<Statistic
								title={t('communication.delivered')}
								value={dashboard?.delivered ?? 0}
								prefix={<CheckCircleOutlined className="text-success" />}
							/>
						)}
					</Card>
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Card>
						{dashLoading ? (
							<Skeleton active paragraph={{ rows: 0 }} />
						) : (
							<Statistic
								title={t('communication.failed')}
								value={dashboard?.failed ?? 0}
								valueStyle={{ color: (dashboard?.failed ?? 0) > 0 ? 'var(--color-danger-text)' : undefined }}
							/>
						)}
					</Card>
				</Col>
				<Col xs={24} sm={12} md={6}>
					<Card>
						{dashLoading ? (
							<Skeleton active paragraph={{ rows: 0 }} />
						) : (
							<Statistic
								title={t('communication.deliveryRate')}
								value={
									dashboard?.deliveryRate ? Math.round(dashboard.deliveryRate * 10000) / 100 : 0
								}
								suffix="%"
								precision={1}
								valueStyle={{ color: (dashboard?.deliveryRate ?? 0) > 0.9 ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}
							/>
						)}
					</Card>
				</Col>
			</Row>

			<Row gutter={[16, 16]} className="mt-6">
				<Col xs={24} md={12}>
					<Card title={t('communication.byChannel')}>
						{dashLoading ? (
							<Skeleton active paragraph={{ rows: 3 }} />
						) : (
							<DataTable
								dataSource={Object.entries(dashboard?.byChannel ?? {}).map(([key, count]) => ({
									channel: key.toUpperCase(),
									count,
								}))}
								pagination={false}
								size="small"
								rowKey="channel"
								scroll={{ x: 800 }}
								columns={[
									{
										title: t('communication.channel'),
										dataIndex: 'channel',
										key: 'channel',
										render: (v: string) => <Tag>{v}</Tag>,
									},
									{
										title: t('communication.sentCount'),
										dataIndex: 'count',
										key: 'count',
										render: (v: number) => v.toLocaleString(),
									},
								]}
							/>
						)}
					</Card>
				</Col>
				<Col xs={24} md={12}>
					<Card title={t('communication.byStatus')}>
						{dashLoading ? (
							<Skeleton active paragraph={{ rows: 3 }} />
						) : (
							<DataTable
								dataSource={Object.entries(dashboard?.byStatus ?? {}).map(([key, count]) => ({
									status: key,
									label: statusLabels[key] || key,
									color: statusColors[key] || 'default',
									count,
								}))}
								pagination={false}
								size="small"
								rowKey="status"
								scroll={{ x: 800 }}
								columns={[
									{
										title: t('common.status'),
										dataIndex: 'status',
										key: 'status',
										render: (_v: string, r: { color: string; label: string }) => (
											<Tag color={r.color}>{r.label}</Tag>
										),
									},
									{
										title: t('communication.count'),
										dataIndex: 'count',
										key: 'count',
										render: (v: number) => v.toLocaleString(),
									},
								]}
							/>
						)}
					</Card>
				</Col>
			</Row>
		</div>
	);

	const tabs = [
		{
			key: 'dashboard',
			label: t('communication.dashboard'),
			children: dashboardTab,
		},
		...CHANNELS.map((c) => ({
			key: c.key,
			label: c.label,
			children: (
				<>
					<Card
						title={t('communication.channelConfig').replace('{channel}', c.label)}
						className="mb-4"
					>
						<Form
							form={channelForms[c.key]}
							layout="vertical"
							onFinish={(values: unknown) =>
								handleSaveConfig(c.key, values as Record<string, unknown>)
							}
						>
							<Row gutter={16}>
								<Col xs={24} md={12}>
									<Form.Item name="host" label={t('communication.serverAddress')}>
										<Input
											placeholder={c.key === 'email' ? 'smtp.example.com' : 'api.example.com'}
										/>
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item name="port" label={t('communication.port')}>
										<Input placeholder={c.key === 'email' ? '587' : '443'} />
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item name="apiKey" label={t('communication.apiKey')}>
										<Input.Password placeholder="sk-***" />
									</Form.Item>
								</Col>
								<Col xs={24} md={12}>
									<Form.Item name="secret" label={t('communication.secret')}>
										<Input.Password placeholder="***" />
									</Form.Item>
								</Col>
							</Row>
							<Space>
								<Button type="primary" htmlType="submit" loading={savingChannel === c.key}>
									{t('communication.saveConfig')}
								</Button>
								<Button
									icon={<CheckCircleOutlined />}
									onClick={() => handleCheckHealth(c.key)}
									loading={checkingHealth[c.key]}
								>
									{t('communication.healthCheck')}
								</Button>
							</Space>
						</Form>
					</Card>

					<Card title={t('communication.sendLogs')}>
						<Spin spinning={logsLoading}>
							<DataTable
								rowKey="id"
								columns={logColumns}
								dataSource={logs}
								pagination={{ pageSize: 10 }}
								scroll={{ x: 800 }}
							/>
						</Spin>
					</Card>
				</>
			),
		})),
	];

	return (
		<div>
			<ConsolePageHeader title={t('communication.title')} />

			<Row gutter={[16, 16]} className="mb-6">
				{CHANNELS.map((c) => {
					const health = healthMap[c.key];
					const color =
						health?.status === 'healthy'
							? 'success'
							: health?.status === 'unhealthy'
								? 'error'
								: 'default';
					const text = getHealthText(health?.status || 'unknown');
					return (
						<Col xs={24} sm={8} key={c.key}>
							<Card>
								<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
									<div>
										<div className="text-neutral-600 text-sm">
											{c.label} {t('common.status')}
										</div>
										<div className="text-2xl font-bold mt-1">
											<Tag color={color}>{text}</Tag>
										</div>
										{health?.latency && (
											<div className="text-xs text-neutral-600 mt-1">
												{t('notifications.stats.readRate')}: {health.latency}
											</div>
										)}
									</div>
									<div className="text-3xl">{c.icon}</div>
								</div>
							</Card>
						</Col>
					);
				})}
			</Row>

			{error && (
				<PageError message={t('communication.loadError')} retry={refetch} className="mb-4" />
			)}

			<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
		</div>
	);
}
