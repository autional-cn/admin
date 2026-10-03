'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Button, Select, Space, Drawer, Row, Col, Modal, Input, Descriptions, Divider, Timeline, Empty, Spin } from 'antd';

import { message } from '@/lib/antd-app';
import { SecurityScanOutlined, LinkOutlined, WarningOutlined } from '@ant-design/icons';
import {
	useAnomalies,
	useUpdateAnomalyStatus,
	useAssignAnomaly,
	useDetectAnomalies,
	useAddAnomalyComment,
	useAnomalyTimeline,
	useRelatedAnomalies,
	useLinkAnomalyToCase,
} from '@/hooks/use-audit-anomalies';
import { handleApiError } from '@/lib/error-handler';
import { PageError, DataTable } from '@autional-cn/ui/antd';
import type { DataTablePagination } from '@autional-cn/ui/antd';
import { useIsAuditRestricted, AuditStatsOnly, extractItem } from '@autional-cn/shared';
import { ConsolePageHeader } from '@autional-cn/ui';
import { useTranslation } from 'react-i18next';

const SEVERITY_COLORS: Record<string, string> = {
	low: 'blue',
	medium: 'orange',
	high: 'red',
	critical: 'magenta',
};

const STATUS_COLORS: Record<string, string> = {
	open: 'processing',
	investigating: 'warning',
	resolved: 'success',
	false_positive: 'default',
};

const LEVEL_COLORS: Record<string, string> = {
	info: 'blue',
	warning: 'orange',
	error: 'red',
	critical: 'magenta',
};

