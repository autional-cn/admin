'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Table,
	Button,
	Modal,
	Form,
	Input,
	Select,
	InputNumber,
	Space,
	Popconfirm,
	DatePicker,
	Tag,
} from 'antd';
import { message } from '@/lib/antd-app';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
	useCoupons,
	useCreateCoupon,
	useUpdateCoupon,
	useDeleteCoupon,
	type CouponItem,
} from '@/hooks/use-wallet-admin';
import { handleApiError } from '@/lib/error-handler';
import { PageError } from '@/components/ui/page-status';
import type { CreateCouponRequest } from '@autional-cn/shared/generated/types';

export default function WalletCouponsPage() {
	const { t } = useTranslation();
	const { data: coupons = [], isLoading, error, refetch } = useCoupons();
	const createMut = useCreateCoupon();
	const updateMut = useUpdateCoupon();
	const deleteMut = useDeleteCoupon();

	const [modalOpen, setModalOpen] = useState(false);
	const [editing, setEditing] = useState<CouponItem | null>(null);
	const [form] = Form.useForm();

	const handleSave = async (values: Record<string, unknown>) => {
		try {
			const data = { ...values };
			if (data.validFrom) data.valid_from = data.validFrom;
			if (data.validUntil) data.valid_until = data.validUntil;
			if (editing) {
				await updateMut.mutateAsync({ id: editing.id, data });
				message.success(t('walletCoupons.updateSuccess'));
			} else {
				await createMut.mutateAsync(data as unknown as CreateCouponRequest);
				message.success(t('walletCoupons.createSuccess'));
			}
			setModalOpen(false);
			form.resetFields();
			setEditing(null);
		} catch (err) {
			handleApiError(err, t('walletCoupons.saveFailed'));
		}
	};

	const columns = [
		{ title: t('walletCoupons.colCode'), dataIndex: 'code', key: 'code' },
		{
			title: t('walletCoupons.colType'),
			dataIndex: 'type',
			key: 'type',
			render: (v: string) => {
				const labels: Record<string, string> = {
					fixed: t('walletCoupons.typeFixed'),
					percentage: t('walletCoupons.typePercentageShort'),
					free_shipping: t('walletCoupons.typeFreeShipping'),
				};
				return labels[v] ?? v;
			},
		},
		{
			title: t('walletCoupons.colValue'),
			dataIndex: 'value',
			key: 'value',
			render: (v: string, r: CouponItem) =>
				r.type === 'percentage' ? `${v}%` : `¥${parseFloat(v).toFixed(2)}`,
		},
		{
			title: t('walletCoupons.colMinAmount'),
			dataIndex: 'minAmount',
			key: 'minAmount',
			render: (v: string) => (v ? `¥${parseFloat(v).toFixed(2)}` : '-'),
		},
		{
			title: t('walletCoupons.colUsage'),
			key: 'usage',
			render: (_: unknown, r: CouponItem) => `${r.usedCount ?? 0} / ${r.maxUses ?? '∞'}`,
		},
		{
			title: t('walletCoupons.colValidity'),
			key: 'validity',
			render: (_: unknown, r: CouponItem) =>
				`${r.validFrom ? new Date(r.validFrom).toLocaleDateString() : '-'} ~ ${r.validUntil ? new Date(r.validUntil).toLocaleDateString() : '-'}`,
		},
		{
			title: t('walletCoupons.colStatus'),
			dataIndex: 'status',
			key: 'status',
			render: (v: string) => (
				<Tag color={v === 'active' ? 'success' : 'default'}>
					{v === 'active' ? t('walletCoupons.statusActive') : v}
				</Tag>
			),
		},
		{
			title: t('walletCoupons.colActions'),
			key: 'action',
			render: (_: unknown, record: CouponItem) => (
				<Space size="small">
					<Button
						type="link"
						icon={<EditOutlined />}
						onClick={() => {
							setEditing(record);
							form.setFieldsValue({
								...record,
								validFrom: record.validFrom ? undefined : undefined,
							});
							form.setFieldsValue(record);
							setModalOpen(true);
						}}
					>
						{t('walletCoupons.edit')}
					</Button>
					<Popconfirm
						title={t('walletCoupons.confirmDelete')}
						onConfirm={() => deleteMut.mutate(record.id)}
						okText={t('walletCoupons.ok')}
						cancelText={t('walletCoupons.cancel')}
					>
						<Button type="link" danger icon={<DeleteOutlined />}>
							{t('walletCoupons.delete')}
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div>
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
				<h1 className="text-xl font-semibold">{t('walletCoupons.title')}</h1>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => {
						setEditing(null);
						form.resetFields();
						setModalOpen(true);
					}}
				>
					{t('walletCoupons.createBtn')}
				</Button>
			</div>

			{error && (
				<PageError message={t('walletCoupons.loadError')} retry={refetch} className="mb-4" />
			)}

			<Table
				rowKey="id"
				columns={columns}
				dataSource={coupons}
				loading={isLoading}
				pagination={{ pageSize: 10 }}
				scroll={{ x: 800 }}
			/>

			<Modal
				title={editing ? t('walletCoupons.editTitle') : t('walletCoupons.createTitle')}
				open={modalOpen}
				onCancel={() => {
					setModalOpen(false);
					setEditing(null);
					form.resetFields();
				}}
				onOk={() => form.submit()}
				confirmLoading={createMut.isPending || updateMut.isPending}
				width={560}
				className="w-full max-w-[560px]"
			>
				<Form form={form} layout="vertical" onFinish={handleSave}>
					<Form.Item name="code" label={t('walletCoupons.fieldCode')} rules={[{ required: true }]}>
						<Input placeholder={t('walletCoupons.fieldCodePlaceholder')} disabled={!!editing} />
					</Form.Item>
					<Form.Item
						name="type"
						label={t('walletCoupons.fieldType')}
						rules={[{ required: true }]}
						initialValue="fixed"
					>
						<Select
							options={[
								{ value: 'fixed', label: t('walletCoupons.typeFixed') },
								{ value: 'percentage', label: t('walletCoupons.typePercentage') },
								{ value: 'free_shipping', label: t('walletCoupons.typeFreeShipping') },
							]}
						/>
					</Form.Item>
					<Form.Item
						name="value"
						label={t('walletCoupons.fieldValue')}
						rules={[{ required: true }]}
					>
						<InputNumber
							className="w-full"
							placeholder={t('walletCoupons.fieldValuePlaceholder')}
						/>
					</Form.Item>
					<Form.Item name="minAmount" label={t('walletCoupons.fieldMinAmount')}>
						<InputNumber
							className="w-full"
							precision={2}
							placeholder={t('walletCoupons.fieldMinAmountPlaceholder')}
						/>
					</Form.Item>
					<Space className="w-full" size="middle">
						<Form.Item name="maxUses" label={t('walletCoupons.fieldMaxUses')}>
							<InputNumber placeholder={t('walletCoupons.fieldMaxUsesPlaceholder')} min={1} />
						</Form.Item>
						<Form.Item name="validFrom" label={t('walletCoupons.fieldValidFrom')}>
							<DatePicker />
						</Form.Item>
						<Form.Item name="validUntil" label={t('walletCoupons.fieldValidUntil')}>
							<DatePicker />
						</Form.Item>
					</Space>
				</Form>
			</Modal>
		</div>
	);
}
