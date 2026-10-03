'use client';

import React, { useState, useEffect } from 'react';
import {
	Card,
	Button,
	Form,
	Input,
	InputNumber,
	Switch,
	Spin,
	Descriptions,
	Modal,
	Statistic,
	Row as AntRow,
	Col,
} from 'antd';
import { message } from '@/lib/antd-app';
import {
	EditOutlined,
	SaveOutlined,
	CloseOutlined,
	CloudUploadOutlined,
	CloudDownloadOutlined,
} from '@ant-design/icons';
import { useRetentionPolicy, useSaveRetentionPolicy } from '@/hooks/use-retention-policy';
import type { RetentionPolicy } from '@/hooks/use-retention-policy';
import type * as Types from '@autional-cn/shared/generated/types';
import { handleApiError } from '@/lib/error-handler';
import { PageError } from '@autional-cn/ui/antd';
import { apiClient, extractItem } from '@autional-cn/shared';
import { adminAuditArchiveStatus, adminAuditArchivePost } from '@autional-cn/shared/generated/api';
import { ConsolePageHeader } from '@autional-cn/ui';
import { useTranslation } from 'react-i18next';

export default function RetentionPolicyPage() {
	const { t } = useTranslation();
	const [editing, setEditing] = useState(false);
	const [form] = Form.useForm();

	const { data, isLoading, error, refetch } = useRetentionPolicy();
	const saveMut = useSaveRetentionPolicy();

	const [archiveStatus, setArchiveStatus] = useState<any>(null);
	const [archiveLoading, setArchiveLoading] = useState(false);
	const [archiveNowLoading, setArchiveNowLoading] = useState(false);

	const fetchArchiveStatus = async () => {
		setArchiveLoading(true);
		try {
			const res = await adminAuditArchiveStatus();
			setArchiveStatus(extractItem(res));
		} catch (err) {
			handleApiError(err, 'Failed to load archive status');
		} finally {
			setArchiveLoading(false);
		}
	};

	const handleArchiveNow = async () => {
		setArchiveNowLoading(true);
		try {
			const res = await adminAuditArchivePost({
				before: Date.now(),
			});
			const count = extractItem(res)?.archivedCount || 0;
			message.success(`Archive completed — ${count} records archived`);
			fetchArchiveStatus();
		} catch (err) {
			handleApiError(err, 'Archive failed');
		} finally {
			setArchiveNowLoading(false);
		}
	};

	useEffect(() => {
		fetchArchiveStatus();
	}, []);

	const handleSave = async (values: any) => {
		try {
			const payload: Types.RetentionPolicyRequest = {
				days: values.days,
				enabled: values.enabled,
				archiveTo: values.archiveTo,
				bucket: values.bucket,
			};
			await saveMut.mutateAsync(payload);
			message.success('Policy saved');
			setEditing(false);
		} catch (err) {
			handleApiError(err, 'Save failed');
		}
	};

	const startEdit = () => {
		if (data) {
			form.setFieldsValue({
				days: data.days ?? 90,
				enabled: data.enabled ?? false,
				archiveTo: data.archiveTo ?? 'minio',
				bucket: data.bucket ?? 'audit-archive',
			});
		}
		setEditing(true);
	};

	if (isLoading) return <Spin className="flex justify-center py-16" />;
	if (error) return <PageError message={t('auditRetention.loadError')} retry={refetch} />;

	// P3-2: 归档状态字段真实化 — 后端 ArchiveStatusResponse 无 status/totalArchived 字段（plan.md ADR-2/3/4）
	const archiveEnabled = archiveStatus?.enabled ?? archiveStatus?.Enabled;
	const rawLastArchive =
		archiveStatus?.lastArchive ?? archiveStatus?.last_archive ?? archiveStatus?.LastArchiveTime;
	let lastArchiveNum: number = NaN;
	if (typeof rawLastArchive === 'number') {
		lastArchiveNum = rawLastArchive;
	} else if (typeof rawLastArchive === 'string' && rawLastArchive !== '') {
		lastArchiveNum = Number(rawLastArchive);
	}
	const EPOCH_ZERO_SENTINEL = -62135596800000; // Go time.Time{} 零值毫秒 = 从未归档
	const neverArchived =
		Number.isNaN(lastArchiveNum) || lastArchiveNum <= 0 || lastArchiveNum === EPOCH_ZERO_SENTINEL;

	return (
		<div>
			<ConsolePageHeader
				title={t('auditRetention.title')}
				actions={
					<>
						{!editing && (
							<Button icon={<EditOutlined />} onClick={startEdit}>
								{t('auditRetention.edit')}
							</Button>
						)}
					</>
				}
			/>

			{editing ? (
				<Card>
					<Form form={form} layout="vertical" onFinish={handleSave}>
						<Form.Item name="days" label={t('auditRetention.form.retentionDays')} rules={[{ required: true }]}>
							<InputNumber min={1} max={3650} className="w-full md:w-64" />
						</Form.Item>
						<Form.Item name="archiveTo" label={t('auditRetention.form.archiveTarget')}>
							<Input placeholder={t('auditRetention.form.archiveTargetPlaceholder')} className="w-full md:w-64" />
						</Form.Item>
						<Form.Item name="bucket" label={t('auditRetention.form.archiveBucket')}>
							<Input placeholder={t('auditRetention.form.archiveBucketPlaceholder')} className="w-full md:w-64" />
						</Form.Item>
						<Form.Item name="enabled" label={t('auditRetention.form.autoArchive')} valuePropName="checked">
							<Switch />
						</Form.Item>
						<div className="flex gap-3">
							<Button
								type="primary"
								htmlType="submit"
								icon={<SaveOutlined />}
								loading={saveMut.isPending}
							>
								{t('common.save')}
							</Button>
							<Button icon={<CloseOutlined />} onClick={() => setEditing(false)}>
								{t('common.cancel')}
							</Button>
						</div>
					</Form>
				</Card>
			) : (
				<Card>
					<Descriptions column={1} size="middle">
						<Descriptions.Item label={t('auditRetention.desc.retentionDays')}>{data?.days ?? '-'}</Descriptions.Item>
						<Descriptions.Item label={t('auditRetention.desc.autoArchive')}>
							<span className={data?.enabled ? 'text-green-600' : 'text-gray-400'}>
								{data?.enabled ? t('auditRetention.desc.enabled') : t('auditRetention.desc.disabled')}
							</span>
						</Descriptions.Item>
						<Descriptions.Item label={t('auditRetention.desc.archiveTarget')}>{data?.archiveTo || '-'}</Descriptions.Item>
						<Descriptions.Item label={t('auditRetention.desc.bucket')}>{data?.bucket || '-'}</Descriptions.Item>
						<Descriptions.Item label={t('auditRetention.desc.tenant')}>{data?.tenantId || '-'}</Descriptions.Item>
					</Descriptions>
				</Card>
			)}

			<Card
				title={t('auditRetention.archiveTitle')}
				className="mt-6"
				extra={
					<Button
						icon={<CloudDownloadOutlined />}
						onClick={handleArchiveNow}
						loading={archiveNowLoading}
					>
						{t('auditRetention.archiveNow')}
					</Button>
				}
			>
				{archiveLoading ? (
					<Spin />
				) : archiveStatus ? (
					<AntRow gutter={24}>
						<Col span={8}>
							<Statistic
								title={t('auditRetention.archiveStatus')}
								value={
									archiveEnabled
										? t('auditRetention.desc.enabled')
										: t('auditRetention.desc.disabled')
								}
								valueStyle={{
									color: archiveEnabled ? 'var(--color-active)' : 'var(--color-info-light)',
								}}
							/>
						</Col>
						<Col span={8}>
							<Statistic
								title={t('auditRetention.lastArchiveTime')}
								value={
									neverArchived
										? t('auditRetention.neverArchived')
										: new Date(lastArchiveNum).toLocaleString()
								}
							/>
						</Col>
						<Col span={8}>
							<Statistic
								title={t('auditRetention.desc.retentionDays')}
								value={archiveStatus.days ?? archiveStatus.Days ?? 0}
							/>
						</Col>
					</AntRow>
				) : (
					<div className="text-gray-400">{t('auditRetention.noArchiveStatus')}</div>
				)}
			</Card>
		</div>
	);
}
