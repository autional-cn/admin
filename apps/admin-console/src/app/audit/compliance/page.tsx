'use client';

import { useState, useEffect, useCallback } from 'react';
import {
	Tabs,
	Table,
	Button,
	Modal,
	Form,
	Input,
	Select,
	Space,
	Tag,
	Popconfirm,
	InputNumber,
	Switch,
} from 'antd';
import { message } from '@/lib/antd-app';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageHeader, SectionCard, LoadingScreen, EmptyState } from '@autional-cn/ui';
import { apiClient, API_PATHS } from '@autional-cn/shared';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const SEVERITY_OPTIONS = [
	{ label: 'Low', value: 'low' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'High', value: 'high' },
	{ label: 'Critical', value: 'critical' },
];

const SEVERITY_COLORS: Record<string, string> = {
	low: 'blue',
	medium: 'orange',
	high: 'red',
	critical: 'magenta',
};

const STATUS_COLORS: Record<string, string> = {
	draft: 'default',
	review: 'processing',
	approved: 'success',
	rejected: 'error',
	detected: 'processing',
	investigating: 'warning',
	contained: 'blue',
	resolved: 'success',
	notified: 'green',
	pending: 'processing',
	processing: 'blue',
	completed: 'success',
	failed: 'error',
	active: 'success',
	revoked: 'default',
	expired: 'warning',
	reviewed: 'cyan',
	none: 'default',
	required: 'orange',
};

/* -------------------------------------------------------------------------- */
/*  Shared utilities                                                          */
/* -------------------------------------------------------------------------- */

