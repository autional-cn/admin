'use client';

import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useTenantSlug } from '@autional-cn/shared';
import { buildNavHref } from '@/lib/nav';

export default function ForbiddenPage() {
	const navigate = useNavigate();
	const tenantSlug = useTenantSlug();
	const { t } = useTranslation();

	return (
		<Result
			status="403"
			title={t('403.title')}
			subTitle={t('403.subtitle')}
			extra={
				<Button type="primary" onClick={() => navigate(buildNavHref('/', tenantSlug))}>
					{t('403.backHome')}
				</Button>
			}
		/>
	);
}
