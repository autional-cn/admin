/**
 * Compliance Profile Presets — 合规配置文件预设常量
 *
 * 每个 Profile 定义一组 auth-policy 参数值，对应后端 UpdateAuthConfigRequest。
 * 选择 Profile 后通过 PUT /admin/security/auth-config 一键应用。
 *
 * 参考: .docs_20260606/docs/industry-standards/compliance-matrix.md §5
 */

export interface ProfilePreset {
	key: string;
	name: string;
	i18nKey: string;
	description: string;
	descriptionI18nKey: string;
	/** 对应 TenantAuthPolicyRequest 的字段值 */
	values: Record<string, unknown>;
}

export const COMPLIANCE_PROFILES: ProfilePreset[] = [
	{
		key: 'balanced',
		name: 'Balanced (Default)',
		i18nKey: 'authConfig.profileBalanced',
		description: '保守超集 — 新租户默认。折中 NIST/PCI/PSD2 要求，兼顾安全与可用性。',
		descriptionI18nKey: 'authConfig.profileBalancedDesc',
		values: {
			minLength: 12,
			maxLength: 64,
			requireUpper: false,
			requireLower: false,
			requireDigit: false,
			requireSpecial: false,
			expiryDays: 0,
			historyCount: 0,
			maxLoginAttempts: 5,
			lockDurationSec: 30,
			breachCheckEnabled: true,
			magicLinkEnabled: true,
			passkeyEnabled: true,
		},
	},
	{
		key: 'nist_v4_high',
		name: 'NIST SP 800-63-4 (High Security)',
		i18nKey: 'authConfig.profileNISTv4',
		description:
			'NIST v4 AAL2 高安全保障。SFA 密码最小 15 字符，SHALL NOT 强制组合规则/定期过期/密码提示/KBA，SHALL 提供防钓鱼 MFA。',
		descriptionI18nKey: 'authConfig.profileNISTv4Desc',
		values: {
			minLength: 15,
			maxLength: 64,
			requireUpper: false,
			requireLower: false,
			requireDigit: false,
			requireSpecial: false,
			expiryDays: 0,
			historyCount: 0,
			maxLoginAttempts: 5,
			lockDurationSec: 30,
			passkeyEnabled: true,
			breachCheckEnabled: true,
			magicLinkEnabled: true,
			deviceFingerprintEnabled: true,
			captchaEnabled: true,
		},
	},
	{
		key: 'pci_dss_v4',
		name: 'PCI DSS v4.0.1',
		i18nKey: 'authConfig.profilePCI',
		description:
			'PCI DSS v4.0.1 合规。SFA 密码最小 12 字符，数字必选，90 天过期，历史 ≥4，首次登录强制改密，15min 空闲超时。',
		descriptionI18nKey: 'authConfig.profilePCIDesc',
		values: {
			minLength: 12,
			maxLength: 64,
			requireUpper: false,
			requireLower: false,
			requireDigit: true,
			requireSpecial: false,
			expiryDays: 90,
			historyCount: 4,
			maxLoginAttempts: 6,
			lockDurationSec: 30,
			breachCheckEnabled: true,
			magicLinkEnabled: true,
			passkeyEnabled: true,
			deviceFingerprintEnabled: true,
		},
	},
	{
		key: 'psd2_sca',
		name: 'PSD2 SCA (Payment)',
		i18nKey: 'authConfig.profilePSD2',
		description:
			'PSD2 强客户认证。MFA 必选，5 次失败锁定，MFA 验证码 5min TTL，支付会话 5min 空闲超时。',
		descriptionI18nKey: 'authConfig.profilePSD2Desc',
		values: {
			minLength: 8,
			maxLength: 64,
			maxLoginAttempts: 5,
			lockDurationSec: 30,
			breachCheckEnabled: true,
			passkeyEnabled: true,
			deviceFingerprintEnabled: true,
		},
	},
	{
		key: 'hipaa',
		name: 'HIPAA NPRM 2024 (Healthcare)',
		i18nKey: 'authConfig.profileHIPAA',
		description:
			'HIPAA 安全规则 NPRM 2024。MFA 必选（所有 ePHI 访问），15min 空闲超时，审计日志 6 年留存。',
		descriptionI18nKey: 'authConfig.profileHIPPADesc',
		values: {
			minLength: 8,
			maxLength: 64,
			maxLoginAttempts: 5,
			lockDurationSec: 30,
			breachCheckEnabled: true,
			deviceFingerprintEnabled: true,
			captchaEnabled: true,
			pepperEnabled: true,
		},
	},
];

/** 获取 Profile 预设的独立 key 列表 */
export function getProfileKeys(): string[] {
	return COMPLIANCE_PROFILES.map((p) => p.key);
}

/** 根据 key 查找 Profile 预设 */
export function getProfileByKey(key: string): ProfilePreset | undefined {
	return COMPLIANCE_PROFILES.find((p) => p.key === key);
}
