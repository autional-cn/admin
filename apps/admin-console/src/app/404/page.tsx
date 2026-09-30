import { useTranslation } from 'react-i18next';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router';
import { useTenantSlug } from '@autional-cn/shared';
import { buildNavHref } from '@/lib/nav';

export default function NotFoundPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const tenantSlug = useTenantSlug();
	return (
		<Result
			status="404"
			title="404"
			subTitle={t('notFound.description')}
			extra={
				<Button type="primary" onClick={() => navigate(buildNavHref('/', tenantSlug))}>
					{t('notFound.back')}
				</Button>
			}
		/>
	);
}
