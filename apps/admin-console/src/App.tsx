import { Routes, Route, Outlet, Navigate, useParams } from 'react-router';
import { Layout } from 'antd';
import { ErrorBoundary } from '@autional-cn/ui';
import { DEFAULT_ERROR_BOUNDARY } from './lib/error-boundary-config';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Breadcrumb } from './components/layout/Breadcrumb';
import {
	AuthGuard,
	AdminGuard,
	UserMgmtGuard,
	SecurityGuard,
	OAuthCallbackPage,
	TenantSlugProvider,
	useBootstrap,
	useBranding,
	BrandingInitializer,
} from '@autional-cn/shared';

const Forbidden = <Navigate to="/403" replace />;

const KNOWN_PATHS = new Set([
	'oauth-clients',
	'api-keys',
	'usage',
	'logs',
	'traces',
	'request-logs',
	'sdks',
	'team',
	'status',
	'api-docs',
	'applications',
	'identity-providers',
	'webhooks',
	'users',
	'roles',
	'permissions',
	'sessions',
	'secrets',
	'profiles',
	'departments',
	'members',
	'agents',
	'robots',
	'devices',
	'policies',
	'security',
	'data-classification',
	'abac-policies',
	'role-activations',
	'abac-policies',
	'branding',
	'notifications',
	'communication',
	'audit-logs',
	'audit',
	'compliance',
	'verifications',
	'billing',
	'storage',
	'wallets',
	'points',
	'pay',
	'wallet',
	'settings',
	'trial',
]);

// Pages
import DashboardPage from './app/page';
import UsersPage from './app/users/page';
import UserDetailPage from './app/users/[id]/page';
import RolesPage from './app/roles/page';
import PermissionsPage from './app/permissions/page';
import AbacPoliciesPage from './app/abac-policies/page';
import RoleActivationsPage from './app/role-activations/page';
import SessionsPage from './app/sessions/page';
import SecretsPage from './app/secrets/page';
import SecretPolicyPage from './app/secrets/policy/page';
import ProfilesPage from './app/profiles/page';
import ProfileDetailPage from './app/profiles/[userId]/page';
import ProfilePolicyPage from './app/profiles/policy/page';
import FieldSchemaPage from './app/profiles/field-schemas/page';
import ProfilesApprovalPage from './app/profiles/approval/page';
import ProfileWebhookPage from './app/profiles/webhook/page';
import ForbiddenPage from './app/403/page';
import NotFoundPage from './app/404/page';
import SettingsPage from './app/settings/page';

import { SecurityRoutes } from './routes/security';
import { NhiRoutes } from './routes/nhi';
import { OrganizationRoutes } from './routes/organization';
import { AppIntegrationRoutes } from './routes/app-integration';
import { FinanceRoutes } from './routes/finance';
import { AuditComplianceRoutes } from './routes/audit-compliance';
import { ConfigRoutes } from './routes/config';
import { DeveloperRoutes } from './routes/developer';

const { Content } = Layout;

function SlugAwareLayoutWrapper() {
	const { tenantSlug } = useParams<{ tenantSlug?: string }>();
	const effectiveSlug =
		tenantSlug && !KNOWN_PATHS.has(tenantSlug.split('/')[0]) ? tenantSlug : undefined;
	return (
		<TenantSlugProvider value={effectiveSlug}>
			<LayoutWrapperInner />
		</TenantSlugProvider>
	);
}

function LayoutWrapperInner() {
	useBootstrap();
	return (
		<Layout className="h-screen overflow-hidden">
			<Sidebar />
			<Layout>
				<Header />
				<Content className="overflow-auto m-6 p-6 bg-[var(--color-bg-surface)] rounded-lg h-[calc(100vh-64px)]">
					<div aria-live="polite" aria-atomic="true" className="sr-only" id="status-announcer" />
					<Breadcrumb />
					<Outlet />
				</Content>
			</Layout>
		</Layout>
	);
}

