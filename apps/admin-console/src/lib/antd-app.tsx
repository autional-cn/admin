import { useEffect, useMemo } from 'react';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTheme } from '@autional-cn/ui';
import { useTranslation } from 'react-i18next';
// antd 主题由设计系统下发，不在这里手写色值。
// 此前这里硬编码了 5 个色值（#003153 / #52c41a / #faad14 / #ff4d4f / #1890ff）与 borderRadius: 6，
// 那是 ui 仓库 KI-011 记录的问题：ui 早已生成 packages/tokens/dist/antd-theme.js，
// 但没有站点消费它，于是令牌变更无法传导、各控制台各自漂移。
// 注意 borderRadius 由 6 变为桥接产物里的 8（来自令牌 radius.sm），这是有意的可见变更。
import antdTheme from '@autional-cn/tokens/antd-theme';

export let message: MessageInstance;
export let modal: any;

export function AntdAppProvider({ children }: { children: React.ReactNode }) {
	const { theme: appTheme } = useTheme();
	const { i18n } = useTranslation();

	const locale = useMemo(() => (i18n.language === 'zh-CN' ? zhCN : enUS), [i18n.language]);
	const isDark = appTheme === 'dark';

	return (
		<ConfigProvider
			locale={locale}
			theme={{
				algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
				token: (isDark ? antdTheme.dark : antdTheme.light).token,
			}}
		>
			<AntdApp>
				<AntdAppInit />
				{children}
			</AntdApp>
		</ConfigProvider>
	);
}

function AntdAppInit() {
	const app = AntdApp.useApp();
	useEffect(() => {
		message = app.message;
		modal = app.modal;
	}, [app]);
	return null;
}
