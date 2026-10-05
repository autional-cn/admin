'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, InputNumber, Button, Card, Select } from 'antd';
import { message } from '@/lib/antd-app';
import { useAdjustWalletBalance } from '@/hooks/use-wallet-admin';
import { handleApiError } from '@/lib/error-handler';
import { ConsolePageHeader } from '@autional-cn/ui';

// W1-01（A-363）：payload 与 AdjustBalanceRequest{amount*,type*,reason*} 逐键对齐——
// type 为必选控件（值域 deposit=增加 / withdraw=扣减，与服务端 switch 一致）；
// amount 显式 String(v)（DTO 为 string）；服务端强制 amount>0，负数文案已撤。
interface AdjustFormValues {
	userId: string;
	type: 'deposit' | 'withdraw';
	amount: number;
	reason: string;
}

export default function WalletAdjustPage() {
	const { t } = useTranslation();
	const adjustMut = useAdjustWalletBalance();
	const [form] = Form.useForm<AdjustFormValues>();

	const handleAdjust = async (values: AdjustFormValues) => {
		try {
			await adjustMut.mutateAsync({
				userId: values.userId,
				data: {
					amount: String(values.amount),
					type: values.type,
					reason: values.reason,
				},
			});
			message.success(t('walletAdjust.success'));
			form.resetFields();
		} catch (err) {
			handleApiError(err, t('walletAdjust.failed'));
		}
	};

	return (
		<div>
			<ConsolePageHeader title={t('walletAdjust.title')} />
			<Card className="max-w-lg">
				<Form form={form} layout="vertical" onFinish={handleAdjust}>
					<Form.Item
						name="userId"
						label={t('walletAdjust.fieldUserId')}
						rules={[{ required: true }]}
					>
						<Input placeholder={t('walletAdjust.fieldUserIdPlaceholder')} />
					</Form.Item>
					<Form.Item
						name="type"
						label={t('walletAdjust.fieldType')}
						rules={[{ required: true }]}
					>
						<Select
							placeholder={t('walletAdjust.fieldTypePlaceholder')}
							options={[
								{ value: 'deposit', label: t('walletAdjust.typeDeposit') },
								{ value: 'withdraw', label: t('walletAdjust.typeWithdraw') },
							]}
						/>
					</Form.Item>
					<Form.Item
						name="amount"
						label={t('walletAdjust.fieldAmount')}
						rules={[
							{ required: true },
							{ type: 'number', min: 0.01, message: t('walletAdjust.amountMustBePositive') },
						]}
					>
						<InputNumber
							className="w-full"
							precision={2}
							min={0.01}
							placeholder={t('walletAdjust.fieldAmountPlaceholder')}
						/>
					</Form.Item>
					<Form.Item
						name="reason"
						label={t('walletAdjust.fieldReason')}
						rules={[{ required: true }]}
					>
						<Input.TextArea rows={3} placeholder={t('walletAdjust.fieldReasonPlaceholder')} />
					</Form.Item>
					<Button type="primary" htmlType="submit" loading={adjustMut.isPending}>
						{t('walletAdjust.submit')}
					</Button>
				</Form>
			</Card>
		</div>
	);
}
