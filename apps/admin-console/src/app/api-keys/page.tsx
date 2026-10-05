'use client';

import React, { useState } from 'react';
import { Button, Space, Tag, Modal, Form, Input, Select, Popconfirm, Empty, Spin, Typography } from 'antd';
import { Copy, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { message } from '@/lib/antd-app';
import { useTranslation } from 'react-i18next';
import {
	useApiKeys,
	useCreateApiKey,
	useDeleteApiKey,
	useRotateApiKey,
	useUpdateApiKeyStatus,
} from '@/hooks/use-api-keys';
import type { ApiKeyRecord } from '@/hooks/use-api-keys';
import { handleApiError } from '@/lib/error-handler';
import { PageError, DataTable } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';

const { Option } = Select;

export default function ApiKeysPage() {
	const { t } = useTranslation();
	const [modalVisible, setModalVisible] = useState(false);
	// A-49（RC-B4-02）：一次性密钥展示框 —— wire 键 = rawKey（顶层，信封已由拦截器解包），仅返回一次。
	const [revealedKey, setRevealedKey] = useState<string | null>(null);
	const [form] = Form.useForm();

	const { data = [], isLoading, error, refetch } = useApiKeys();
	const createMut = useCreateApiKey();
	const deleteMut = useDeleteApiKey();
	const rotateMut = useRotateApiKey();
	const statusMut = useUpdateApiKeyStatus();

	const handleCopyKey = async () => {
		if (!revealedKey) return;
		try {
			await navigator.clipboard.writeText(revealedKey);
			message.success(t('apiKeys.copied'));
		} catch {
			message.error(t('apiKeys.copyFailed'));
		}
	};

	const handleCreate = async (values: any) => {
		try {
			const payload: Record<string, unknown> = {
				name: values.name,
				scopes: values.scopes || [],
				environment: values.environment,
			};
			if (values.expiresInDays) payload.expiresInDays = values.expiresInDays;
			const res = await createMut.mutateAsync(payload);
			// A-49：旧判键 `result?.data?.key || result?.key` 恒 false（wire 键 = rawKey）→ 凭据原文丢失。
			// rawKey 缺失时降级为原成功 toast（不崩、不伪造展示）。
			const rawKey = (res as { rawKey?: string } | undefined)?.rawKey;
			message.success(t('apiKeys.createSuccess'));
			if (typeof rawKey === 'string' && rawKey) setRevealedKey(rawKey);
			setModalVisible(false);
			form.resetFields();
		} catch (err) {
			handleApiError(err, t('apiKeys.createFailed'));
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteMut.mutateAsync(id);
			message.success(t('apiKeys.deleteSuccess'));
		} catch (err) {
			handleApiError(err, t('apiKeys.deleteFailed'));
		}
	};

	const handleRotate = async (id: string) => {
		try {
			const res = await rotateMut.mutateAsync(id);
			const rawKey = (res as { rawKey?: string } | undefined)?.rawKey;
			message.success(t('apiKeys.rotateSuccess'));
			if (typeof rawKey === 'string' && rawKey) setRevealedKey(rawKey);
		} catch (err) {
			handleApiError(err, t('apiKeys.rotateFailed'));
		}
	};

	const handleToggleStatus = async (record: ApiKeyRecord) => {
		const nextStatus = record.status === 'active' ? 'inactive' : 'active';
		try {
			await statusMut.mutateAsync({ id: record.id, status: nextStatus });
			message.success(nextStatus === 'active' ? t('apiKeys.resumed') : t('apiKeys.revoked'));
		} catch (err) {
			handleApiError(err, t('apiKeys.operationFailed'));
		}
	};

	const columns = [
		{ title: t('apiKeys.column.name'), dataIndex: 'name', key: 'name' },
		{
			title: t('apiKeys.column.keyPrefix'),
			dataIndex: 'keyPrefix',
			key: 'keyPrefix',
			render: (v: string) => (
				<code className="text-xs bg-neutral-200 px-1.5 py-0.5 rounded">{v}...</code>
			),
		},
		{
			title: t('apiKeys.column.scopes'),
			dataIndex: 'scopes',
			key: 'scopes',
			render: (scopes: string[]) => (
				<Space size={4} wrap>
					{(scopes || []).map((s) => (
						<Tag key={s} color="blue">
							{s}
						</Tag>
					))}
				</Space>
			),
		},
		{
			title: t('apiKeys.column.environment'),
			dataIndex: 'environment',
			key: 'environment',
			render: (v: string) => (v ? t(`apiKeys.environment.${v}`, { defaultValue: v }) : '-'),
		},
		{
			title: t('common.status'),
			dataIndex: 'status',
			key: 'status',
			render: (status: string) => (
				<Tag color={status === 'active' ? 'success' : 'default'}>
					{t(`apiKeys.status.${status}`, { defaultValue: status })}
				</Tag>
			),
		},
		{
			title: t('common.actions'),
			key: 'action',
			render: (_: any, record: ApiKeyRecord) => (
				<Space size="small">
					<Popconfirm title={t('apiKeys.confirmRotate')} onConfirm={() => handleRotate(record.id)}>
						<Button type="text" size="small" icon={<RefreshCw size="1em" />}>
							{t('apiKeys.rotate')}
						</Button>
					</Popconfirm>
					<Popconfirm title={t('apiKeys.confirmRevoke')} onConfirm={() => handleDelete(record.id)}>
						<Button type="text" size="small" danger icon={<Trash2 size="1em" />}>
							{t('apiKeys.revoke')}
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div>
			{error && <PageError message={t('apiKeys.loadError')} retry={refetch} className="mb-4" />}

			<ConsolePageHeader
				title={t('apiKeys.title')}
				actions={
					<>
						<Button
							type="primary"
							icon={<Plus size="1em" />}
							onClick={() => {
								setModalVisible(true);
								form.resetFields();
							}}
						>
							{t('apiKeys.createBtn')}
						</Button>
					</>
				}
			/>

			{isLoading ? (
				<Spin className="flex justify-center py-12" />
			) : data.length === 0 ? (
				<Empty description={t('apiKeys.noData')} />
			) : (
				<DataTable
					rowKey="id"
					columns={columns}
					dataSource={data}
					pagination={{ pageSize: 10 }}
					scroll={{ x: 800 }}
				/>
			)}

			<Modal
				title={t('apiKeys.createBtn')}
				open={modalVisible}
				onCancel={() => {
					setModalVisible(false);
					form.resetFields();
				}}
				onOk={() => form.submit()}
				destroyOnClose
			>
				<Form form={form} layout="vertical" onFinish={handleCreate}>
					<Form.Item name="name" label={t('apiKeys.form.name')} rules={[{ required: true }]}>
						<Input placeholder={t('apiKeys.form.namePlaceholder')} />
					</Form.Item>
					<Form.Item name="scopes" label={t('apiKeys.form.scopes')}>
						<Select mode="tags" placeholder={t('apiKeys.form.scopesPlaceholder')} />
					</Form.Item>
					<Form.Item
						name="environment"
						label={t('apiKeys.form.environment')}
						rules={[{ required: true, message: t('apiKeys.form.environmentRequired') }]}
					>
						<Select placeholder={t('apiKeys.form.environmentPlaceholder')}>
							<Option value="live">{t('apiKeys.environment.live')}</Option>
							<Option value="test">{t('apiKeys.environment.test', { defaultValue: 'Test' })}</Option>
						</Select>
					</Form.Item>
					<Form.Item name="expiresInDays" label={t('apiKeys.form.expiresInDays')}>
						<Input type="number" min={1} placeholder={t('apiKeys.form.expiresInDaysPlaceholder')} />
					</Form.Item>
				</Form>
			</Modal>

			{/* A-49：一次性凭据展示框（仅显示一次 + 复制）——不再用瞬态 toast 传递凭据。 */}
			<Modal
				title={t('apiKeys.newKeyTitle')}
				open={revealedKey !== null}
				onCancel={() => setRevealedKey(null)}
				footer={
					<Button type="primary" onClick={() => setRevealedKey(null)}>
						{t('common.confirm')}
					</Button>
				}
				destroyOnClose
			>
				<Typography.Paragraph type="warning" className="mb-3">
					{t('apiKeys.newKeyWarning')}
				</Typography.Paragraph>
				<div className="flex items-center gap-2">
					<Input
						readOnly
						value={revealedKey ?? ''}
						onFocus={(e) => e.target.select()}
						data-testid="api-key-revealed"
					/>
					<Button icon={<Copy size="1em" />} onClick={handleCopyKey}>
						{t('apiKeys.copy')}
					</Button>
				</div>
			</Modal>
		</div>
	);
}
