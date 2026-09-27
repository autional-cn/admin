'use client';

import {
	Card,
	Form,
	InputNumber,
	Switch,
	Button,
	Space,
	message,
	Spin,
	Typography,
	Popconfirm,
} from 'antd';
import { SaveOutlined, UndoOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRiskConfig, updateRiskConfig, resetRiskConfig } from '@/lib/api.generated';
import { queryKeys } from '@/lib/query-keys';
import { snakeCaseKeys } from '@autional-cn/shared';
import { PageHeader } from '@autional-cn/ui';

const { Text } = Typography;

interface SignalWeight {
	ip_unknown: number;
	ip_bad_reputation: number;
	ip_vpn: number;
	login_failure_high: number;
	login_failure_moderate: number;
	new_device_or_ip: number;
	unknown_device: number;
	unusual_location: number;
	unusual_time: number;
	new_country: number;
	velocity_anomaly: number;
	credential_leaked: number;
	mfa_method_changed: number;
	session_hijack: number;
}

interface RiskConfig {
	tenant_id: string;
	elevated_threshold: number;
	moderate_threshold: number;
	high_threshold: number;
	critical_threshold: number;
	signal_weights: SignalWeight;
	learning_period_days: number;
	session_risk_enabled: boolean;
}

const signalLabels: Record<keyof SignalWeight, string> = {
	ip_unknown: '未知 IP',
	ip_bad_reputation: 'IP 信誉差',
	ip_vpn: 'VPN/代理 IP',
	login_failure_high: '高频登录失败',
	login_failure_moderate: '中频登录失败',
	new_device_or_ip: '新设备/IP',
	unknown_device: '未知设备',
	unusual_location: '异地登录',
	unusual_time: '异常时间',
	new_country: '新国家',
	velocity_anomaly: '速度异常',
	credential_leaked: '凭证泄露',
	mfa_method_changed: 'MFA 方式变更',
	session_hijack: '会话劫持',
};

export default function RiskConfigPage() {
	const queryClient = useQueryClient();

	const { data: config, isLoading } = useQuery({
		queryKey: queryKeys.security.riskConfig,
		queryFn: async () => {
			const res = await getRiskConfig();
			// apiClient interceptor 已转 camelCase（elevatedThreshold 等），
			// Form.Item name 用 snake_case，这里转回 snake_case 供 initialValues/表单匹配
			return snakeCaseKeys(res as Record<string, unknown>) as unknown as RiskConfig;
		},
	});

	const { mutateAsync: save, isPending: isSaving } = useMutation({
		mutationFn: updateRiskConfig,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.security.riskConfig });
			message.success('风险配置已保存');
		},
		onError: () => message.error('保存失败'),
	});

	const { mutateAsync: reset, isPending: isResetting } = useMutation({
		mutationFn: resetRiskConfig,
		onSuccess: (data) => {
			queryClient.setQueryData(
				queryKeys.security.riskConfig,
				snakeCaseKeys(data as Record<string, unknown>) as unknown as RiskConfig,
			);
			message.success('已恢复默认配置');
		},
		onError: () => message.error('重置失败'),
	});

	const [form] = Form.useForm();

	if (isLoading || !config) return <Spin style={{ display: 'block', margin: '80px auto' }} />;

	const handleSave = async () => {
		const values = await form.validateFields();
		await save(values);
	};

	return (
		<div style={{ maxWidth: 800 }}>
			<PageHeader title="风险评分配置" subtitle="配置自适应 MFA 的风险评分阈值与信号权重" />

			<Form form={form} layout="vertical" initialValues={config}>
				<Card title="风险等级阈值" style={{ marginBottom: 16 }}>
					<Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
						五级风险模型：L0 正常 → L1 建议 MFA → L2 需要 SMS → L3 需要 TOTP → L4 阻断登录
					</Text>
					<Space wrap>
						<Form.Item name="elevated_threshold" label="L1 提醒阈值" rules={[{ required: true }]}>
							<InputNumber min={0} max={100} />
						</Form.Item>
						<Form.Item name="moderate_threshold" label="L2 SMS 阈值" rules={[{ required: true }]}>
							<InputNumber min={0} max={100} />
						</Form.Item>
						<Form.Item name="high_threshold" label="L3 TOTP 阈值" rules={[{ required: true }]}>
							<InputNumber min={0} max={100} />
						</Form.Item>
						<Form.Item name="critical_threshold" label="L4 阻断阈值" rules={[{ required: true }]}>
							<InputNumber min={0} max={100} />
						</Form.Item>
					</Space>
				</Card>

				<Card title="信号权重" style={{ marginBottom: 16 }}>
					<Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
						每个风险信号对总分 (0-100) 的贡献值
					</Text>
					{Object.entries(signalLabels).map(([key, label]) => (
						<Form.Item
							key={key}
							name={['signal_weights', key]}
							label={`${label} (${key})`}
							style={{ display: 'inline-block', width: 280, marginRight: 16 }}
						>
							<InputNumber min={0} max={100} size="small" />
						</Form.Item>
					))}
				</Card>

				<Card title="通用设置" style={{ marginBottom: 16 }}>
					<Form.Item name="learning_period_days" label="新用户学习期 (天)">
						<InputNumber min={0} max={90} />
					</Form.Item>
					<Form.Item name="session_risk_enabled" label="会话持续风险监控" valuePropName="checked">
						<Switch />
					</Form.Item>
				</Card>
			</Form>

			<Space>
				<Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={handleSave}>
					保存配置
				</Button>
				<Popconfirm title="恢复系统默认风险配置？" onConfirm={() => reset()}>
					<Button icon={<UndoOutlined />} loading={isResetting}>
						恢复默认
					</Button>
				</Popconfirm>
			</Space>
		</div>
	);
}
