'use client';

import React, { useState } from 'react';
import { Button, Space, Tag, Modal, Form, Input, Select, Drawer, Switch, Checkbox, Divider, Typography, Empty, Spin } from 'antd';
import { message, modal } from '@/lib/antd-app';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SafetyOutlined,
	CopyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
	useRoles,
	useCreateRole,
	useUpdateRole,
	useDeleteRole,
	useRolePermissions,
	useAssignRolePermissions,
	useRemoveRolePermissions,
} from '@/hooks/use-roles';
import type { RoleRecord } from '@/hooks/use-roles';
import { useCloneRole } from '@/hooks/use-role-hierarchy';
import { usePermissions } from '@/hooks/use-permissions';
import type { PermissionItem } from '@/hooks/use-permissions';
import { handleApiError } from '@/lib/error-handler';
import { PageError, DataTable } from '@autional-cn/ui/antd';
import { createRoleSchema } from '@/lib/validators';

const { Title, Text } = Typography;

const CATEGORY_LABELS: Record<string, string> = {
	identity: 'roles.category.identity',
	user: 'roles.category.user',
	security: 'roles.category.security',
	audit: 'roles.category.audit',
	system: 'roles.category.system',
};

const DATA_SCOPE_COLORS: Record<string, string> = {
	all: 'red',
	tenant: 'blue',
	department: 'green',
	self: 'default',
};

const DATA_SCOPE_KEYS: Record<string, string> = {
	all: 'roles.dataScopeAll',
	tenant: 'roles.dataScopeTenant',
	department: 'roles.dataScopeDepartment',
	self: 'roles.dataScopeSelf',
};

const DEFAULT_CATEGORY_KEYS = [
	'roles.category.identity',
	'roles.category.user',
	'roles.category.security',
	'roles.category.audit',
	'roles.category.system',
];

