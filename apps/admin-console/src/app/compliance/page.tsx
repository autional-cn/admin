'use client';
// @generated-api-exempt: 2 key(s) [COMPLIANCE.ADMIN_TENANT_SELF_POLICY, COMPLIANCE.ADMIN_TENANT_SELF_SCORE] lack generated func

import React, { useState, useEffect } from 'react';
import {
	Tabs,
	Card,
	Tag,
	Button,
	Table,
	Statistic,
	Row,
	Col,
	Space,
	Modal,
	Form,
	Input,
	Select,
	Empty,
	Drawer,
	Progress,
	Badge,
} from 'antd';
import { message, modal } from '@/lib/antd-app';
import {
	SafetyCertificateOutlined,
	EditOutlined,
	PlusOutlined,
	EyeOutlined,
	SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
	useDSARs,
	useUpdateDSAR,
	useExecuteErasure,
	useRetentionPolicies,
	useSODRules,
	useISOControls,
	useCreateRetentionPolicy,
	useUpdateRetentionPolicy,
	useConsents,
	useCreateConsent,
	useRevokeConsent,
} from '@/hooks/use-compliance';
import { handleApiError } from '@/lib/error-handler';
import { PageError } from '@autional-cn/ui/antd';
import { apiClient, API_PATHS, useIsAuditRestricted, AuditStatsOnly, extractItem, useTenantSlug } from '@autional-cn/shared';
import { buildNavHref } from '@/lib/nav';
import { useNavigate } from 'react-router';

interface DSARRecord {
	id: string;
	requesterEmail: string;
	type: string;
	status: string;
	createdAt: string;
	description?: string;
}

interface RetentionPolicy {
	id: string;
	name: string;
	resourceType: string;
	retentionDays: number;
	actionAfterExpiry: string;
	status: string;
}

interface SODRule {
	id: string;
	name: string;
	roleA: string;
	roleB: string;
	description: string;
}

interface ISOControl {
	id: string;
	controlId: string;
	title: string;
	domain: string;
	complianceStatus: string;
}

interface ConsentRecord {
	id: string;
	userId: string;
	scope: string;
	granted: boolean;
	ipAddress?: string;
	recordedAt?: string;
	revokedAt?: string;
	version?: string;
}

