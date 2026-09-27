import { useEffect, useMemo } from 'react';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTheme } from '@autional-cn/ui';
import { useTranslation } from 'react-i18next';

export let message: MessageInstance;
export let modal: any;

export function AntdAppProvider({ children }: { children: React.ReactNode }) {
	const { theme: appTheme } = useTheme();
	const { i18n } = useTranslation();

	const locale = useMemo(() => (i18n.language === 'zh-CN' ? zhCN : enUS), [i18n.language]);

	return (
		<ConfigProvider
			locale={locale}
			theme={{
				algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
				token: {
					colorPrimary: '#003153',
					colorSuccess: '#52c41a',
					colorWarning: '#faad14',
					colorError: '#ff4d4f',
					colorInfo: '#1890ff',
					borderRadius: 6,
				},
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
