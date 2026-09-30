import { Route, Navigate } from 'react-router';
import { RequireAuth } from '@autional-cn/shared';
import { ErrorBoundary } from '@autional-cn/ui';
import { DEFAULT_ERROR_BOUNDARY } from '../lib/error-boundary-config';

import BrandingPage from '../app/branding/page';
import NotificationTemplatesPage from '../app/notifications/templates/page';
import AnnouncementsPage from '../app/notifications/announcements/page';
import NotificationStatsPage from '../app/notifications/stats/page';
import EventMappingsPage from '../app/notifications/event-mappings/page';
import GlobalVariablesPage from '../app/notifications/global-variables/page';
import CommunicationPage from '../app/communication/page';
import CommunicationTemplatesPage from '../app/communication/templates/page';
import CommunicationProvidersPage from '../app/communication/providers/page';
import BroadcastPage from '../app/notifications/broadcast/page';
import VerificationsPage from '../app/verifications/page';
import VerificationDetailPage from '../app/verifications/[id]/page';

const Admin = ['super_admin', 'admin'] as const;
const SecurityRead = ['super_admin', 'admin', 'security_admin'] as const;
const Forbidden = <Navigate to="/403" replace />;

export const ConfigRoutes = (
	<>
		<Route
			path="branding"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<BrandingPage />
				</RequireAuth>
			}
		/>
		<Route
			path="notifications/templates"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<NotificationTemplatesPage />
				</RequireAuth>
			}
		/>
		<Route
			path="notifications/announcements"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<AnnouncementsPage />
				</RequireAuth>
			}
		/>
		<Route
			path="notifications/stats"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<NotificationStatsPage />
				</RequireAuth>
			}
		/>
		<Route
			path="notifications/event-mappings"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<EventMappingsPage />
				</RequireAuth>
			}
		/>
		<Route
			path="notifications/global-variables"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<GlobalVariablesPage />
				</RequireAuth>
			}
		/>
		<Route
			path="communication"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<CommunicationPage />
				</RequireAuth>
			}
		/>
		<Route
			path="communication/templates"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<CommunicationTemplatesPage />
				</RequireAuth>
			}
		/>
		<Route
			path="communication/providers"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<CommunicationProvidersPage />
				</RequireAuth>
			}
		/>
		<Route
			path="notifications/broadcast"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<BroadcastPage />
				</RequireAuth>
			}
		/>
		<Route
			path="verifications"
			element={
				<RequireAuth allowedRoles={SecurityRead} fallback={Forbidden}>
					<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
						<VerificationsPage />
					</ErrorBoundary>
				</RequireAuth>
			}
		/>
		<Route
			path="verifications/:id"
			element={
				<RequireAuth allowedRoles={SecurityRead} fallback={Forbidden}>
					<VerificationDetailPage />
				</RequireAuth>
			}
		/>
	</>
);
