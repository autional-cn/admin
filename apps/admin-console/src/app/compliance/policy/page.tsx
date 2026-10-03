'use client';
// @generated-api-exempt: 3 key(s) [COMPLIANCE.ADMIN_TENANT_SELF_POLICY, COMPLIANCE.ADMIN_TENANT_SELF_READINESS, COMPLIANCE.ADMIN_TENANT_SELF_SCORE] lack generated func

import React, { useState, useEffect } from 'react';
import { Tabs, Card, Checkbox, Button, Tag, Space, Modal, Form, Input, message, Progress, Row, Col, Statistic, Descriptions } from 'antd';
import {
	SafetyCertificateOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	WarningOutlined,
	SettingOutlined,
	EditOutlined,
	DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { handleApiError } from '@/lib/error-handler';
import { apiClient, API_PATHS, extractItem } from '@autional-cn/shared';
import {
	adminComplianceStandards,
	adminComplianceTenantsSelfOverrides,
	adminComplianceTenantsSelfStandardsPut,
	adminComplianceTenantsSelfGapAnalysisPost,
	adminComplianceTenantsSelfOverridesByOverridesDelete,
} from '@autional-cn/shared/generated/api';
import { PageError, DataTable } from '@autional-cn/ui/antd';

interface StandardItem {
	id: string;
	name: string;
	version: string;
	category: string;
	description: string;
}

interface ControlItem {
	id: string;
	requirement: string;
	name: string;
	description: string;
	parameter: string;
	operator: string;
	value: any;
	severity: string;
	tags: string[];
}

interface ResolvedParam {
	value: any;
	source: string[];
	merge_rule: string;
	overridden: boolean;
	override_value?: any;
	severity: string;
}

interface GapItem {
	parameter: string;
	required: any;
	current: any;
	operator: string;
	compliant: boolean;
	severity: string;
	standard?: string;
	control_ref?: string;
	description?: string;
}

interface OverrideItem {
	parameter: string;
	value: any;
	reason: string;
	created_by: string;
	created_at: string;
}

interface ReadinessItem {
	standard_id: string;
	standard_name: string;
	total_controls: number;
	passed_controls: number;
	compliance_rate: number;
	ready_for_audit: boolean;
	recommendations: string[];
}

export default function CompliancePolicyPage() {
	const { t } = useTranslation();

	const severityColor: Record<string, string> = {
		critical: 'red',
		high: 'orange',
		medium: 'gold',
		low: 'blue',
	};

	const severityLabel: Record<string, string> = {
		critical: t('compliance.policy.critical'),
		high: t('compliance.policy.high'),
		medium: t('compliance.policy.medium'),
		low: t('compliance.policy.low'),
	};

	const categoryLabel: Record<string, string> = {
		financial: t('compliance.policy.financial'),
		government: t('compliance.policy.government'),
		privacy: t('compliance.policy.privacy'),
		security: t('compliance.policy.security'),
		healthcare: t('compliance.policy.healthcare'),
	};

	const [activeTab, setActiveTab] = useState('standards');
	const [standards, setStandards] = useState<StandardItem[]>([]);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [resolvedPolicy, setResolvedPolicy] = useState<Record<string, ResolvedParam>>({});
	const [gapItems, setGapItems] = useState<GapItem[]>([]);
	const [overrides, setOverrides] = useState<OverrideItem[]>([]);
	const [readiness, setReadiness] = useState<Record<string, ReadinessItem>>({});
	const [score, setScore] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [overrideModal, setOverrideModal] = useState(false);
	const [overrideForm] = Form.useForm();
	const [resolvedStandards, setResolvedStandards] = useState<string[]>([]);

	useEffect(() => {
		fetchStandards();
		fetchOverrides();
		fetchScore();
	}, []);

	const fetchStandards = async () => {
		try {
			setLoading(true);
			const res = await adminComplianceStandards();
			// 根因修复 (2026-08-13): generated 已解包，extractItem(res.data) → null → 标准列表空
			const items = extractItem<StandardItem[]>(res) || [];
			setStandards(items);

			const res2 = await apiClient.get(API_PATHS.COMPLIANCE.ADMIN_TENANT_SELF_POLICY);
			const policy = extractItem(res2.data);
			if (policy?.standards) {
				setSelectedIds(policy.standards);
				setResolvedPolicy(policy.parameters || {});
				setResolvedStandards(policy.standards);
			}
		} catch (err) {
			setError(t('compliance.policy.loadFailed'));
		} finally {
			setLoading(false);
		}
	};

	const fetchOverrides = async () => {
		try {
			const res = await adminComplianceTenantsSelfOverrides();
			setOverrides(extractItem(res)?.overrides || []);
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to load compliance policy data', err);
			}
		}
	};

	const fetchScore = async () => {
		try {
			const res = await apiClient.get(API_PATHS.COMPLIANCE.ADMIN_TENANT_SELF_SCORE);
			setScore(extractItem(res.data)?.overallScore ?? null);
		} catch (err) {
			if (import.meta.env.DEV) {
				console.error('Failed to load compliance policy data', err);
			}
		}
	};

	const handleApply = async () => {
		try {
			setLoading(true);
			await adminComplianceTenantsSelfStandardsPut({ standards: selectedIds });
			const res = await apiClient.get(API_PATHS.COMPLIANCE.ADMIN_TENANT_SELF_POLICY);
			const policy = extractItem(res.data);
			setResolvedPolicy(policy?.parameters || {});
			setResolvedStandards(policy?.standards || []);
			message.success(t('compliance.policy.standardsUpdated'));
			fetchOverrides();
			fetchScore();
		} catch (err) {
			handleApiError(err, t('compliance.policy.updateFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleRunGapAnalysis = async () => {
		try {
			setLoading(true);
			const res = await adminComplianceTenantsSelfGapAnalysisPost();
			setGapItems(extractItem(res)?.parameters || []);
			setActiveTab('gaps');
		} catch (err) {
			handleApiError(err, t('compliance.policy.gapAnalysisFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleGetReadiness = async (stdId: string) => {
		try {
			setLoading(true);
			const res = await apiClient.post(API_PATHS.COMPLIANCE.ADMIN_TENANT_SELF_READINESS(stdId), {});
			setReadiness((prev) => ({
				...prev,
				[stdId]: extractItem<ReadinessItem>(res.data) ?? ({} as ReadinessItem),
			}));
		} catch (err) {
			handleApiError(err, t('compliance.policy.getReportFailed'));
		} finally {
			setLoading(false);
		}
	};

	const handleAddOverride = async (values: any) => {
		try {
			await apiClient.post(API_PATHS.COMPLIANCE.ADMIN_TENANT_SELF_OVERRIDES, {
				parameter: values.parameter,
				value: values.value,
				reason: values.reason || '',
			});
			message.success(t('compliance.policy.overrideSet'));
			setOverrideModal(false);
			overrideForm.resetFields();
			fetchOverrides();
		} catch (err) {
			handleApiError(err, t('compliance.policy.overrideFailed'));
		}
	};

	const handleRemoveOverride = async (param: string) => {
		try {
			await adminComplianceTenantsSelfOverridesByOverridesDelete(param);
			message.success(t('compliance.policy.overrideRemoved'));
			fetchOverrides();
		} catch (err) {
			handleApiError(err, t('compliance.policy.removeFailed'));
		}
	};

	if (error) {
		return <PageError message={t('compliance.policy.loadFailed')} retry={fetchStandards} />;
	}

	const filteredStandards = standards;

	const tabs = [
		{
			key: 'standards',
			label: t('compliance.policy.standards'),
			children: (
				<div>
					<Card title={t('compliance.policy.standards')} className="mb-4">
						<Checkbox.Group
							value={selectedIds}
							onChange={(v) => setSelectedIds(v as string[])}
							className="w-full"
						>
							<Space direction="vertical" size="middle" className="w-full">
								{filteredStandards.map((std) => (
									<Card key={std.id} size="small" hoverable>
										<Checkbox value={std.id}>
											<strong>{std.name}</strong>
											<Tag className="ml-2">{categoryLabel[std.category] || std.category}</Tag>
											<Tag color="blue">{std.version}</Tag>
										</Checkbox>
										<div className="mt-1 text-gray-500 text-xs">{std.description}</div>
									</Card>
								))}
							</Space>
						</Checkbox.Group>
					</Card>
					<Space>
						<Button
							type="primary"
							icon={<SafetyCertificateOutlined />}
							onClick={handleApply}
							loading={loading}
						>
							{t('compliance.policy.apply')}
						</Button>
						<Button onClick={handleRunGapAnalysis} loading={loading}>
							{t('compliance.policy.runGap')}
						</Button>
					</Space>
				</div>
			),
		},
		{
			key: 'policy',
			label: `${t('compliance.policy.policyTab')}${resolvedStandards.length ? ` (${resolvedStandards.length})` : ''}`,
			children: (
				<div>
					<Card title={t('compliance.policy.matrix')} className="mb-4">
						{resolvedStandards.length > 0 && (
							<Space wrap className="mb-3">
								{resolvedStandards.map((sid) => (
									<Tag key={sid} color="blue">
										{standards.find((s) => s.id === sid)?.name || sid}
									</Tag>
								))}
							</Space>
						)}
						<DataTable
							rowKey="parameter"
							dataSource={Object.entries(resolvedPolicy).map(([k, v]) => ({
								parameter: k,
								...v,
								key: k,
							}))}
							columns={[
								{ title: t('compliance.policy.parameter'), dataIndex: 'parameter', width: 200 },
								{
									title: t('compliance.policy.requiredValue'),
									dataIndex: 'value',
									render: (v: any) => String(v),
								},
								{ title: t('compliance.policy.mergeRule'), dataIndex: 'merge_rule', width: 100 },
								{
									title: t('compliance.policy.sourceStandards'),
									dataIndex: 'source',
									render: (s: string[]) => s.join(', '),
								},
								{
									title: t('compliance.policy.severity'),
									dataIndex: 'severity',
									render: (s: string) => <Tag color={severityColor[s]}>{severityLabel[s]}</Tag>,
								},
								{
									title: t('compliance.policy.overridden'),
									dataIndex: 'overridden',
									render: (v: boolean) =>
										v ? (
											<Tag color="green">{t('compliance.policy.yes')}</Tag>
										) : (
											<Tag>{t('compliance.policy.no')}</Tag>
										),
								},
							]}
							pagination={{ pageSize: 20 }}
							size="small"
							scroll={{ x: 800 }}
						/>
					</Card>
				</div>
			),
		},
		{
			key: 'gaps',
			label: `${t('compliance.policy.gapsTitle')}${gapItems.length ? ` (${t('compliance.policy.nonCompliantCount', { count: gapItems.filter((g) => !g.compliant).length })})` : ''}`,
			children: (
				<div>
					{gapItems.length === 0 ? (
						<Card>
							<div className="text-center p-10">
								<p>{t('compliance.policy.runGapHint')}</p>
								<Button type="primary" onClick={handleRunGapAnalysis}>
									{t('compliance.policy.runGap')}
								</Button>
							</div>
						</Card>
					) : (
						<Card
							title={
								<Space>
									<span>{t('compliance.policy.gaps')}</span>
									{score != null && (
										<Progress
											type="circle"
											percent={Math.round(score)}
											size={40}
											status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'}
										/>
									)}
								</Space>
							}
						>
							<DataTable
								rowKey="parameter"
								dataSource={gapItems}
								columns={[
									{ title: t('compliance.policy.parameter'), dataIndex: 'parameter', width: 200 },
									{
										title: t('compliance.policy.requiredValue'),
										dataIndex: 'required',
										render: (v: any) => String(v),
									},
									{
										title: t('compliance.policy.currentValue'),
										dataIndex: 'current',
										render: (v: any) => (v != null ? String(v) : '\u2014'),
									},
									{ title: t('compliance.policy.operator'), dataIndex: 'operator', width: 70 },
									{
										title: t('common.status'),
										dataIndex: 'compliant',
										width: 80,
										render: (v: boolean) =>
											v ? (
												<Tag color="green" icon={<CheckCircleOutlined />}>
													{t('compliance.gap.compliant')}
												</Tag>
											) : (
												<Tag color="red" icon={<CloseCircleOutlined />}>
													{t('compliance.gap.nonCompliant')}
												</Tag>
											),
									},
									{
										title: t('compliance.policy.severity'),
										dataIndex: 'severity',
										width: 80,
										render: (s: string) => <Tag color={severityColor[s]}>{severityLabel[s]}</Tag>,
									},
									{
										title: t('compliance.policy.standardSource'),
										dataIndex: 'standard',
										width: 120,
									},
									{
										title: t('compliance.policy.explanation'),
										dataIndex: 'description',
										ellipsis: true,
									},
								]}
								pagination={{ pageSize: 20 }}
								size="small"
								scroll={{ x: 800 }}
							/>
						</Card>
					)}
				</div>
			),
		},
		{
			key: 'overrides',
			label: `${t('compliance.policy.overridesTitle')}${overrides.length ? ` (${overrides.length})` : ''}`,
			children: (
				<div>
					<Card
						title={t('compliance.policy.overrides')}
						extra={
							<Button type="primary" icon={<EditOutlined />} onClick={() => setOverrideModal(true)}>
								{t('compliance.policy.addOverride')}
							</Button>
						}
					>
						<DataTable
							rowKey="parameter"
							dataSource={overrides}
							columns={[
								{ title: t('compliance.policy.parameter'), dataIndex: 'parameter', width: 220 },
								{
									title: t('compliance.policy.overrideValue'),
									dataIndex: 'value',
									render: (v: any) => <Tag color="green">{String(v)}</Tag>,
								},
								{ title: t('compliance.policy.reason'), dataIndex: 'reason' },
								{ title: t('compliance.policy.setTime'), dataIndex: 'created_at', width: 180 },
								{
									title: t('common.actions'),
									width: 80,
									render: (_: any, record: OverrideItem) => (
										<Button
											type="link"
											danger
											icon={<DeleteOutlined />}
											onClick={() => handleRemoveOverride(record.parameter)}
										>
											{t('compliance.policy.remove')}
										</Button>
									),
								},
							]}
							pagination={{ pageSize: 20 }}
							size="small"
							scroll={{ x: 800 }}
						/>
					</Card>
					<Modal
						title={t('compliance.policy.overrideTitle')}
						open={overrideModal}
						onCancel={() => {
							setOverrideModal(false);
							overrideForm.resetFields();
						}}
						onOk={() => overrideForm.submit()}
						className="w-full max-w-[560px]"
					>
						<Form form={overrideForm} layout="vertical" onFinish={handleAddOverride}>
							<Form.Item
								name="parameter"
								label={t('compliance.policy.paramName')}
								rules={[{ required: true }]}
							>
								<Input placeholder="password_min_length_sfa" />
							</Form.Item>
							<Form.Item
								name="value"
								label={t('compliance.policy.overrideValueLabel')}
								rules={[{ required: true }]}
							>
								<Input placeholder={t('compliance.policy.overridePlaceholder')} />
							</Form.Item>
							<Form.Item name="reason" label={t('compliance.policy.reason')}>
								<Input.TextArea placeholder={t('compliance.policy.reasonPlaceholder')} rows={2} />
							</Form.Item>
						</Form>
					</Modal>
				</div>
			),
		},
		{
			key: 'readiness',
			label: t('compliance.policy.readiness'),
			children: (
				<div>
					{resolvedStandards.length === 0 ? (
						<Card>
							<div className="text-center p-10">{t('compliance.policy.noStandards')}</div>
						</Card>
					) : (
						<Space direction="vertical" size="middle" className="w-full">
							{resolvedStandards.map((sid) => {
								const r = readiness[sid];
								return (
									<Card
										key={sid}
										title={standards.find((s) => s.id === sid)?.name || sid}
										extra={
											<Button
												size="small"
												onClick={() => handleGetReadiness(sid)}
												loading={loading}
											>
												{t('compliance.policy.checkReadiness')}
											</Button>
										}
									>
										{r ? (
											<div>
												<Row gutter={16}>
													<Col span={6}>
														<Statistic
															title={t('compliance.policy.readinessRate')}
															value={Math.round(r.compliance_rate)}
															suffix="%"
														/>
													</Col>
													<Col span={6}>
														<Statistic
															title={t('compliance.policy.passed')}
															value={r.passed_controls}
															suffix={`/ ${r.total_controls}`}
														/>
													</Col>
													<Col span={6}>
														<Statistic
															title={t('compliance.policy.auditable')}
															value={
																r.ready_for_audit
																	? t('compliance.policy.yes')
																	: t('compliance.policy.no')
															}
														/>
													</Col>
													<Col span={6}>
														<Progress
															type="circle"
															percent={Math.round(r.compliance_rate)}
															size={60}
															status={r.ready_for_audit ? 'success' : 'normal'}
														/>
													</Col>
												</Row>
												{r.recommendations.length > 0 && (
													<div className="mt-3">
														<Descriptions
															title={t('compliance.policy.recommendations')}
															column={1}
															size="small"
														>
															{r.recommendations.map((rec, i) => (
																<Descriptions.Item key={i} label={`#${i + 1}`}>
																	{rec}
																</Descriptions.Item>
															))}
														</Descriptions>
													</div>
												)}
											</div>
										) : (
											<div className="text-gray-400 p-5 text-center">
												{t('compliance.policy.checkReadinessHint')}
											</div>
										)}
									</Card>
								);
							})}
						</Space>
					)}
				</div>
			),
		},
	];

	return (
		<div>
			<h2 className="mb-4">
				<SafetyCertificateOutlined className="mr-2" />
				{t('compliance.policy.title')}
			</h2>
			<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />
		</div>
	);
}
