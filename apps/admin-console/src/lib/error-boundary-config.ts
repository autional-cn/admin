import type { ComponentProps } from 'react';
import { ErrorBoundary } from '@autional-cn/ui';

export const DEFAULT_ERROR_BOUNDARY: Omit<ComponentProps<typeof ErrorBoundary>, 'children'> = {
	devMode: import.meta.env.DEV,
	title: '出现错误',
	message: '发生意外错误，请重试。',
	retryLabel: '重试',
};
