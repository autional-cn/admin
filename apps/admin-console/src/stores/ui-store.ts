'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BreadcrumbItem {
	label: string;
	path?: string;
}

interface UIState {
	sidebarCollapsed: boolean;
	locale: 'zh-CN' | 'en-US';
	pageTitle: string;
	breadcrumbs: BreadcrumbItem[];

	toggleSidebar: () => void;
	setSidebarCollapsed: (collapsed: boolean) => void;
	setLocale: (locale: 'zh-CN' | 'en-US') => void;
	setPageTitle: (title: string) => void;
	setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}

/**
 * UI global state (Zustand + persist)
 * Persists user preferences (sidebar, locale), not page-level state
 */
export const useUIStore = create<UIState>()(
	persist(
		(set) => ({
			sidebarCollapsed: false,
			locale: 'zh-CN',
			pageTitle: '',
			breadcrumbs: [],

			toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

			setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

			setLocale: (locale) => set({ locale }),

			setPageTitle: (pageTitle) => set({ pageTitle }),

			setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
		}),
		{
			name: 'admin-console-ui-v2',
			partialize: (state) => ({
				sidebarCollapsed: state.sidebarCollapsed,
				locale: state.locale,
			}),
		},
	),
);
