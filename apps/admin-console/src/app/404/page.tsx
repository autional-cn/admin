import { useTranslation } from 'react-i18next';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router';

export default function NotFoundPage() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	return (
		<Result
			status="404"
			title="404"
			subTitle={t('notFound.description')}
			extra={
				<Button type="primary" onClick={() => navigate('/')}>
					{t('notFound.back')}
				</Button>
			}
		/>
	);
}
