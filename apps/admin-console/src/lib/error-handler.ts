import { message } from '@/lib/antd-app';
import { extractApiErrorMessage } from '@autional-cn/shared';

const notify = (msg: string) => message.error(msg);

export function handleApiError(err: unknown, fallback?: string): void {
	const msg = extractApiErrorMessage(err, fallback || 'Operation failed');
	notify(msg);
}