interface TabConfig {
	key: string;
	label: string;
	apiPath: string;
	columns: any[];
	formFields: (t: TFunction, editing: boolean) => React.ReactNode;
	readOnly?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Sub-component: CrudTab                                                    */
/* -------------------------------------------------------------------------- */

function CrudTab({
	apiPath,
	columns,
	formFields,
	readOnly,
}: {
	apiPath: string;
	columns: any[];
	formFields: (editing: boolean) => React.ReactNode;
	readOnly?: boolean;
}) {
	const { t } = useTranslation();
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<any>(null);
	const [saving, setSaving] = useState(false);
	const [form] = Form.useForm();

	const fetchData = useCallback(() => {
		setLoading(true);
		// @generated-api-exempt: apiPath is a prop from generic CrudTab component.
		// This component accepts arbitrary API paths for CRUD operations, making it
		// impossible to use static generated functions without a redesign.
		apiClient
			.get(apiPath)
			.then((res: any) => {
				// apiClient 已自动 unwrap data，res.data 即业务数组/分页对象
				const payload = res.data;
				setData(Array.isArray(payload) ? payload : payload?.items || []);
			})
			.catch(() => message.error(t('compliance.audit.loadError')))
			.finally(() => setLoading(false));
	}, [apiPath]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleSave = async (values: any) => {
		setSaving(true);
		try {
			if (editing) {
				await apiClient.put(`${apiPath}/${editing.id}`, values); // @generated-api-exempt
				message.success(t('compliance.audit.updated'));
			} else {
				await apiClient.post(apiPath, values);
				message.success(t('compliance.audit.created'));
			}
			setModalOpen(false);
			setEditing(null);
			form.resetFields();
			fetchData();
		} catch (err: any) {
			message.error(err?.message || t('compliance.audit.saveFailed'));
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await apiClient.delete(`${apiPath}/${id}`); // @generated-api-exempt
			message.success(t('compliance.audit.deleted'));
			fetchData();
		} catch (err: any) {
			message.error(err?.message || t('compliance.audit.deleteFailed'));
		}
	};

	if (loading) return <LoadingScreen />;

	const actionCol = {
		title: t('common.actions'),
		key: 'actions',
		width: 160,
		render: (_: any, r: any) => (
			<Space>
				<Button
					size="small"
					onClick={() => {
						setEditing(r);
						form.setFieldsValue(r);
						setModalOpen(true);
					}}
				>
					{t('common.edit')}
				</Button>
				<Popconfirm title={t('compliance.audit.deleteConfirm')} onConfirm={() => handleDelete(r.id || r._id)}>
					<Button size="small" danger icon={<DeleteOutlined />}>
						{t('common.delete')}
					</Button>
				</Popconfirm>
			</Space>
		),
	};

	const displayCols = readOnly ? columns : [...columns, actionCol];

	return (
		<div>
			{!readOnly && (
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => {
						setEditing(null);
						form.resetFields();
						setModalOpen(true);
					}}
					className="mb-4"
				>
					{t('common.create')}
				</Button>
			)}
			<Button icon={<ReloadOutlined />} onClick={fetchData} className="mb-4 ml-2">
				{t('common.refresh')}
			</Button>
			<Table
				columns={displayCols}
				dataSource={data}
				rowKey={(r: any) => r.id || r._id}
				locale={{ emptyText: <EmptyState title={t('common.noData')} /> }}
				scroll={{ x: 800 }}
			/>
			<Modal
				title={editing ? t('common.edit') : t('common.create')}
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					setEditing(null);
					form.resetFields();
				}}
				onOk={() => form.submit()}
				confirmLoading={saving}
				width={640}
				className="w-full max-w-[640px]"
			>
				<Form form={form} layout="vertical" onFinish={handleSave}>
					{formFields(!!editing)}
				</Form>
			</Modal>
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/*  Form field definitions per tab                                            */
/* -------------------------------------------------------------------------- */

const piaFormFields = (t: TFunction, _editing: boolean) => (
	<>
		<Form.Item name="title" label={t('compliance.audit.field.title')} rules={[{ required: true }]}>
			<Input placeholder={t('compliance.audit.placeholder.title')} />
		</Form.Item>
		<Form.Item name="description" label={t('compliance.audit.field.description')}>
			<Input.TextArea rows={3} placeholder={t('compliance.audit.placeholder.description')} />
		</Form.Item>
		<Form.Item name="dataScope" label={t('compliance.audit.field.dataScope')}>
			<Input.TextArea rows={2} placeholder={t('compliance.audit.placeholder.dataScope')} />
		</Form.Item>
		<Form.Item name="risks" label={t('compliance.audit.field.risks')}>
			<Input.TextArea rows={2} placeholder={t('compliance.audit.placeholder.risks')} />
		</Form.Item>
		<Form.Item name="mitigation" label={t('compliance.audit.field.mitigation')}>
			<Input.TextArea rows={2} placeholder={t('compliance.audit.placeholder.mitigation')} />
		</Form.Item>
		<Form.Item name="status" label={t('common.status')} initialValue="draft">
			<Select
				options={[
					{ label: t('compliance.audit.status.draft'), value: 'draft' },
					{ label: t('compliance.audit.status.review'), value: 'review' },
					{ label: t('compliance.audit.status.approved'), value: 'approved' },
					{ label: t('compliance.audit.status.rejected'), value: 'rejected' },
				]}
			/>
		</Form.Item>
	</>
);

const breachesFormFields = (t: TFunction, _editing: boolean) => (
	<>
		<Form.Item name="title" label={t('compliance.audit.field.title')} rules={[{ required: true }]}>
			<Input placeholder={t('compliance.audit.placeholder.title')} />
		</Form.Item>
		<Form.Item name="description" label={t('compliance.audit.field.description')}>
			<Input.TextArea rows={3} placeholder={t('compliance.audit.placeholder.breachDescription')} />
		</Form.Item>
		<Form.Item name="severity" label={t('compliance.audit.field.severity')} initialValue="medium">
			<Select options={SEVERITY_OPTIONS.map((o) => ({ ...o, label: t(`compliance.audit.severity.${o.value}`) }))} />
		</Form.Item>
		<Form.Item name="affectedData" label={t('compliance.audit.field.affectedData')}>
			<Input.TextArea rows={2} placeholder={t('compliance.audit.placeholder.affectedData')} />
		</Form.Item>
		<Form.Item name="reportedTo" label={t('compliance.audit.field.reportedTo')}>
			<Input placeholder={t('compliance.audit.placeholder.reportedTo')} />
		</Form.Item>
		<Form.Item name="status" label={t('common.status')} initialValue="detected">
			<Select
				options={[
					{ label: t('compliance.audit.breachStatus.detected'), value: 'detected' },
					{ label: t('compliance.audit.breachStatus.investigating'), value: 'investigating' },
					{ label: t('compliance.audit.breachStatus.contained'), value: 'contained' },
					{ label: t('compliance.audit.breachStatus.resolved'), value: 'resolved' },
					{ label: t('compliance.audit.breachStatus.notified'), value: 'notified' },
				]}
			/>
		</Form.Item>
	</>
);

const dataClassFormFields = (t: TFunction, _editing: boolean) => (
	<>
		<Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}>
			<Input placeholder={t('compliance.audit.placeholder.dataClassName')} />
		</Form.Item>
		<Form.Item name="level" label={t('compliance.audit.field.classificationLevel')} initialValue="internal">
			<Select
				options={[
					{ label: t('compliance.audit.level.public'), value: 'public' },
					{ label: t('compliance.audit.level.internal'), value: 'internal' },
					{ label: t('compliance.audit.level.confidential'), value: 'confidential' },
					{ label: t('compliance.audit.level.restricted'), value: 'restricted' },
				]}
			/>
		</Form.Item>
		<Form.Item name="description" label={t('compliance.audit.field.description')}>
			<Input.TextArea rows={2} placeholder={t('compliance.audit.placeholder.description')} />
		</Form.Item>
		<Form.Item name="retentionPeriod" label={t('compliance.audit.field.retentionPeriod')}>
			<Input placeholder={t('compliance.audit.placeholder.retentionPeriod')} />
		</Form.Item>
		<Form.Item name="requiresConsent" label={t('compliance.audit.field.requiresConsent')} valuePropName="checked">
			<Switch />
		</Form.Item>
		<Form.Item name="status" label={t('common.status')} initialValue="active">
			<Select
				options={[
					{ label: t('compliance.audit.classStatus.active'), value: 'active' },
					{ label: t('compliance.audit.classStatus.archived'), value: 'archived' },
				]}
			/>
		</Form.Item>
	</>
);

