import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../common/DataTable';

describe('DataTable', () => {
	const columns = [
		{ title: '名称', dataIndex: 'name', key: 'name' },
		{ title: '状态', dataIndex: 'status', key: 'status' },
	];

	it('renders table with data', () => {
		const data = [
			{ id: '1', name: 'Alice', status: 'active' },
			{ id: '2', name: 'Bob', status: 'inactive' },
		];

		render(<DataTable columns={columns} dataSource={data} />);

		expect(screen.getByText('Alice')).toBeInTheDocument();
		expect(screen.getByText('Bob')).toBeInTheDocument();
		expect(screen.getAllByText('名称').length).toBeGreaterThan(0);
		expect(screen.getAllByText('状态').length).toBeGreaterThan(0);
	});

	it('shows pagination total text', () => {
		const data = Array.from({ length: 25 }, (_, i) => ({
			id: `${i + 1}`,
			name: `User ${i + 1}`,
			status: 'active',
		}));

		render(<DataTable columns={columns} dataSource={data} />);

		expect(screen.getByText('共 25 条')).toBeInTheDocument();
	});

	it('shows empty state when no data', () => {
		render(<DataTable columns={columns} dataSource={[]} />);

		expect(screen.getAllByText('No data').length).toBeGreaterThan(0);
	});

	it('shows loading state when loading=true', () => {
		render(<DataTable columns={columns} dataSource={[]} loading />);

		const spinner = document.querySelector('.ant-spin');
		expect(spinner).toBeInTheDocument();
	});

	it('hides pagination when pagination=false', () => {
		const data = [{ id: '1', name: 'Alice', status: 'active' }];

		render(<DataTable columns={columns} dataSource={data} pagination={false} />);

		expect(screen.queryByText('共 1 条')).not.toBeInTheDocument();
	});

	it('renders search input when onSearch provided', () => {
		const onSearch = vi.fn();

		render(<DataTable columns={columns} dataSource={[]} onSearch={onSearch} />);

		expect(screen.getByPlaceholderText('请输入关键词搜索…')).toBeInTheDocument();
	});

	it('calls onSearch when search is triggered', async () => {
		const onSearch = vi.fn();
		const data = [{ id: '1', name: 'Alice', status: 'active' }];
		const user = userEvent.setup();

		render(<DataTable columns={columns} dataSource={data} onSearch={onSearch} />);

		const input = screen.getByPlaceholderText('请输入关键词搜索…');
		await user.type(input, 'Alice{Enter}');

		expect(onSearch).toHaveBeenCalledWith('Alice');
	});

	it('renders row selection when rowSelection provided', () => {
		const data = [{ id: '1', name: 'Alice', status: 'active' }];

		render(
			<DataTable
				columns={columns}
				dataSource={data}
				rowSelection={{ selectedRowKeys: [], onChange: vi.fn() }}
			/>,
		);

		const checkboxes = document.querySelectorAll('.ant-checkbox');
		expect(checkboxes.length).toBeGreaterThan(0);
	});
});
