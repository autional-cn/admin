'use client';

import { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Space, Popconfirm, Tag, message } from 'antd';
import { Alert } from '@autional-cn/ui';
import { useAuth } from '@autional-cn/shared';

export default function TrialPage() {
	const { user } = useAuth();
	const [trial, setTrial] = useState<{
		active: boolean;
		expiresAt?: string;
		tenantName?: string;
	} | null>(null);

	useEffect(() => {
		// 运行时试用配置（宿主页面可注入 __AUTIONAL_CONFIG__；无注入时用默认值）
		const config = (window as any).__AUTIONAL_CONFIG__ || {};
		setTrial({
			active: config.trial !== false,
			expiresAt: config.trialExpiresAt,
			tenantName: config.tenantName,
		});
	}, []);

	const handleUpgrade = async () => {
		try {
			message.loading({ content: '升级中...', key: 'upgrade' });
			// TODO: call SDK upgradeTrial
			message.success({ content: '升级成功！', key: 'upgrade' });
			setTrial((prev) => (prev ? { ...prev, active: false } : null));
		} catch {
			message.error({ content: '升级失败', key: 'upgrade' });
		}
	};

	const handleDelete = async () => {
		try {
			message.loading({ content: '删除中...', key: 'delete' });
			// TODO: call SDK delete endpoint
			message.success({ content: '已删除', key: 'delete' });
		} catch {
			message.error({ content: '删除失败', key: 'delete' });
		}
	};

	if (!trial?.active) return null;

	return (
		<div style={{ padding: 24 }}>
			<Alert
				variant="warning"
				title={`试用剩余 ${formatRemaining(trial.expiresAt)} 天`}
				action={
					<Popconfirm title="升级后不可退回试用，数据永久保留" onConfirm={handleUpgrade}>
						<Button type="primary">升级为正式版</Button>
					</Popconfirm>
				}
				className="mb-4"
			>
				到期后所有数据将被永久删除。升级为正式版以保留数据。
			</Alert>

			<Card title="试用状态">
				<Descriptions column={1}>
					<Descriptions.Item label="租户名">{trial.tenantName || '-'}</Descriptions.Item>
					<Descriptions.Item label="状态">
						<Tag color="orange">试用中</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="到期时间">{trial.expiresAt || '永久'}</Descriptions.Item>
				</Descriptions>
				<Space style={{ marginTop: 16 }}>
					<Popconfirm title="数据永久删除，不可恢复" onConfirm={handleDelete}>
						<Button danger>删除试用租户</Button>
					</Popconfirm>
				</Space>
			</Card>
		</div>
	);
}

function formatRemaining(expiresAt?: string): string {
	if (!expiresAt) return '永久';
	const diff = new Date(expiresAt).getTime() - Date.now();
	const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
	return String(days);
}