const crossBorderFormFields = (t: TFunction, _editing: boolean) => (
	<>
		<Form.Item name="dataType" label={t('compliance.audit.field.dataType')} rules={[{ required: true }]}>
			<Input placeholder={t('compliance.audit.placeholder.dataType')} />
		</Form.Item>
		<Form.Item name="originCountry" label={t('compliance.audit.field.originCountry')}>
			<Input placeholder={t('compliance.audit.placeholder.originCountry')} />
		</Form.Item>
		<Form.Item name="destinationCountries" label={t('compliance.audit.field.destinationCountries')}>
			<Input placeholder={t('compliance.audit.placeholder.destinationCountries')} />
		</Form.Item>
		<Form.Item name="legalBasis" label={t('compliance.audit.field.legalBasis')}>
			<Input placeholder={t('compliance.audit.placeholder.legalBasis')} />
		</Form.Item>
		<Form.Item name="safeguards" label={t('compliance.audit.field.safeguards')}>
			<Input.TextArea rows={2} placeholder={t('compliance.audit.placeholder.safeguards')} />
		</Form.Item>
		<Form.Item name="status" label={t('common.status')} initialValue="pending">
			<Select
				options={[
					{ label: t('compliance.audit.crossStatus.pending'), value: 'pending' },
					{ label: t('compliance.audit.crossStatus.approved'), value: 'approved' },
					{ label: t('compliance.audit.crossStatus.rejected'), value: 'rejected' },
				]}
			/>
		</Form.Item>
	</>
);

