'use client';

import { Button, Empty, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

/** Full-page loading placeholder (centered Spin) */
export function PageLoading({ tip }: { tip?: string }) {
	const { t } = useTranslation();
	return (
		<div className="flex h-64 items-center justify-center">
			<Spin size="large" tip={tip ?? t('pageStatus.loading')} />
		</div>
	);
}

/** Full-page error placeholder (with retry) */
export function PageError({
	message,
	retry,
	className = '',
}: {
	message?: string;
	retry?: () => void;
	className?: string;
}) {
	const { t } = useTranslation();
	return (
		<div className={`flex h-64 flex-col items-center justify-center gap-4 ${className}`}>
			<Empty
				description={message ?? t('pageStatus.loadError')}
				image={Empty.PRESENTED_IMAGE_SIMPLE}
			/>
			{retry && (
				<Button icon={<ReloadOutlined />} onClick={retry}>
					{t('pageStatus.retry')}
				</Button>
			)}
		</div>
	);
}
