import { Route, Navigate } from 'react-router';
import { RequireAuth } from '@autional-cn/shared';
import { ErrorBoundary } from '@autional-cn/ui';
import { DEFAULT_ERROR_BOUNDARY } from '../lib/error-boundary-config';

import DepartmentsPage from '../app/departments/page';
import MembersPage from '../app/members/page';
import ApprovalPage from '../app/members/approval/page';

const Admin = ['super_admin', 'admin'] as const;
const Forbidden = <Navigate to="/403" replace />;

export const OrganizationRoutes = (
	<>
		<Route
			path="departments"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
						<DepartmentsPage />
					</ErrorBoundary>
				</RequireAuth>
			}
		/>
		<Route
			path="members"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
						<MembersPage />
					</ErrorBoundary>
				</RequireAuth>
			}
		/>
		<Route
			path="members/approval"
			element={
				<RequireAuth allowedRoles={Admin} fallback={Forbidden}>
					<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
						<ApprovalPage />
					</ErrorBoundary>
				</RequireAuth>
			}
		/>
	</>
);