const aiDecisionsFormFields = (t: TFunction, _editing: boolean) => (
	<>
		<Form.Item name="decisionType" label={t('compliance.audit.field.decisionType')} rules={[{ required: true }]}>
			<Input placeholder={t('compliance.audit.placeholder.decisionType')} />
		</Form.Item>
		<Form.Item name="modelName" label={t('compliance.audit.field.modelName')}>
			<Input placeholder={t('compliance.audit.placeholder.modelName')} />
		</Form.Item>
		<Form.Item name="inputData" label={t('compliance.audit.field.inputData')}>
			<Input.TextArea rows={2} placeholder={t('compliance.audit.placeholder.inputData')} />
		</Form.Item>
		<Form.Item name="outputResult" label={t('compliance.audit.field.outputResult')}>
			<Input.TextArea rows={2} placeholder={t('compliance.audit.placeholder.outputResult')} />
		</Form.Item>
		<Form.Item name="humanReview" label={t('compliance.audit.field.humanReview')} initialValue="none">
			<Select
				options={[
					{ label: t('compliance.audit.humanReview.none'), value: 'none' },
					{ label: t('compliance.audit.humanReview.required'), value: 'required' },
					{ label: t('compliance.audit.humanReview.completed'), value: 'completed' },
				]}
			/>
		</Form.Item>
		<Form.Item name="status" label={t('common.status')} initialValue="pending">
			<Select
				options={[
					{ label: t('compliance.audit.status.pending'), value: 'pending' },
					{ label: t('compliance.audit.status.reviewed'), value: 'reviewed' },
					{ label: t('compliance.audit.status.approved'), value: 'approved' },
					{ label: t('compliance.audit.status.rejected'), value: 'rejected' },
				]}
			/>
		</Form.Item>
	</>
);

const cleanupFormFields = (t: TFunction, _editing: boolean) => (
	<>
		<Form.Item name="recordType" label={t('compliance.audit.field.recordType')} rules={[{ required: true }]}>
			<Input placeholder={t('compliance.audit.placeholder.recordType')} />
		</Form.Item>
		<Form.Item name="targetId" label={t('compliance.audit.field.targetId')}>
			<Input placeholder={t('compliance.audit.placeholder.targetId')} />
		</Form.Item>
		<Form.Item name="reason" label={t('compliance.audit.field.reason')}>
			<Input.TextArea rows={2} placeholder={t('compliance.audit.placeholder.reason')} />
		</Form.Item>
		<Form.Item name="method" label={t('compliance.audit.field.method')}>
			<Input placeholder={t('compliance.audit.placeholder.method')} />
		</Form.Item>
		<Form.Item name="recordsDeleted" label={t('compliance.audit.field.recordsDeleted')}>
			<InputNumber min={0} className="w-full" />
		</Form.Item>
		<Form.Item name="status" label={t('common.status')} initialValue="pending">
			<Select
				options={[
					{ label: t('compliance.audit.cleanupStatus.pending'), value: 'pending' },
					{ label: t('compliance.audit.cleanupStatus.processing'), value: 'processing' },
					{ label: t('compliance.audit.cleanupStatus.completed'), value: 'completed' },
					{ label: t('compliance.audit.cleanupStatus.failed'), value: 'failed' },
				]}
			/>
		</Form.Item>
	</>
);

/* -------------------------------------------------------------------------- */
/*  Column definitions per tab                                                */
/* -------------------------------------------------------------------------- */

const tagRender = (colors: Record<string, string>) => (v: string) => (
	<Tag color={colors[v] || 'default'}>{v}</Tag>
);
const tsRender = (v: string | number) =>
	v ? new Date(typeof v === 'number' ? v * 1000 : v).toLocaleString() : '-';

const piaCols = [
	{ title: 'compliance.audit.column.title', dataIndex: 'title', key: 'title', ellipsis: true },
	{
		title: 'common.status',
		dataIndex: 'status',
		key: 'status',
		width: 100,
		render: tagRender(STATUS_COLORS),
	},
	{ title: 'compliance.audit.column.dataScope', dataIndex: 'dataScope', key: 'dataScope', ellipsis: true, width: 200 },
	{ title: 'common.createdAt', dataIndex: 'createdAt', key: 'createdAt', width: 170, render: tsRender },
];

const breachCols = [
	{ title: 'compliance.audit.column.title', dataIndex: 'title', key: 'title', ellipsis: true },
	{
		title: 'compliance.audit.column.severity',
		dataIndex: 'severity',
		key: 'severity',
		width: 90,
		render: tagRender(SEVERITY_COLORS),
	},
	{
		title: 'common.status',
		dataIndex: 'status',
		key: 'status',
		width: 110,
		render: tagRender(STATUS_COLORS),
	},
	{ title: 'compliance.audit.column.reportedTo', dataIndex: 'reportedTo', key: 'reportedTo', width: 160, ellipsis: true },
	{ title: 'common.createdAt', dataIndex: 'createdAt', key: 'createdAt', width: 170, render: tsRender },
];

