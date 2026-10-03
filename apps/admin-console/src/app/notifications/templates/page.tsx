'use client';

import React, { useState } from 'react';
import { Button, Space, Tag, Modal, Form, Input, Select, Tabs, Tooltip, Popconfirm } from 'antd';
import { message } from '@/lib/antd-app';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SendOutlined,
	CodeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
	useNotificationTemplates,
	useCreateNotificationTemplate,
	useUpdateNotificationTemplate,
	useDeleteNotificationTemplate,
	useTestNotification,
} from '@/hooks/use-notifications';
import { handleApiError } from '@/lib/error-handler';
import { PageError, DataTable } from '@autional-cn/ui/antd';
import { createNotificationTemplateSchema } from '@/lib/validators';

const { Option } = Select;
const { TextArea } = Input;

interface TemplateRecord {
	id: string;
	name: string;
	channel: 'inapp' | 'email' | 'sms' | 'push';
	status: 'active' | 'inactive';
	updatedAt: string;
	contentZh?: string;
	contentEn?: string;
}

const CHANNEL_COLORS: Record<string, string> = {
	inapp: 'blue',
	email: 'green',
	sms: 'orange',
	push: 'purple',
};

const VARIABLES = ['{{username}}', '{{tenant_name}}', '{{reset_url}}', '{{code}}', '{{time}}'];