export default function CompliancePage() {
	const { t } = useTranslation();
	const isRestricted = useIsAuditRestricted();
	const [activeTab, setActiveTab] = useState('dashboard');
	const [complianceScore, setComplianceScore] = useState<number | null>(null);
	const [standardCount, setStandardCount] = useState(0);
	const navigate = useNavigate();
	const tenantSlug = useTenantSlug();
	const [dsarDrawer, setDsarDrawer] = useState(false);
	const [currentDsar, setCurrentDsar] = useState<DSARRecord | null>(null);

	const [policyModal, setPolicyModal] = useState(false);
	const [policyForm] = Form.useForm();
	const [editingPolicy, setEditingPolicy] = useState<RetentionPolicy | null>(null);

	const [consentModal, setConsentModal] = useState(false);
	const [consentForm] = Form.useForm();

	const { data: dsars = [], isLoading: dsarLoading } = useDSARs();
	const { data: policies = [], isLoading: policyLoading, error, refetch } = useRetentionPolicies();
	const { data: sodRules = [], isLoading: sodLoading } = useSODRules();
	const { data: isoControls = [], isLoading: isoLoading } = useISOControls();
	const updateDsarMut = useUpdateDSAR();
	const erasureMut = useExecuteErasure();
	const createPolicyMut = useCreateRetentionPolicy();
	const updatePolicyMut = useUpdateRetentionPolicy();
	const { data: consents = [], isLoading: consentLoading } = useConsents();
	const createConsentMut = useCreateConsent();
	const revokeConsentMut = useRevokeConsent();

	const loading = dsarLoading || policyLoading || sodLoading || isoLoading;

	useEffect(() => {
		(async () => {
			try {
				const scoreRes = await apiClient.get(API_PATHS.COMPLIANCE.ADMIN_TENANT_SELF_SCORE);
				if (extractItem(scoreRes.data)) {
					setComplianceScore(extractItem(scoreRes.data)?.overallScore ?? null);
				}
				const polRes = await apiClient.get(API_PATHS.COMPLIANCE.ADMIN_TENANT_SELF_POLICY);
				setStandardCount(extractItem(polRes.data)?.standards?.length || 0);
			} catch (err) {
				if (import.meta.env.DEV) {
					console.error('Failed to load compliance data', err);
				}
			}
		})();
	}, []);

	const handleProcessDsar = async (id: string, statusVal: string) => {
		try {
			await updateDsarMut.mutateAsync({ id, data: { status: statusVal } });
			message.success(t('compliance.dsar.updateSuccess'));
		} catch (err) {
			handleApiError(err, t('compliance.updateFailed'));
		}
	};

	const handleExecuteErasure = async (id: string) => {
		modal.confirm({
			title: t('compliance.dsar.confirmErasure'),
			content: t('compliance.dsar.erasureWarning'),
			okText: t('compliance.dsar.executeErasure'),
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await erasureMut.mutateAsync(id);
					message.success(t('compliance.dsar.erasureSuccess'));
				} catch (err) {
					handleApiError(err, t('compliance.dsar.erasureFailed'));
				}
			},
		});
	};

	const handleSavePolicy = async (values: any) => {
		try {
			if (editingPolicy) {
				await updatePolicyMut.mutateAsync({ id: editingPolicy.id, data: values });
				message.success(t('compliance.retention.updateSuccess'));
			} else {
				await createPolicyMut.mutateAsync(values);
				message.success(t('compliance.retention.createSuccess'));
			}
			setPolicyModal(false);
			policyForm.resetFields();
			setEditingPolicy(null);
		} catch (err) {
			handleApiError(err, t('compliance.retention.saveFailed'));
		}
	};

	const handleCreateConsent = async (values: {
		userId: string;
		scope: string;
		granted: boolean;
	}) => {
		try {
			await createConsentMut.mutateAsync({
				userId: values.userId,
				purpose: values.scope,
				service: 'admin-console',
				granted: values.granted,
				consentMethod: 'manual',
			});
			message.success(t('compliance.consent.createSuccess'));
			setConsentModal(false);
			consentForm.resetFields();
		} catch (err) {
			handleApiError(err, t('compliance.consent.createFailed'));
		}
	};

	const handleRevokeConsent = (record: ConsentRecord) => {
		modal.confirm({
			title: t('compliance.consent.confirmRevoke'),
			content: t('compliance.consent.revokeMessage', {
				userId: record.userId,
				scope: record.scope,
			}),
			okText: t('compliance.consent.revoke'),
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await revokeConsentMut.mutateAsync({ userId: record.userId, purpose: record.scope });
					message.success(t('compliance.consent.revokeSuccess'));
				} catch (err) {
					handleApiError(err, t('compliance.consent.revokeFailed'));
				}
			},
		});
	};

	const dsarColumns = [
		{ title: t('compliance.dsar.requester'), dataIndex: 'requesterEmail', key: 'requesterEmail' },
		{
			title: t('common.type'),
			dataIndex: 'type',
			key: 'type',
			render: (v: string) => <Tag>{v}</Tag>,
		},
		{
			title: t('common.status'),
			dataIndex: 'status',
			key: 'status',
			render: (v: string) => (
				<Tag color={v === 'completed' ? 'success' : v === 'pending' ? 'warning' : 'default'}>
					{v}
				</Tag>
			),
		},
		{ title: t('common.createdAt'), dataIndex: 'createdAt', key: 'createdAt' },
		{
			title: t('common.actions'),
			key: 'action',
			render: (_: any, record: DSARRecord) => (
				<Space size="small">
					<Button
						type="link"
						icon={<EyeOutlined />}
						onClick={() => {
							setCurrentDsar(record);
							setDsarDrawer(true);
						}}
					>
						{t('compliance.dsar.viewDetail')}
					</Button>
					<Button type="link" onClick={() => handleProcessDsar(record.id, 'completed')}>
						{t('compliance.dsar.markComplete')}
					</Button>
					<Button type="link" danger onClick={() => handleExecuteErasure(record.id)}>
						{t('compliance.dsar.executeErasure')}
					</Button>
				</Space>
			),
		},
	];

	const policyColumns = [
		{ title: t('common.name'), dataIndex: 'name', key: 'name' },
		{
			title: t('compliance.retention.resourceType'),
			dataIndex: 'resourceType',
			key: 'resourceType',
		},
		{
			title: t('compliance.retention.retentionDays'),
			dataIndex: 'retentionDays',
			key: 'retentionDays',
		},
		{
			title: t('compliance.retention.actionAfterExpiry'),
			dataIndex: 'actionAfterExpiry',
			key: 'actionAfterExpiry',
		},
		{
			title: t('common.status'),
			dataIndex: 'status',
			key: 'status',
			render: (v: string) => <Tag color={v === 'active' ? 'success' : 'default'}>{v}</Tag>,
		},
		{
			title: t('common.actions'),
			key: 'action',
			render: (_: any, record: RetentionPolicy) => (
				<Space size="small">
					<Button
						type="link"
						icon={<EditOutlined />}
						onClick={() => {
							setEditingPolicy(record);
							policyForm.setFieldsValue(record);
							setPolicyModal(true);
						}}
					>
						{t('common.edit')}
					</Button>
				</Space>
			),
		},
	];

	const sodColumns = [
		{ title: t('compliance.sod.ruleName'), dataIndex: 'name', key: 'name' },
		{ title: t('compliance.sod.roleA'), dataIndex: 'roleA', key: 'roleA' },
		{ title: t('compliance.sod.roleB'), dataIndex: 'roleB', key: 'roleB' },
		{
			title: t('common.description'),
			dataIndex: 'description',
			key: 'description',
			ellipsis: true,
		},
	];

	const isoColumns = [
		{ title: t('compliance.iso.controlId'), dataIndex: 'controlId', key: 'controlId' },
		{ title: t('compliance.iso.title'), dataIndex: 'title', key: 'title' },
		{ title: t('compliance.iso.domain'), dataIndex: 'domain', key: 'domain' },
		{
			title: t('compliance.iso.complianceStatus'),
			dataIndex: 'complianceStatus',
			key: 'complianceStatus',
			render: (v: string) => (
				<Tag color={v === 'compliant' ? 'success' : v === 'non_compliant' ? 'error' : 'warning'}>
					{v}
				</Tag>
			),
		},
	];

	const consentColumns = [
		{ title: t('compliance.consent.userId'), dataIndex: 'userId', key: 'userId', ellipsis: true },
		{
			title: t('compliance.consent.scopeColumn'),
			dataIndex: 'scope',
			key: 'scope',
			render: (v: string) => <Tag>{v || '-'}</Tag>,
		},
		{
			title: t('common.status'),
			key: 'status',
			render: (_: any, r: ConsentRecord) => (
				<Tag color={r.granted ? 'success' : 'error'}>
					{r.granted ? t('compliance.consent.granted') : t('compliance.consent.revokedStatus')}
				</Tag>
			),
		},
		{
			title: t('compliance.consent.ipAddress'),
			dataIndex: 'ipAddress',
			key: 'ipAddress',
			ellipsis: true,
		},
		{
			title: t('compliance.consent.recordedAt'),
			dataIndex: 'recordedAt',
			key: 'recordedAt',
			render: (v: string) => (v ? new Date(v).toLocaleString('zh-CN') : '-'),
		},
		{ title: t('compliance.consent.version'), dataIndex: 'version', key: 'version' },
		{
			title: t('common.actions'),
			key: 'action',
			render: (_: any, record: ConsentRecord) =>
				record.granted ? (
					<Button type="link" danger onClick={() => handleRevokeConsent(record)}>
						{t('compliance.consent.revoke')}
					</Button>
				) : null,
		},
	];

	const pendingDsarCount = (dsars as DSARRecord[]).filter((d) => d.status === 'pending').length;

	if (isRestricted) {
		return <AuditStatsOnly title={t('compliance.title')} />;
	}

	return (
		<div>
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
				<h1 className="text-xl font-semibold">{t('compliance.title')}</h1>
			</div>

			<Tabs
				activeKey={activeTab}
				onChange={setActiveTab}
				items={[
					{
						key: 'dashboard',
						label: t('compliance.tabDashboard'),
						children: (
							<Row gutter={16}>
								<Col xs={24} md={6}>
									<Card loading={loading}>
										<Statistic
											title={t('compliance.score')}
											value={complianceScore ?? 0}
											suffix="/ 100"
											valueStyle={{
												color:
													(complianceScore ?? 0) >= 80
														? 'var(--color-success-light)'
														: 'var(--color-error-light)',
											}}
											prefix={<SafetyCertificateOutlined />}
										/>
									</Card>
								</Col>
								<Col xs={24} md={6}>
									<Card loading={loading}>
										<Statistic
											title={t('compliance.standardsCount')}
											value={standardCount}
											suffix={t('compliance.standardsUnit')}
										/>
										<Button
											type="link"
											size="small"
											icon={<SettingOutlined />}
											onClick={() => navigate(buildNavHref('/compliance/policy', tenantSlug))}
										>
											{t('compliance.managePolicy')}
										</Button>
									</Card>
								</Col>
								<Col xs={24} md={6}>
									<Card loading={loading}>
										<Statistic
											title={t('compliance.pendingDsar')}
											value={pendingDsarCount}
											valueStyle={{
												color:
													pendingDsarCount > 0
														? 'var(--color-error-light)'
														: 'var(--color-success-light)',
											}}
										/>
									</Card>
								</Col>
							</Row>
						),
					},
					{
						key: 'dsar',
						label: t('compliance.tabDsar'),
						children: (
							<Table
								rowKey="id"
								columns={dsarColumns}
								dataSource={dsars}
								loading={dsarLoading}
								pagination={{ pageSize: 10 }}
								scroll={{ x: 800 }}
							/>
						),
					},
					{
						key: 'consent',
						label: t('compliance.tabConsent'),
						children: (
							<>
								<div className="flex justify-end mb-4">
									<Button
										type="primary"
										icon={<PlusOutlined />}
										onClick={() => {
											consentForm.resetFields();
											setConsentModal(true);
										}}
									>
										{t('compliance.consent.newConsent')}
									</Button>
								</div>
								<Table
									rowKey="id"
									columns={consentColumns}
									dataSource={consents}
									loading={consentLoading}
									pagination={{ pageSize: 10 }}
									scroll={{ x: 800 }}
								/>
							</>
						),
					},
					{
						key: 'retention',
						label: t('compliance.tabRetention'),
						children: (
							<>
								<div className="flex justify-end mb-4">
									<Button
										type="primary"
										icon={<PlusOutlined />}
										onClick={() => {
											setEditingPolicy(null);
											policyForm.resetFields();
											setPolicyModal(true);
										}}
									>
										{t('compliance.retention.createBtn')}
									</Button>
								</div>

								{error && (
									<PageError message={t('compliance.loadError')} retry={refetch} className="mb-4" />
								)}
								<Table
									rowKey="id"
									columns={policyColumns}
									dataSource={policies}
									loading={policyLoading}
									pagination={{ pageSize: 10 }}
									scroll={{ x: 800 }}
								/>
							</>
						),
					},
					{
						key: 'sod',
						label: t('compliance.tabSod'),
						children: (
							<Table
								rowKey="id"
								columns={sodColumns}
								dataSource={sodRules}
								loading={sodLoading}
								pagination={{ pageSize: 10 }}
								scroll={{ x: 800 }}
							/>
						),
					},
					{
						key: 'iso',
						label: t('compliance.tabIso'),
						children: (
							<Table
								rowKey="id"
								columns={isoColumns}
								dataSource={isoControls}
								loading={isoLoading}
								pagination={{ pageSize: 10 }}
								scroll={{ x: 800 }}
							/>
						),
					},
				]}
			/>

			<Drawer
				title={t('compliance.dsar.detailTitle')}
				size={500}
				open={dsarDrawer}
				onClose={() => setDsarDrawer(false)}
				className="!w-full sm:!w-[480px]"
			>
				{currentDsar && (
					<div className="space-y-4">
						<Row>
							<Col span={8} className="text-gray-500">
								{t('common.id')}
							</Col>
							<Col span={16}>{currentDsar.id}</Col>
						</Row>
						<Row>
							<Col span={8} className="text-gray-500">
								{t('compliance.dsar.requester')}
							</Col>
							<Col span={16}>{currentDsar.requesterEmail}</Col>
						</Row>
						<Row>
							<Col span={8} className="text-gray-500">
								{t('common.type')}
							</Col>
							<Col span={16}>
								<Tag>{currentDsar.type}</Tag>
							</Col>
						</Row>
						<Row>
							<Col span={8} className="text-gray-500">
								{t('common.status')}
							</Col>
							<Col span={16}>
								<Tag>{currentDsar.status}</Tag>
							</Col>
						</Row>
						<Row>
							<Col span={8} className="text-gray-500">
								{t('common.createdAt')}
							</Col>
							<Col span={16}>{currentDsar.createdAt}</Col>
						</Row>
						<Row>
							<Col span={8} className="text-gray-500">
								{t('common.description')}
							</Col>
							<Col span={16}>{currentDsar.description || '-'}</Col>
						</Row>
					</div>
				)}
			</Drawer>

			<Modal
				title={
					editingPolicy
						? t('compliance.retention.modalEdit')
						: t('compliance.retention.modalCreate')
				}
				open={policyModal}
				onCancel={() => {
					setPolicyModal(false);
					setEditingPolicy(null);
					policyForm.resetFields();
				}}
				onOk={() => policyForm.submit()}
				className="w-full max-w-[560px]"
			>
				<Form form={policyForm} layout="vertical" onFinish={handleSavePolicy}>
					<Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}>
						<Input placeholder={t('compliance.retention.namePlaceholder')} />
					</Form.Item>
					<Form.Item
						name="resourceType"
						label={t('compliance.retention.resourceType')}
						rules={[{ required: true }]}
					>
						<Input placeholder={t('compliance.retention.resourceTypePlaceholder')} />
					</Form.Item>
					<Form.Item
						name="retentionDays"
						label={t('compliance.retention.retentionDays')}
						rules={[{ required: true }]}
					>
						<Input type="number" placeholder="365" />
					</Form.Item>
					<Form.Item
						name="actionAfterExpiry"
						label={t('compliance.retention.actionAfterExpiry')}
						rules={[{ required: true }]}
					>
						<Select
							placeholder={t('compliance.retention.actionPlaceholder')}
							options={[
								{ value: 'delete', label: t('common.delete') },
								{ value: 'archive', label: t('compliance.retention.actionArchive') },
								{ value: 'anonymize', label: t('compliance.retention.actionAnonymize') },
							]}
						/>
					</Form.Item>
				</Form>
			</Modal>

			<Modal
				title={t('compliance.consent.modalTitle')}
				open={consentModal}
				onCancel={() => {
					setConsentModal(false);
					consentForm.resetFields();
				}}
				onOk={() => consentForm.submit()}
				className="w-full max-w-[560px]"
			>
				<Form form={consentForm} layout="vertical" onFinish={handleCreateConsent}>
					<Form.Item
						name="userId"
						label={t('compliance.consent.userId')}
						rules={[{ required: true, message: t('compliance.consent.userIdRequired') }]}
					>
						<Input placeholder={t('compliance.consent.userIdPlaceholder')} />
					</Form.Item>
					<Form.Item
						name="scope"
						label={t('compliance.consent.scope')}
						rules={[{ required: true, message: t('compliance.consent.scopeRequired') }]}
					>
						<Select
							placeholder={t('compliance.consent.scopePlaceholder')}
							options={[
								{ value: 'marketing', label: t('compliance.consent.scopeMarketing') },
								{ value: 'analytics', label: t('compliance.consent.scopeAnalytics') },
								{ value: 'third_party', label: t('compliance.consent.scopeThirdParty') },
								{ value: 'terms', label: t('compliance.consent.scopeTerms') },
								{ value: 'privacy', label: t('compliance.consent.scopePrivacy') },
							]}
						/>
					</Form.Item>
					<Form.Item
						name="granted"
						label={t('compliance.consent.status')}
						rules={[{ required: true }]}
						initialValue={true}
					>
						<Select
							options={[
								{ value: true, label: t('compliance.consent.granted') },
								{ value: false, label: t('compliance.consent.rejected') },
							]}
						/>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