const dataClassCols = [
	{ title: 'common.name', dataIndex: 'name', key: 'name', ellipsis: true },
	{
		title: 'compliance.audit.column.level',
		dataIndex: 'level',
		key: 'level',
		width: 120,
		render: tagRender(STATUS_COLORS),
	},
	{
		title: 'compliance.audit.column.consentRequired',
		dataIndex: 'requiresConsent',
		key: 'requiresConsent',
		width: 130,
		render: (v: boolean) => (v ? 'compliance.audit.yes' : 'compliance.audit.no'),
	},
	{ title: 'compliance.audit.column.retention', dataIndex: 'retentionPeriod', key: 'retentionPeriod', width: 140 },
	{
		title: 'common.status',
		dataIndex: 'status',
		key: 'status',
		width: 100,
		render: tagRender(STATUS_COLORS),
	},
	{ title: 'common.createdAt', dataIndex: 'createdAt', key: 'createdAt', width: 170, render: tsRender },
];

const crossBorderCols = [
	{ title: 'compliance.audit.column.dataType', dataIndex: 'dataType', key: 'dataType', ellipsis: true },
	{ title: 'compliance.audit.column.origin', dataIndex: 'originCountry', key: 'originCountry', width: 80 },
	{
		title: 'compliance.audit.column.destinations',
		dataIndex: 'destinationCountries',
		key: 'destinationCountries',
		width: 150,
		ellipsis: true,
	},
	{ title: 'compliance.audit.column.legalBasis', dataIndex: 'legalBasis', key: 'legalBasis', width: 170, ellipsis: true },
	{
		title: 'common.status',
		dataIndex: 'status',
		key: 'status',
		width: 100,
		render: tagRender(STATUS_COLORS),
	},
	{ title: 'common.createdAt', dataIndex: 'createdAt', key: 'createdAt', width: 170, render: tsRender },
];

const aiDecisionCols = [
	{ title: 'compliance.audit.column.decisionType', dataIndex: 'decisionType', key: 'decisionType', ellipsis: true },
	{ title: 'compliance.audit.column.model', dataIndex: 'modelName', key: 'modelName', width: 140 },
	{
		title: 'compliance.audit.column.humanReview',
		dataIndex: 'humanReview',
		key: 'humanReview',
		width: 120,
		render: tagRender(STATUS_COLORS),
	},
	{
		title: 'common.status',
		dataIndex: 'status',
		key: 'status',
		width: 100,
		render: tagRender(STATUS_COLORS),
	},
	{ title: 'common.createdAt', dataIndex: 'createdAt', key: 'createdAt', width: 170, render: tsRender },
];

const cleanupCols = [
	{ title: 'compliance.audit.column.recordType', dataIndex: 'recordType', key: 'recordType', ellipsis: true },
	{ title: 'compliance.audit.column.targetId', dataIndex: 'targetId', key: 'targetId', width: 180, ellipsis: true },
	{ title: 'compliance.audit.column.method', dataIndex: 'method', key: 'method', width: 130 },
	{ title: 'compliance.audit.column.deleted', dataIndex: 'recordsDeleted', key: 'recordsDeleted', width: 90 },
	{
		title: 'common.status',
		dataIndex: 'status',
		key: 'status',
		width: 110,
		render: tagRender(STATUS_COLORS),
	},
	{ title: 'common.createdAt', dataIndex: 'createdAt', key: 'createdAt', width: 170, render: tsRender },
];

const sodCols = [
	{ title: 'compliance.audit.column.ruleName', dataIndex: 'name', key: 'name' },
	{ title: 'compliance.audit.column.roleA', dataIndex: 'roleA', key: 'roleA', width: 160 },
	{ title: 'compliance.audit.column.roleB', dataIndex: 'roleB', key: 'roleB', width: 160 },
	{ title: 'common.description', dataIndex: 'description', key: 'description', ellipsis: true },
	{ title: 'common.createdAt', dataIndex: 'createdAt', key: 'createdAt', width: 170, render: tsRender },
];

