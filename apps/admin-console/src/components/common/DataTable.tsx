'use client';

import React, { useRef } from 'react';
import { Table, Input, type TableProps, type PaginationProps } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface DataTableProps<T extends Record<string, any>> {
	/** Table column definitions */
	columns: TableProps<T>['columns'];
	/** Data source */
	dataSource: T[];
	/** Loading state */
	loading?: boolean;
	/** Pagination config */
	pagination?: PaginationProps | false;
	/** Row selection config */
	rowSelection?: TableProps<T>['rowSelection'];
	/** Search callback */
	onSearch?: (keyword: string) => void;
	/** Search placeholder text */
	searchPlaceholder?: string;
	/** Additional table props */
	tableProps?: Omit<
		TableProps<T>,
		'columns' | 'dataSource' | 'loading' | 'rowSelection' | 'pagination'
	>;
}

/**
 * Unified table wrapper component.
 * Built-in search bar + pagination + row selection, based on Ant Design Table.
 */
export function DataTable<T extends Record<string, any>>({
	columns,
	dataSource,
	loading,
	pagination,
	rowSelection,
	onSearch,
	searchPlaceholder,
	tableProps,
}: DataTableProps<T>) {
	const { t } = useTranslation();
	const [keyword, setKeyword] = React.useState('');
	const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	const handleSearch = (value: string) => {
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		setKeyword(value);
		onSearch?.(value);
	};

	return (
		<div className="space-y-4">
			{onSearch && (
				<div className="flex justify-end">
					<Input.Search
						placeholder={searchPlaceholder ?? t('dataTable.searchPlaceholder')}
						allowClear
						value={keyword}
						onChange={(e) => {
							setKeyword(e.target.value);
							if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
							searchTimerRef.current = setTimeout(() => {
								onSearch?.(e.target.value);
							}, 300);
						}}
						onSearch={handleSearch}
						onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
						className="w-70"
						prefix={<SearchOutlined />}
					/>
				</div>
			)}

			<Table<T>
				columns={columns}
				dataSource={dataSource}
				loading={loading}
				rowSelection={rowSelection}
				pagination={
					pagination === false
						? false
						: {
								showSizeChanger: true,
								pageSizeOptions: [10, 20, 50, 100],
								showTotal: (total) => t('dataTable.totalItems', { total }),
								...pagination,
							}
				}
				rowKey="id"
				scroll={{ x: 'max-content' }}
				{...tableProps}
			/>
		</div>
	);
}