export default function AuditAnomaliesPage() {
	const { t } = useTranslation();

	const SEVERITY_OPTIONS = [
		{ label: t('auditAnomalies.severity.low'), value: 'low' },
		{ label: t('auditAnomalies.severity.medium'), value: 'medium' },
		{ label: t('auditAnomalies.severity.high'), value: 'high' },
		{ label: t('auditAnomalies.severity.critical'), value: 'critical' },
	];

	const STATUS_OPTIONS = [
		{ label: t('auditAnomalies.status.open'), value: 'open' },
		{ label: t('auditAnomalies.status.investigating'), value: 'investigating' },
		{ label: t('auditAnomalies.status.resolved'), value: 'resolved' },
		{ label: t('auditAnomalies.status.falsePositive'), value: 'false_positive' },
	];

	const TYPE_OPTIONS = [
		{ label: t('auditAnomalies.type.bruteForce'), value: 'brute_force' },
		{ label: t('auditAnomalies.type.unusualLocation'), value: 'unusual_location' },
		{ label: t('auditAnomalies.type.dataExfiltration'), value: 'data_exfiltration' },
		{ label: t('auditAnomalies.type.privilegeEscalation'), value: 'privilege_escalation' },
	];

	const TIME_RANGE_OPTIONS = [
		{ label: t('auditAnomalies.timeRange.last1Hour'), value: '1h' },
		{ label: t('auditAnomalies.timeRange.last24Hours'), value: '24h' },
		{ label: t('auditAnomalies.timeRange.last7Days'), value: '7d' },
		{ label: t('auditAnomalies.timeRange.last30Days'), value: '30d' },
	];

	const statusLabel = (value: string) =>
		STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;

	const [severity, setSeverity] = useState<string | undefined>();
	const [status, setStatus] = useState<string | undefined>();
	const [type, setType] = useState<string | undefined>();
	const [timeRange, setTimeRange] = useState<string | undefined>();
	const [pagination, setPagination] = useState({ page: 1, pageSize: 20 });
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [currentRecord, setCurrentRecord] = useState<any>(null);

	// Assign modal
	const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
	const [assigneeName, setAssigneeName] = useState('');

	// Link to case modal
	const [linkCaseTargetId, setLinkCaseTargetId] = useState<string | null>(null);
	const [caseIdInput, setCaseIdInput] = useState('');

	// Comments
	const [newComment, setNewComment] = useState('');

	const params: Record<string, unknown> = { ...pagination };
	if (severity) params.severity = severity;
	if (status) params.status = status;
	if (type) params.type = type;
	if (timeRange) params.time_range = timeRange;

	const isRestricted = useIsAuditRestricted();
	const { data, isLoading, refetch, error } = useAnomalies(params);
	const statusMut = useUpdateAnomalyStatus();
	const assignMut = useAssignAnomaly();
	const detectMut = useDetectAnomalies();
	const commentMut = useAddAnomalyComment();
	const linkCaseMut = useLinkAnomalyToCase();

	const timelineQuery = useAnomalyTimeline(drawerVisible ? currentRecord?.id : undefined);
	const relatedQuery = useRelatedAnomalies(drawerVisible ? currentRecord?.id : undefined);

	useEffect(() => {
		if (drawerVisible) {
			setNewComment('');
		}
	}, [drawerVisible]);

	const handleStatusChange = useCallback(
		async (id: string, newStatus: string) => {
			try {
				await statusMut.mutateAsync({ id, data: { status: newStatus } });
				message.success(t('auditAnomalies.statusUpdated', { status: statusLabel(newStatus) }));
				refetch();
				if (drawerVisible && currentRecord?.id === id) {
					setCurrentRecord((prev: any) => ({ ...prev, status: newStatus }));
				}
			} catch (err) {
				handleApiError(err, t('auditAnomalies.updateStatusFailed'));
			}
		},
		[statusMut, refetch, drawerVisible, currentRecord, t],
	);

	const handleAssignClick = useCallback((id: string) => {
		setAssignTargetId(id);
		setAssigneeName('');
	}, []);

	const handleAssignConfirm = useCallback(async () => {
		if (!assignTargetId || !assigneeName.trim()) return;
		try {
			await assignMut.mutateAsync({ id: assignTargetId, data: { assignee: assigneeName.trim() } });
			message.success(t('auditAnomalies.assigned'));
			setAssignTargetId(null);
			setAssigneeName('');
			refetch();
		} catch (err) {
			handleApiError(err, t('auditAnomalies.assignFailed'));
		}
	}, [assignTargetId, assigneeName, assignMut, refetch, t]);

	const handleDetect = useCallback(async () => {
		try {
			const payload: Record<string, string> = {};
			if (timeRange) payload.time_range = timeRange;
			await detectMut.mutateAsync(payload);
			message.success(t('auditAnomalies.detectSuccess'));
			refetch();
		} catch (err) {
			handleApiError(err, t('auditAnomalies.detectFailed'));
		}
	}, [detectMut, timeRange, refetch, t]);

	const handleAddComment = useCallback(async () => {
		if (!newComment.trim() || !currentRecord?.id) return;
		try {
			await commentMut.mutateAsync({ id: currentRecord.id, content: newComment.trim() });
			message.success(t('auditAnomalies.commentAdded'));
			setNewComment('');
			refetch();
		} catch (err) {
			handleApiError(err, t('auditAnomalies.commentAddFailed'));
		}
	}, [newComment, currentRecord, commentMut, refetch, t]);

	const handleLinkCaseClick = useCallback((id: string) => {
		setLinkCaseTargetId(id);
		setCaseIdInput('');
	}, []);

	const handleLinkCaseConfirm = useCallback(async () => {
		if (!linkCaseTargetId || !caseIdInput.trim()) return;
		try {
			await linkCaseMut.mutateAsync({ id: linkCaseTargetId, caseId: caseIdInput.trim() });
			message.success(t('auditAnomalies.linkedToCase'));
			setLinkCaseTargetId(null);
			setCaseIdInput('');
			refetch();
		} catch (err) {
			handleApiError(err, t('auditAnomalies.linkCaseFailed'));
		}
	}, [linkCaseTargetId, caseIdInput, linkCaseMut, refetch, t]);

	const openDetail = useCallback((record: any) => {
		setCurrentRecord(record);
		setDrawerVisible(true);
	}, []);

	const formatTs = (ts?: number) => {
		if (!ts) return '-';
		// API 返回毫秒时间戳（1786025431157），直接 new Date(ts)；若为秒级则放大
		const num = Number(ts);
		const ms = num > 1e12 ? num : num * 1000; // 纳秒/微秒安全：毫秒 ~1.7e12
		return new Date(ms).toISOString();
	};

	const columns = [
		{
			title: t('auditAnomalies.column.severity'),
			dataIndex: 'severity',
			key: 'severity',
			width: 100,
			render: (v: string) => <Tag color={SEVERITY_COLORS[v] || 'default'}>{v}</Tag>,
		},
		{
			title: t('auditAnomalies.column.type'),
			dataIndex: 'type',
			key: 'type',
			width: 130,
			render: (v: string) => <Tag>{v}</Tag>,
		},
		{
			title: t('auditAnomalies.column.description'),
			dataIndex: 'description',
			key: 'description',
			ellipsis: true,
		},
		{
			title: t('auditAnomalies.column.status'),
			dataIndex: 'status',
			key: 'status',
			width: 140,
			render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{v}</Tag>,
		},
		{
			title: t('auditAnomalies.column.user'),
			dataIndex: 'userId',
			key: 'userId',
			width: 150,
			ellipsis: true,
		},
		{
			title: t('auditAnomalies.column.detected'),
			dataIndex: 'detectedAt',
			key: 'detectedAt',
			width: 170,
			render: formatTs,
		},
		{
			title: t('auditAnomalies.column.action'),
			key: 'action_col',
			width: 360,
			render: (_: any, record: any) => (
				<Space size="small" wrap>
					<Button type="link" size="small" onClick={() => openDetail(record)}>
						{t('auditAnomalies.actions.detail')}
					</Button>
					{record.status === 'open' && (
						<Button
							type="link"
							size="small"
							onClick={() => handleStatusChange(record.id, 'investigating')}
						>
							{t('auditAnomalies.actions.investigate')}
						</Button>
					)}
					{record.status === 'investigating' && (
						<Button
							type="link"
							size="small"
							onClick={() => handleStatusChange(record.id, 'resolved')}
						>
							{t('auditAnomalies.actions.resolve')}
						</Button>
					)}
					{(record.status === 'open' || record.status === 'investigating') && (
						<Button
							type="link"
							size="small"
							icon={<WarningOutlined />}
							onClick={() => handleStatusChange(record.id, 'false_positive')}
						>
							{t('auditAnomalies.actions.falsePositive')}
						</Button>
					)}
					<Button type="link" size="small" onClick={() => handleAssignClick(record.id)}>
						{t('auditAnomalies.actions.assign')}
					</Button>
					<Button
						type="link"
						size="small"
						icon={<LinkOutlined />}
						onClick={() => handleLinkCaseClick(record.id)}
					>
						{t('auditAnomalies.actions.linkCase')}
					</Button>
				</Space>
			),
		},
	];

	const timelineData = extractItem(timelineQuery.data);
	const relatedData = relatedQuery.data;

	if (isRestricted) {
		return <AuditStatsOnly title={t('auditAnomalies.title')} />;
	}

	return (
		<div>
			<ConsolePageHeader
				title={t('auditAnomalies.title')}
				actions={
					<>
						<Button
							type="primary"
							icon={<SecurityScanOutlined />}
							loading={detectMut.isPending}
							onClick={handleDetect}
						>
							{detectMut.isPending ? t('auditAnomalies.detecting') : t('auditAnomalies.runDetection')}
						</Button>
					</>
				}
			/>

			{error && (
				<PageError message={t('auditAnomalies.loadError')} retry={refetch} className="mb-4" />
			)}
			<div className="mb-4">
				<Row gutter={16}>
					<Col xs={24} sm={12} md={4}>
						<Select
							placeholder={t('auditAnomalies.filter.severity')}
							allowClear
							className="w-full"
							options={SEVERITY_OPTIONS}
							value={severity}
							onChange={setSeverity}
						/>
					</Col>
					<Col xs={24} sm={12} md={4}>
						<Select
							placeholder={t('auditAnomalies.filter.status')}
							allowClear
							className="w-full"
							options={STATUS_OPTIONS}
							value={status}
							onChange={setStatus}
						/>
					</Col>
					<Col xs={24} sm={12} md={4}>
						<Select
							placeholder={t('auditAnomalies.filter.type')}
							allowClear
							className="w-full"
							options={TYPE_OPTIONS}
							value={type}
							onChange={setType}
						/>
					</Col>
					<Col xs={24} sm={12} md={4}>
						<Select
							placeholder={t('auditAnomalies.filter.timeRange')}
							allowClear
							className="w-full"
							options={TIME_RANGE_OPTIONS}
							value={timeRange}
							onChange={setTimeRange}
						/>
					</Col>
				</Row>
			</div>

			<DataTable
				rowKey="id"
				columns={columns}
				dataSource={data?.items || []}
				loading={isLoading}
				scroll={{ x: 1100 }}
				pagination={{
					current: pagination.page,
					pageSize: pagination.pageSize,
					showSizeChanger: true,
					pageSizeOptions: [20, 50, 100],
					total: data?.pagination?.total || 0,
				}}
				onChange={(pag: DataTablePagination) => {
					setPagination({ page: pag.current || 1, pageSize: pag.pageSize || 20 });
				}}
			/>

			<Drawer
				title={t('auditAnomalies.detailTitle')}
				size="large"
				open={drawerVisible}
				onClose={() => setDrawerVisible(false)}
				className="!w-full sm:!w-[480px]"
			>
				{currentRecord ? (
					<div className="space-y-4">
						<Descriptions column={2} bordered size="small">
							<Descriptions.Item label={t('common.id')}>{currentRecord.id}</Descriptions.Item>
							<Descriptions.Item label={t('auditAnomalies.column.severity')}>
								<Tag color={SEVERITY_COLORS[currentRecord.severity] || 'default'}>
									{currentRecord.severity}
								</Tag>
							</Descriptions.Item>
							<Descriptions.Item label={t('auditAnomalies.column.type')}>
								<Tag>{currentRecord.type}</Tag>
							</Descriptions.Item>
							<Descriptions.Item label={t('auditAnomalies.column.status')}>
								<Tag color={STATUS_COLORS[currentRecord.status] || 'default'}>
									{currentRecord.status}
								</Tag>
							</Descriptions.Item>
							<Descriptions.Item label={t('auditAnomalies.column.description')} span={2}>
								{currentRecord.description || '-'}
							</Descriptions.Item>
							<Descriptions.Item label={t('auditAnomalies.assignee')}>
								{currentRecord.assignee || '-'}
							</Descriptions.Item>
							<Descriptions.Item label={t('auditAnomalies.userId')}>
								{currentRecord.userId || '-'}
							</Descriptions.Item>
							<Descriptions.Item label={t('auditAnomalies.mitreTactic')}>
								{currentRecord.mitreTactic || '-'}
							</Descriptions.Item>
							<Descriptions.Item label={t('auditAnomalies.column.detected')}>
								{formatTs(currentRecord.detectedAt)}
							</Descriptions.Item>
							<Descriptions.Item label={t('common.createdAt')}>
								{formatTs(currentRecord.createdAt)}
							</Descriptions.Item>
							{currentRecord.resolvedAt && (
								<Descriptions.Item label={t('auditAnomalies.resolvedAt')}>
									{formatTs(currentRecord.resolvedAt)}{' '}
									{t('auditAnomalies.resolvedBy', { user: currentRecord.resolvedBy })}
								</Descriptions.Item>
							)}
							{currentRecord.relatedCaseId && (
								<Descriptions.Item label={t('auditAnomalies.case')}>
									{currentRecord.relatedCaseId}
								</Descriptions.Item>
							)}
						</Descriptions>

						{currentRecord.eventIds?.length > 0 && (
							<div className="text-sm text-neutral-600">
								<span className="font-medium">{t('auditAnomalies.eventIds')}</span>
								{currentRecord.eventIds.join(', ')}
							</div>
						)}

						<Space wrap>
							{currentRecord.status === 'open' && (
								<Button
									type="primary"
									onClick={() => handleStatusChange(currentRecord.id, 'investigating')}
									loading={statusMut.isPending}
								>
									{t('auditAnomalies.startInvestigation')}
								</Button>
							)}
							{currentRecord.status === 'investigating' && (
								<Button
									onClick={() => handleStatusChange(currentRecord.id, 'resolved')}
									loading={statusMut.isPending}
								>
									{t('auditAnomalies.actions.resolve')}
								</Button>
							)}
							{(currentRecord.status === 'open' || currentRecord.status === 'investigating') && (
								<Button
									icon={<WarningOutlined />}
									onClick={() => handleStatusChange(currentRecord.id, 'false_positive')}
									loading={statusMut.isPending}
								>
									{t('auditAnomalies.markFalsePositive')}
								</Button>
							)}
							<Button onClick={() => handleAssignClick(currentRecord.id)}>
								{t('auditAnomalies.actions.assign')}
							</Button>
							<Button icon={<LinkOutlined />} onClick={() => handleLinkCaseClick(currentRecord.id)}>
								{t('auditAnomalies.actions.linkCase')}
							</Button>
						</Space>

						<Divider />

						{/* Investigation Comments */}
						<h3 className="font-semibold text-base">{t('auditAnomalies.investigationComments')}</h3>
						{currentRecord.comments?.length > 0 ? (
							<Timeline
								items={currentRecord.comments.map((c: any) => ({
									children: (
										<div>
											<div className="text-xs text-neutral-500 mb-1">
												{c.authorName || c.authorId || t('auditAnomalies.unknown')} —{' '}
												{formatTs(c.createdAt)}
											</div>
											<div>{c.content}</div>
										</div>
									),
								}))}
							/>
						) : (
							<div className="text-neutral-500 text-sm py-2">{t('auditAnomalies.noComments')}</div>
						)}
						<div className="flex gap-2">
							<Input.TextArea
								rows={3}
								placeholder={t('auditAnomalies.commentPlaceholder')}
								value={newComment}
								onChange={(e) => setNewComment(e.target.value)}
							/>
							<Button
								type="primary"
								onClick={handleAddComment}
								loading={commentMut.isPending}
								disabled={!newComment.trim()}
								className="self-end"
							>
								{t('common.submit')}
							</Button>
						</div>

						<Divider />

						{/* Event Timeline */}
						<h3 className="font-semibold text-base">{t('auditAnomalies.eventTimeline')}</h3>
						{timelineQuery.isLoading ? (
							<div className="flex justify-center py-4">
								<Spin size="small" />
							</div>
						) : timelineQuery.isError ? (
							<div className="text-red-500 text-sm">{t('auditAnomalies.timelineLoadError')}</div>
						) : timelineData ? (
							<div>
								{timelineData.anomaly && (
									<Descriptions column={2} bordered size="small" className="mb-4">
										<Descriptions.Item label={t('auditAnomalies.column.severity')}>
											<Tag
												color={SEVERITY_COLORS[timelineData.anomaly.severity || ''] || 'default'}
											>
												{timelineData.anomaly.severity}
											</Tag>
										</Descriptions.Item>
										<Descriptions.Item label={t('auditAnomalies.column.status')}>
											<Tag color={STATUS_COLORS[timelineData.anomaly.status || ''] || 'default'}>
												{timelineData.anomaly.status}
											</Tag>
										</Descriptions.Item>
										<Descriptions.Item label={t('auditAnomalies.column.description')} span={2}>
											{timelineData.anomaly.description || '-'}
										</Descriptions.Item>
									</Descriptions>
								)}
								{timelineData.context && (
									<div className="mb-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded text-sm">
										<div className="font-medium mb-1">{t('auditAnomalies.contextSummary')}</div>
										<Row gutter={16}>
											<Col span={8}>
												<span className="text-neutral-600">{t('auditAnomalies.contextEvents')}</span>{' '}
												{timelineData.context.totalEvents}
											</Col>
											<Col span={8}>
												<span className="text-neutral-600">{t('auditAnomalies.contextDevices')}</span>{' '}
												{timelineData.context.uniqueDevices}
											</Col>
											<Col span={8}>
												<span className="text-neutral-600">{t('auditAnomalies.contextIps')}</span>{' '}
												{timelineData.context.uniqueIps}
											</Col>
										</Row>
										{timelineData.context.timeSpanSeconds != null && (
											<div className="mt-1 text-neutral-600">
												{t('auditAnomalies.timeSpan', {
													minutes: Math.round(timelineData.context.timeSpanSeconds / 60),
												})}
											</div>
										)}
									</div>
								)}
								{timelineData.events?.length > 0 ? (
									<Timeline
										items={timelineData.events.map((evt: any) => ({
											color: LEVEL_COLORS[evt.level] || 'blue',
											children: (
												<div>
													<div className="text-xs text-neutral-500">
														{formatTs(evt.timestamp)}
														{evt.action && (
															<Tag className="ml-2" color="blue">
																{evt.action}
															</Tag>
														)}
													</div>
													<div className="text-sm mt-1">{evt.message || '-'}</div>
													<div className="text-xs text-neutral-500 mt-1">
														IP: {evt.ip || '-'} | UA: {(evt.userAgent || '').substring(0, 40)}
														{(evt.userAgent || '').length > 40 ? '...' : ''}
													</div>
												</div>
											),
										}))}
									/>
								) : (
									<div className="text-neutral-500 text-sm py-2">
										{t('auditAnomalies.noTimelineEvents')}
									</div>
								)}
							</div>
						) : (
							<div className="text-neutral-500 text-sm py-2">{t('auditAnomalies.noTimelineData')}</div>
						)}

						<Divider />

						{/* Related Anomalies */}
						<h3 className="font-semibold text-base">{t('auditAnomalies.relatedTitle')}</h3>
						{relatedQuery.isLoading ? (
							<div className="flex justify-center py-4">
								<Spin size="small" />
							</div>
						) : relatedQuery.isError ? (
							<div className="text-red-500 text-sm">{t('auditAnomalies.relatedLoadError')}</div>
						) : relatedData?.items?.length > 0 ? (
							<div className="space-y-2">
								{relatedData.items.map((item: any) => (
									<div
										key={item.id}
										className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 border rounded hover:bg-neutral-50 hover:bg-neutral-900 cursor-pointer transition-colors"
										onClick={() => openDetail(item)}
									>
										<div className="flex items-center gap-3 min-w-0">
											<Tag color={SEVERITY_COLORS[item.severity] || 'default'} className="shrink-0">
												{item.severity}
											</Tag>
											<Tag className="shrink-0">{item.type}</Tag>
											<span className="truncate text-sm">{item.description || '-'}</span>
										</div>
										<Tag color={STATUS_COLORS[item.status] || 'default'} className="shrink-0">
											{item.status}
										</Tag>
									</div>
								))}
							</div>
						) : (
							<div className="text-neutral-500 text-sm py-2">{t('auditAnomalies.noRelated')}</div>
						)}
					</div>
				) : null}
			</Drawer>

			{/* Assign Modal */}
			<Modal
				title={t('auditAnomalies.assignTitle')}
				open={!!assignTargetId}
				onOk={handleAssignConfirm}
				onCancel={() => {
					setAssignTargetId(null);
					setAssigneeName('');
				}}
				confirmLoading={assignMut.isPending}
				className="w-full max-w-[560px]"
			>
				<div className="mb-2 text-sm text-neutral-600">{t('auditAnomalies.assigneeHint')}</div>
				<Input
					placeholder={t('auditAnomalies.assigneePlaceholder')}
					value={assigneeName}
					onChange={(e) => setAssigneeName(e.target.value)}
					onPressEnter={handleAssignConfirm}
				/>
			</Modal>

			{/* Link to Case Modal */}
			<Modal
				title={t('auditAnomalies.linkCaseTitle')}
				open={!!linkCaseTargetId}
				onOk={handleLinkCaseConfirm}
				onCancel={() => {
					setLinkCaseTargetId(null);
					setCaseIdInput('');
				}}
				confirmLoading={linkCaseMut.isPending}
				className="w-full max-w-[560px]"
			>
				<div className="mb-2 text-sm text-neutral-600">{t('auditAnomalies.caseId')}</div>
				<Input
					placeholder={t('auditAnomalies.caseIdPlaceholder')}
					value={caseIdInput}
					onChange={(e) => setCaseIdInput(e.target.value)}
					onPressEnter={handleLinkCaseConfirm}
				/>
			</Modal>
		</div>
	);
}
