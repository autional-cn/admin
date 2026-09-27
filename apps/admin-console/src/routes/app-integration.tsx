import { Route, Navigate } from 'react-router';
import { RequireAuth } from '@autional-cn/shared';
import { ErrorBoundary } from '@autional-cn/ui';
import { DEFAULT_ERROR_BOUNDARY } from '../lib/error-boundary-config';

import ApplicationsPage from '../app/applications/page';
import PlatformPortalsPage from '../app/applications/platform-portals/page';
import AppRolesPage from '../app/applications/[id]/roles/page';
import IdentityProvidersPage from '../app/identity-providers/page';
import WebhooksPage from '../app/webhooks/page';

const Admin = ['super_admin', 'admin'] as const;
const Forbidden = <Navigate to="/403" replace />;

export const AppIntegrationRoutes = (
	<>
		<Route
			path="applications"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
						<ApplicationsPage />
					</ErrorBoundary>
				</RequireAuth>
			}
		/>
		<Route
			path="applications/platform-portals"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
						<PlatformPortalsPage />
					</ErrorBoundary>
				</RequireAuth>
			}
		/>
		<Route
			path="applications/:id/roles"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<AppRolesPage />
				</RequireAuth>
			}
		/>
		<Route
			path="identity-providers"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<IdentityProvidersPage />
				</RequireAuth>
			}
		/>
		<Route
			path="webhooks"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<WebhooksPage />
				</RequireAuth>
			}
		/>
	</>
);