export default function RolesPage() {
	const { t } = useTranslation();
	const [modalVisible, setModalVisible] = useState(false);
	const [editing, setEditing] = useState<RoleRecord | null>(null);
	const [form] = Form.useForm();

	const [drawerVisible, setDrawerVisible] = useState(false);
	const [currentRole, setCurrentRole] = useState<RoleRecord | null>(null);
	const [rolePermissionIds, setRolePermissionIds] = useState<Set<string>>(new Set());
	const [savingPermissions, setSavingPermissions] = useState(false);

	const [cloneModalVisible, setCloneModalVisible] = useState(false);
	const [cloneTarget, setCloneTarget] = useState<RoleRecord | null>(null);
	const [cloneForm] = Form.useForm();

	const handleClone = async (record: RoleRecord) => {
		setCloneTarget(record);
		cloneForm.setFieldsValue({
			code: `${record.code}_copy`,
			name: `${record.name} ${t('roles.copySuffix')}`,
		});
		setCloneModalVisible(true);
	};

	const handleCloneConfirm = async (values: any) => {
		if (!cloneTarget) return;
		try {
			await cloneRoleMut.mutateAsync({
				roleId: cloneTarget.id,
				data: { code: values.code, name: values.name },
			});
			message.success(t('roles.cloneSuccess'));
			setCloneModalVisible(false);
			setCloneTarget(null);
			cloneForm.resetFields();
		} catch (err) {
			handleApiError(err, t('roles.cloneError'));
		}
	};

	const { data: roles = [], isLoading, error: rolesError, refetch: refetchRoles } = useRoles();
	const {
		data: allPermissions = [],
		isLoading: permLoading,
		error: permError,
		refetch: refetchPerms,
	} = usePermissions();
	const { data: rolePerms = [] } = useRolePermissions(currentRole?.id || '');

	const createRoleMut = useCreateRole();
	const updateRoleMut = useUpdateRole();
	const deleteRoleMut = useDeleteRole();
	const cloneRoleMut = useCloneRole();
	const assignMut = useAssignRolePermissions();
	const removeMut = useRemoveRolePermissions();

	React.useEffect(() => {
		if (rolePerms.length > 0) {
			setRolePermissionIds(new Set((rolePerms as unknown as PermissionItem[]).map((p) => p.id)));
		}
	}, [rolePerms]);

	const handleSave = async (values: any) => {
		const result = createRoleSchema.passthrough().safeParse(values);
		if (!result.success) {
			result.error.issues.forEach((i) => message.error(i.message));
			return;
		}
		try {
			if (editing) {
				await updateRoleMut.mutateAsync({ id: editing.id, data: result.data });
				message.success(t('roles.updateSuccess'));
			} else {
				await createRoleMut.mutateAsync(result.data);
				message.success(t('roles.createSuccess'));
			}
			setModalVisible(false);
			setEditing(null);
			form.resetFields();
		} catch (err) {
			handleApiError(err, t('roles.saveFailed'));
		}
	};

	const handleDelete = async (id: string) => {
		modal.confirm({
			title: t('roles.confirmDelete'),
			content: t('roles.deleteWarning'),
			okText: t('common.delete'),
			okButtonProps: { danger: true },
			onOk: async () => {
				try {
					await deleteRoleMut.mutateAsync(id);
					message.success(t('roles.deleteSuccess'));
				} catch (err) {
					handleApiError(err, t('roles.deleteError'));
				}
			},
		});
	};

	const openPermissionDrawer = (role: RoleRecord) => {
		setCurrentRole(role);
		setDrawerVisible(true);
		setRolePermissionIds(new Set());
	};

	const togglePermission = (permissionId: string, checked: boolean) => {
		setRolePermissionIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(permissionId);
			else next.delete(permissionId);
			return next;
		});
	};

	const toggleCategory = (category: string, checked: boolean) => {
		const idsInCategory = allPermissions
			.filter((p: PermissionItem) => (CATEGORY_LABELS[p.category] || p.category) === category)
			.map((p: PermissionItem) => p.id);
		setRolePermissionIds((prev) => {
			const next = new Set(prev);
			idsInCategory.forEach((id) => {
				if (checked) next.add(id);
				else next.delete(id);
			});
			return next;
		});
	};

	const isCategoryAllChecked = (category: string) => {
		const idsInCategory = allPermissions
			.filter((p: PermissionItem) => (CATEGORY_LABELS[p.category] || p.category) === category)
			.map((p: PermissionItem) => p.id);
		if (idsInCategory.length === 0) return false;
		return idsInCategory.every((id) => rolePermissionIds.has(id));
	};

	const isCategoryIndeterminate = (category: string) => {
		const idsInCategory = allPermissions
			.filter((p: PermissionItem) => (CATEGORY_LABELS[p.category] || p.category) === category)
			.map((p: PermissionItem) => p.id);
		const checkedCount = idsInCategory.filter((id) => rolePermissionIds.has(id)).length;
		return checkedCount > 0 && checkedCount < idsInCategory.length;
	};

	const handleSavePermissions = async () => {
		if (!currentRole) return;
		setSavingPermissions(true);
		try {
			const originalIds = new Set((rolePerms as unknown as PermissionItem[]).map((p) => p.id));
			const toAdd: string[] = [];
			const toRemove: string[] = [];

			rolePermissionIds.forEach((id) => {
				if (!originalIds.has(id)) toAdd.push(id);
			});
			originalIds.forEach((id) => {
				if (!rolePermissionIds.has(id)) toRemove.push(id);
			});

			const calls: Promise<unknown>[] = [];
			if (toAdd.length > 0)
				calls.push(
					assignMut.mutateAsync({ roleId: currentRole.id, data: { permission_ids: toAdd } }),
				);
			if (toRemove.length > 0)
				calls.push(
					removeMut.mutateAsync({ roleId: currentRole.id, data: { permission_ids: toRemove } }),
				);
			await Promise.all(calls);

			message.success(t('roles.permissionsSaved'));
			setDrawerVisible(false);
		} catch (err) {
			handleApiError(err, t('roles.permissionsSaveError'));
		} finally {
			setSavingPermissions(false);
		}
	};

	const groupedPermissions = React.useMemo(() => {
		const groups: Record<string, PermissionItem[]> = {};
		allPermissions.forEach((p: PermissionItem) => {
			const cat = CATEGORY_LABELS[p.category] || p.category || 'roles.category.other';
			if (!groups[cat]) groups[cat] = [];
			groups[cat].push(p);
		});
		const ordered: Record<string, PermissionItem[]> = {};
		DEFAULT_CATEGORY_KEYS.forEach((cat) => {
			if (groups[cat]) ordered[cat] = groups[cat];
		});
		Object.keys(groups).forEach((cat) => {
			if (!ordered[cat]) ordered[cat] = groups[cat];
		});
		return ordered;
	}, [allPermissions]);

	const columns = [
		{
			title: t('roles.column.code'),
			dataIndex: 'code',
			key: 'code',
			render: (v: string) => <Tag>{v}</Tag>,
		},
		{ title: t('roles.column.name'), dataIndex: 'name', key: 'name' },
		{
			title: t('roles.dataScope'),
			dataIndex: 'data_scope',
			key: 'data_scope',
			render: (v: string) => (
				<Tag color={DATA_SCOPE_COLORS[v] || 'default'}>
					{DATA_SCOPE_KEYS[v] ? t(DATA_SCOPE_KEYS[v]) : v || '-'}
				</Tag>
			),
		},
		{
			title: t('roles.column.description'),
			dataIndex: 'description',
			key: 'description',
			ellipsis: true,
		},
		{
			title: t('roles.column.permissionCount'),
			dataIndex: 'permissionCount',
			key: 'permissionCount',
			render: (v: number) => (v !== undefined ? v : '-'),
		},
		{
			title: t('common.actions'),
			key: 'action',
			render: (_: any, record: RoleRecord) => (
				<Space size="small">
					<Button
						type="link"
						icon={<EditOutlined />}
						onClick={() => {
							setEditing(record);
							form.setFieldsValue(record);
							setModalVisible(true);
						}}
					>
						{t('common.edit')}
					</Button>
					<Button
						type="link"
						icon={<SafetyOutlined />}
						onClick={() => openPermissionDrawer(record)}
					>
						{t('roles.assignPermissions')}
					</Button>
					<Button type="link" icon={<CopyOutlined />} onClick={() => handleClone(record)}>
						{t('roles.clone')}
					</Button>
					<Button
						type="link"
						danger
						icon={<DeleteOutlined />}
						onClick={() => handleDelete(record.id)}
					>
						{t('common.delete')}
					</Button>
				</Space>
			),
		},
	];

	return (
		<div>
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
				<h1 className="text-xl font-semibold">{t('nav.roles')}</h1>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => {
						setEditing(null);
						form.resetFields();
						setModalVisible(true);
					}}
				>
					{t('roles.createRole')}
				</Button>
			</div>

			{rolesError && (
				<PageError message={t('roles.loadError')} retry={refetchRoles} className="mb-4" />
			)}
			{permError && (
				<PageError
					message={t('roles.permissionsLoadError')}
					retry={refetchPerms}
					className="mb-4"
				/>
			)}

			<DataTable
				rowKey="id"
				columns={columns}
				dataSource={roles}
				loading={isLoading}
				pagination={{ pageSize: 10 }}
				locale={{ emptyText: <Empty description={t('roles.noRoles')} /> }}
				scroll={{ x: 800 }}
			/>

			<Modal
				title={editing ? t('roles.editRole') : t('roles.createRole')}
				open={modalVisible}
				onCancel={() => {
					setModalVisible(false);
					setEditing(null);
					form.resetFields();
				}}
				onOk={() => form.submit()}
				destroyOnHidden
				className="w-full max-w-[560px]"
			>
				<Form form={form} layout="vertical" onFinish={handleSave}>
					<Form.Item name="code" label={t('roles.column.code')} rules={[{ required: true }]}>
						<Input placeholder={t('roles.codePlaceholder')} disabled={!!editing} />
					</Form.Item>
					<Form.Item name="name" label={t('roles.column.name')} rules={[{ required: true }]}>
						<Input placeholder={t('roles.namePlaceholder')} />
					</Form.Item>
					<Form.Item name="data_scope" label={t('roles.dataScope')} initialValue="self">
						<Select
							options={[
								{ value: 'all', label: t('roles.dataScopeAll') },
								{ value: 'tenant', label: t('roles.dataScopeTenant') },
								{ value: 'department', label: t('roles.dataScopeDepartment') },
								{ value: 'self', label: t('roles.dataScopeSelf') },
							]}
						/>
					</Form.Item>
					<Form.Item name="description" label={t('roles.column.description')}>
						<Input.TextArea rows={3} placeholder={t('roles.descriptionPlaceholder')} />
					</Form.Item>
				</Form>
			</Modal>

			<Drawer
				title={
					currentRole
						? t('roles.permissionsDrawer', { name: currentRole.name })
						: t('roles.assignPermissions')
				}
				size={560}
				open={drawerVisible}
				onClose={() => setDrawerVisible(false)}
				className="!w-full sm:!w-[480px]"
				footer={
					<Space className="w-full justify-end">
						<Button onClick={() => setDrawerVisible(false)}>{t('common.cancel')}</Button>
						<Button type="primary" loading={savingPermissions} onClick={handleSavePermissions}>
							{t('common.save')}
						</Button>
					</Space>
				}
			>
				{permLoading ? (
					<div className="flex items-center justify-center py-12">
						<Spin />
					</div>
				) : (
					<div className="space-y-6">
						{Object.keys(groupedPermissions).length === 0 && (
							<Empty description={t('roles.noPermissions')} />
						)}
						{Object.entries(groupedPermissions).map(([category, permissions]) => (
							<div key={category}>
								<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
									<Title level={5} className="!mb-0">
										{t(category)}
									</Title>
									<Checkbox
										checked={isCategoryAllChecked(category)}
										indeterminate={isCategoryIndeterminate(category)}
										onChange={(e) => toggleCategory(category, e.target.checked)}
									>
										{t('roles.selectAll')}
									</Checkbox>
								</div>
								<div className="space-y-2">
									{permissions.map((perm) => (
										<div
											key={perm.id}
											className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded border border-gray-100 px-3 py-2 hover:bg-gray-50"
										>
											<div className="flex-1 min-w-0 mr-4">
												<div className="font-medium text-sm">{perm.name}</div>
												<Text type="secondary" className="text-xs">
													{perm.code}
												</Text>
												{perm.description && (
													<div className="text-xs text-gray-400 mt-0.5">{perm.description}</div>
												)}
											</div>
											<Switch
												checkedChildren={t('roles.permissionAllowed')}
												unCheckedChildren={t('roles.permissionDenied')}
												checked={rolePermissionIds.has(perm.id)}
												onChange={(checked) => togglePermission(perm.id, checked)}
											/>
										</div>
									))}
								</div>
								<Divider className="!my-4" />
							</div>
						))}
					</div>
				)}
			</Drawer>

			<Modal
				title={t('roles.cloneRole')}
				open={cloneModalVisible}
				onCancel={() => {
					setCloneModalVisible(false);
					setCloneTarget(null);
					cloneForm.resetFields();
				}}
				onOk={() => cloneForm.submit()}
				destroyOnHidden
				className="w-full max-w-[560px]"
			>
				<Form form={cloneForm} layout="vertical" onFinish={handleCloneConfirm}>
					<Form.Item name="code" label={t('roles.column.code')} rules={[{ required: true }]}>
						<Input placeholder={t('roles.cloneCodePlaceholder')} />
					</Form.Item>
					<Form.Item name="name" label={t('roles.column.name')} rules={[{ required: true }]}>
						<Input placeholder={t('roles.cloneNamePlaceholder')} />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