const roleActionCols = [
	{ title: 'compliance.audit.column.role', dataIndex: 'role', key: 'role', width: 180 },
	{ title: 'compliance.audit.column.resource', dataIndex: 'resource', key: 'resource', width: 160 },
	{ title: 'compliance.audit.column.action', dataIndex: 'action', key: 'action', width: 120 },
	{
		title: 'compliance.audit.column.effect',
		dataIndex: 'effect',
		key: 'effect',
		width: 80,
		render: (v: string) => <Tag color={v === 'allow' ? 'green' : 'red'}>{v}</Tag>,
	},
	{ title: 'common.createdAt', dataIndex: 'createdAt', key: 'createdAt', width: 170, render: tsRender },
];

/* -------------------------------------------------------------------------- */
/*  Main page                                                                 */
/* -------------------------------------------------------------------------- */

const TABS: TabConfig[] = [
	{
		key: 'pias',
		label: 'compliance.audit.tabPias',
		apiPath: API_PATHS.AUDIT.ADMIN_COMPLIANCE_PIAS,
		columns: piaCols,
		formFields: piaFormFields,
	},
	{
		key: 'breaches',
		label: 'compliance.audit.tabBreaches',
		apiPath: API_PATHS.AUDIT.ADMIN_COMPLIANCE_BREACHES,
		columns: breachCols,
		formFields: breachesFormFields,
	},
	{
		key: 'data-class',
		label: 'compliance.audit.tabDataClass',
		apiPath: API_PATHS.AUDIT.ADMIN_COMPLIANCE_DATA_CLASS,
		columns: dataClassCols,
		formFields: dataClassFormFields,
	},
	{
		key: 'cross-border',
		label: 'compliance.audit.tabCrossBorder',
		apiPath: API_PATHS.AUDIT.ADMIN_COMPLIANCE_CROSS_BORDER,
		columns: crossBorderCols,
		formFields: crossBorderFormFields,
	},
	{
		key: 'ai-decisions',
		label: 'compliance.audit.tabAiDecisions',
		apiPath: API_PATHS.AUDIT.ADMIN_COMPLIANCE_AI_DECISIONS,
		columns: aiDecisionCols,
		formFields: aiDecisionsFormFields,
	},
	{
		key: 'cleanup',
		label: 'compliance.audit.tabCleanup',
		apiPath: API_PATHS.AUDIT.ADMIN_COMPLIANCE_CLEANUP,
		columns: cleanupCols,
		formFields: cleanupFormFields,
	},
	{
		key: 'sod-rules',
		label: 'compliance.audit.tabSodRules',
		apiPath: API_PATHS.AUDIT.ADMIN_COMPLIANCE_SOD_RULES,
		columns: sodCols,
		formFields: () => null,
		readOnly: true,
	},
	{
		key: 'role-actions',
		label: 'compliance.audit.tabRoleActions',
		apiPath: API_PATHS.AUDIT.ADMIN_COMPLIANCE_ROLE_ACTIONS,
		columns: roleActionCols,
		formFields: () => null,
		readOnly: true,
	},
];

export default function CompliancePage() {
	const { t } = useTranslation();
	const tabItems = TABS.map((tab) => {
		const cols = tab.columns.map((col: any) => ({
			...col,
			title: t(col.title),
			render: col.render
				? (v: any, r: any) => {
						const out = col.render(v, r);
						return typeof out === 'string' && out.startsWith('compliance.audit.') ? t(out) : out;
				  }
				: undefined,
		}));
		return {
			key: tab.key,
			label: t(tab.label),
			children: (
				<CrudTab
					key={tab.key}
					apiPath={tab.apiPath}
					columns={cols}
					formFields={(ed) => tab.formFields(t, ed)}
					readOnly={tab.readOnly}
				/>
			),
		};
	});
	return (
		<div>
			<PageHeader
				title={t('compliance.audit.title')}
				subtitle={t('compliance.audit.subtitle')}
			/>
			<SectionCard>
				<Tabs
					defaultActiveKey="pias"
					items={tabItems}
				/>
			</SectionCard>
		</div>
	);
}
