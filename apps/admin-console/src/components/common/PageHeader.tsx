'use client';

import React from 'react';

interface PageHeaderProps {
	/** Page title */
	title: string;
	/** Action buttons area */
	actions?: React.ReactNode;
}

/**
 * Page header component.
 * Displays page title + right-side action buttons.
 */
export function PageHeader({ title, actions }: PageHeaderProps) {
	return (
		<div className="flex items-center justify-between mb-6">
			<h1 className="text-xl font-semibold">{title}</h1>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	);
}