export default function NotificationTemplatesPage() {
	const { t } = useTranslation();
	const [modalVisible, setModalVisible] = useState(false);
	const [testModalVisible, setTestModalVisible] = useState(false);
	const [editing, setEditing] = useState<TemplateRecord | null>(null);
	const [form] = Form.useForm();
	const [testForm] = Form.useForm();
	const [activeLang, setActiveLang] = useState('zh-CN');

	const { data = [], isLoading, error, refetch } = useNotificationTemplates();
	const createMut = useCreateNotificationTemplate();
	const updateMut = useUpdateNotificationTemplate();
	const deleteMut = useDeleteNotificationTemplate();
	const testMut = useTestNotification();

	const channelLabels: Record<string, string> = {
		inapp: t('notifications.templates.channel.inapp'),
		email: t('notifications.templates.channel.email'),
		sms: t('notifications.templates.channel.sms'),
		push: t('notifications.templates.channel.push'),
	};

	const handleSave = async (values: any) => {
		const result = createNotificationTemplateSchema.safeParse(values);
		if (!result.success) {
			result.error.issues.forEach((i) => message.error(i.message));
			return;
		}
		try {
			const payload = {
				name: values.name,
				channel: values.channel,
				status: values.status || 'active',
				contentZh: values.contentZh,
				contentEn: values.contentEn,
			};
			if (editing) {
				await updateMut.mutateAsync({ id: editing.id, data: payload });
				message.success(t('notifications.templates.updateSuccess'));
			} else {
				await createMut.mutateAsync(payload);
				message.success(t('notifications.templates.createSuccess'));
			}
			setModalVisible(false);
			setEditing(null);
			form.resetFields();
		} catch (err) {
			handleApiError(err, t('notifications.templates.saveFailed'));
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteMut.mutateAsync(id);
			message.success(t('notifications.templates.deleteSuccess'));
		} catch (err) {
			handleApiError(err, t('notifications.templates.deleteFailed'));
		}
	};

	const insertVariable = (variable: string) => {
		const fieldName = activeLang === 'zh-CN' ? 'contentZh' : 'contentEn';
		const current = form.getFieldValue(fieldName) || '';
		form.setFieldValue(fieldName, current + variable);
	};

	const handleTestSend = async (values: any) => {
		try {
			await testMut.mutateAsync({
				templateId: editing?.id,
				target: values.target,
				channel: editing?.channel,
			});
			message.success(t('notifications.templates.testSubmitSuccess'));
			setTestModalVisible(false);
			testForm.resetFields();
		} catch (err) {
			handleApiError(err, t('notifications.templates.testSubmitFailed'));
		}
	};

	const columns = [
		{ title: t('notifications.templates.templateName'), dataIndex: 'name', key: 'name' },
		{
			title: t('notifications.templates.channelType'),
			dataIndex: 'channel',
			key: 'channel',
			render: (channel: string) => (
				<Tag color={CHANNEL_COLORS[channel] || 'default'}>{channelLabels[channel] || channel}</Tag>
			),
		},
		{
			title: t('common.status'),
			dataIndex: 'status',
			key: 'status',
			render: (status: string) => (
				<Tag color={status === 'active' ? 'success' : 'default'}>
					{status === 'active'
						? t('notifications.templates.enabled')
						: t('notifications.templates.disabled')}
				</Tag>
			),
		},
		{
			title: t('notifications.templates.lastUpdatedTime'),
			dataIndex: 'updatedAt',
			key: 'updatedAt',
		},
		{
			title: t('common.actions'),
			key: 'action',
			render: (_: any, record: TemplateRecord) => (
				<Space size="small">
					<Button
						type="text"
						size="small"
						icon={<EditOutlined />}
						onClick={() => {
							setEditing(record);
							form.setFieldsValue({
								name: record.name,
								channel: record.channel,
								status: record.status,
								contentZh: record.contentZh || '',
								contentEn: record.contentEn || '',
							});
							setModalVisible(true);
						}}
					>
						{t('common.edit')}
					</Button>
					<Button
						type="text"
						size="small"
						icon={<SendOutlined />}
						onClick={() => {
							setEditing(record);
							setTestModalVisible(true);
						}}
					>
						{t('notifications.templates.test')}
					</Button>
					<Popconfirm
						title={t('notifications.templates.confirmDelete')}
						onConfirm={() => handleDelete(record.id)}
					>
						<Button type="text" danger size="small" icon={<DeleteOutlined />}>
							{t('common.delete')}
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div>
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
				<h1 className="text-xl font-semibold">{t('notifications.templates.title')}</h1>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => {
						setEditing(null);
						form.resetFields();
						setModalVisible(true);
					}}
				>
					{t('notifications.templates.createTemplate')}
				</Button>
			</div>

			{error && (
				<PageError
					message={t('notifications.templates.loadError')}
					retry={refetch}
					className="mb-4"
				/>
			)}
			<DataTable
				rowKey="id"
				columns={columns}
				dataSource={data}
				loading={isLoading}
				pagination={{ pageSize: 10 }}
				scroll={{ x: 800 }}
			/>

			<Modal
				title={
					editing
						? t('notifications.templates.editTemplate')
						: t('notifications.templates.createTemplate')
				}
				open={modalVisible}
				onCancel={() => {
					setModalVisible(false);
					setEditing(null);
					form.resetFields();
				}}
				onOk={() => form.submit()}
				width={720}
				className="w-full max-w-[720px]"
				destroyOnHidden
			>
				<Form form={form} layout="vertical" onFinish={handleSave}>
					<Form.Item
						name="name"
						label={t('notifications.templates.templateName')}
						rules={[{ required: true }]}
					>
						<Input placeholder={t('notifications.templates.namePlaceholder')} />
					</Form.Item>
					<Form.Item
						name="channel"
						label={t('notifications.templates.channelType')}
						rules={[{ required: true }]}
						initialValue="email"
					>
						<Select placeholder={t('notifications.templates.selectChannel')}>
							<Option value="inapp">{t('notifications.templates.channel.inapp')}</Option>
							<Option value="email">{t('notifications.templates.channel.email')}</Option>
							<Option value="sms">{t('notifications.templates.channel.sms')}</Option>
							<Option value="push">{t('notifications.templates.channel.push')}</Option>
						</Select>
					</Form.Item>
					<Form.Item name="status" label={t('common.status')} initialValue="active">
						<Select>
							<Option value="active">{t('notifications.templates.enabled')}</Option>
							<Option value="inactive">{t('notifications.templates.disabled')}</Option>
						</Select>
					</Form.Item>

					<div className="mb-2">
						<span className="text-sm text-gray-500 mr-2">
							{t('notifications.templates.insertVariable')}:
						</span>
						<Space size="small" wrap>
							{VARIABLES.map((v) => (
								<Tooltip
									title={t('notifications.templates.insertVariableTip').replace('{}', v)}
									key={v}
								>
									<Button size="small" icon={<CodeOutlined />} onClick={() => insertVariable(v)}>
										{v}
									</Button>
								</Tooltip>
							))}
						</Space>
					</div>

					<Tabs
						activeKey={activeLang}
						onChange={setActiveLang}
						items={[
							{
								key: 'zh-CN',
								label: t('notifications.templates.langZhCN'),
								children: (
									<Form.Item
										name="contentZh"
										label={t('notifications.templates.contentHtml')}
										rules={[{ required: true }]}
									>
										<TextArea rows={8} placeholder={t('notifications.templates.supportHtml')} />
									</Form.Item>
								),
							},
							{
								key: 'en-US',
								label: t('notifications.templates.langEnUS'),
								children: (
									<Form.Item name="contentEn" label={t('notifications.templates.contentHtml')}>
										<TextArea rows={8} placeholder={t('notifications.templates.supportHtml')} />
									</Form.Item>
								),
							},
						]}
					/>
				</Form>
			</Modal>

			<Modal
				title={t('notifications.templates.testSend')}
				open={testModalVisible}
				onCancel={() => {
					setTestModalVisible(false);
					testForm.resetFields();
				}}
				onOk={() => testForm.submit()}
				destroyOnHidden
				className="w-full max-w-[560px]"
			>
				<Form form={testForm} layout="vertical" onFinish={handleTestSend}>
					<Form.Item
						name="target"
						label={
							editing?.channel === 'sms'
								? t('notifications.templates.testPhone')
								: t('notifications.templates.testEmailOrUserId')
						}
						rules={[{ required: true }]}
					>
						<Input placeholder={editing?.channel === 'sms' ? '13800138000' : 'test@example.com'} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