export default function App() {
	useBranding();

	return (
		<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
			<BrandingInitializer />
			<Routes>
				<Route path="/oauth/callback" element={<OAuthCallbackPage />} />
				<Route path="/403" element={<SlugAwareLayoutWrapper />}>
					<Route index element={<ForbiddenPage />} />
				</Route>

				{/* Legacy no-slug routes FIRST — 显式绝对路径，确保 /users /roles 等
				    静态路径优先于 /:tenantSlug/* 动态路由匹配（React Router specificity） */}
				<Route path="/" element={<SlugAwareLayoutWrapper />}>
					{appRoutes()}
				</Route>

				{/* Multi-tenant slug routes */}
				<Route path="/:tenantSlug/*" element={<SlugAwareLayoutWrapper />}>
					{appRoutes()}
				</Route>
			</Routes>
		</ErrorBoundary>
	);
}

function appRoutes() {
	return (
		<>
			<Route
				index
				element={
					<AuthGuard>
						<DashboardPage />
					</AuthGuard>
				}
			/>

			<Route
				path="users"
				element={
					<UserMgmtGuard fallback={Forbidden}>
						<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
							<UsersPage />
						</ErrorBoundary>
					</UserMgmtGuard>
				}
			/>
			<Route
				path="users/:id"
				element={
					<UserMgmtGuard fallback={Forbidden}>
						<UserDetailPage />
					</UserMgmtGuard>
				}
			/>
			<Route
				path="roles"
				element={
					<AdminGuard fallback={Forbidden}>
						<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
							<RolesPage />
						</ErrorBoundary>
					</AdminGuard>
				}
			/>
			<Route
				path="permissions"
				element={
					<AdminGuard fallback={Forbidden}>
						<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
							<PermissionsPage />
						</ErrorBoundary>
					</AdminGuard>
				}
			/>
			<Route
				path="abac-policies"
				element={
					<AdminGuard fallback={Forbidden}>
						<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
							<AbacPoliciesPage />
						</ErrorBoundary>
					</AdminGuard>
				}
			/>
			<Route
				path="role-activations"
				element={
					<AdminGuard fallback={Forbidden}>
						<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
							<RoleActivationsPage />
						</ErrorBoundary>
					</AdminGuard>
				}
			/>
			<Route
				path="sessions"
				element={
					<AdminGuard fallback={Forbidden}>
						<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
							<SessionsPage />
						</ErrorBoundary>
					</AdminGuard>
				}
			/>
			<Route
				path="secrets"
				element={
					<AdminGuard fallback={Forbidden}>
						<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
							<SecretsPage />
						</ErrorBoundary>
					</AdminGuard>
				}
			/>
			<Route
				path="secrets/policy"
				element={
					<AdminGuard fallback={Forbidden}>
						<SecretPolicyPage />
					</AdminGuard>
				}
			/>
			<Route
				path="profiles"
				element={
					<AdminGuard fallback={Forbidden}>
						<ProfilesPage />
					</AdminGuard>
				}
			/>
			<Route
				path="profiles/:userId"
				element={
					<AdminGuard fallback={Forbidden}>
						<ProfileDetailPage />
					</AdminGuard>
				}
			/>
			<Route
				path="profiles/policy"
				element={
					<AdminGuard fallback={Forbidden}>
						<ProfilePolicyPage />
					</AdminGuard>
				}
			/>
			<Route
				path="profiles/field-schemas"
				element={
					<AdminGuard fallback={Forbidden}>
						<FieldSchemaPage />
					</AdminGuard>
				}
			/>
			<Route
				path="profiles/approval"
				element={
					<AdminGuard fallback={Forbidden}>
						<ProfilesApprovalPage />
					</AdminGuard>
				}
			/>
			<Route
				path="profiles/webhook"
				element={
					<AdminGuard fallback={Forbidden}>
						<ProfileWebhookPage />
					</AdminGuard>
				}
			/>

			{OrganizationRoutes}
			{AppIntegrationRoutes}
			{NhiRoutes}
			{SecurityRoutes}
			{ConfigRoutes}
			{DeveloperRoutes}
			{AuditComplianceRoutes}
			{FinanceRoutes}
			<Route
				path="settings"
				element={
					<AuthGuard>
						<ErrorBoundary {...DEFAULT_ERROR_BOUNDARY}>
							<SettingsPage />
						</ErrorBoundary>
					</AuthGuard>
				}
			/>
			<Route path="404" element={<NotFoundPage />} />
			<Route path="*" element={<NotFoundPage />} />
		</>
	);
}
