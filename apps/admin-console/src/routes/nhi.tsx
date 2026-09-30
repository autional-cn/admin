import { Route } from 'react-router';
import { RequireAuth } from '@autional-cn/shared';
import { ErrorBoundary } from '@autional-cn/ui';
import { DEFAULT_ERROR_BOUNDARY } from '../lib/error-boundary-config';
import { ForbiddenRedirect } from '../components/common/ForbiddenRedirect';

import AgentsPage from '../app/agents/page';
import AgentDetailPage from '../app/agents/[id]/page';
import RobotsPage from '../app/robots/page';
import RobotDetailPage from '../app/robots/[id]/page';
import DevicesPage from '../app/devices/page';
import DeviceDetailPage from '../app/devices/[id]/page';
import NhiPolicyPage from '../app/policies/nhi/page';

const Admin = ['super_admin', 'admin'] as const;

export const NhiRoutes = (
	<>
		<Route
			path="agents"
			element={
				<RequireAuth allowedRoles={Admin} fallback={<ForbiddenRedirect />}>
					<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
						<AgentsPage />
					</ErrorBoundary>
				</RequireAuth>
			}
		/>
		<Route
			path="agents/:id"
			element={
				<RequireAuth allowedRoles={Admin} fallback={<ForbiddenRedirect />}>
					<AgentDetailPage />
				</RequireAuth>
			}
		/>
		<Route
			path="robots"
			element={
				<RequireAuth allowedRoles={Admin} fallback={<ForbiddenRedirect />}>
					<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
						<RobotsPage />
					</ErrorBoundary>
				</RequireAuth>
			}
		/>
		<Route
			path="robots/:id"
			element={
				<RequireAuth allowedRoles={Admin} fallback={<ForbiddenRedirect />}>
					<RobotDetailPage />
				</RequireAuth>
			}
		/>
		<Route
			path="devices"
			element={
				<RequireAuth allowedRoles={Admin} fallback={<ForbiddenRedirect />}>
					<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
						<DevicesPage />
					</ErrorBoundary>
				</RequireAuth>
			}
		/>
		<Route
			path="devices/:id"
			element={
				<RequireAuth allowedRoles={Admin} fallback={<ForbiddenRedirect />}>
					<DeviceDetailPage />
				</RequireAuth>
			}
		/>
		<Route
			path="policies/nhi"
			element={
				<RequireAuth allowedRoles={Admin} fallback={<ForbiddenRedirect />}>
					<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
						<NhiPolicyPage />
					</ErrorBoundary>
				</RequireAuth>
			}
		/>
	</>
);
