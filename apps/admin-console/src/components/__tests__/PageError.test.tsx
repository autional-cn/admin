import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PageError } from '../ui/page-status';

describe('PageError', () => {
	it('renders error message', () => {
		render(<PageError message="数据加载失败" />);

		expect(screen.getByText('数据加载失败')).toBeInTheDocument();
	});

	it('shows retry button when onRetry provided', () => {
		const onRetry = vi.fn();

		render(<PageError message="加载失败" retry={onRetry} />);

		expect(screen.getByText('重试')).toBeInTheDocument();
	});

	it('does not show retry button when retry not provided', () => {
		render(<PageError message="加载失败" />);

		expect(screen.queryByText('重试')).not.toBeInTheDocument();
	});

	it('calls retry function when retry button clicked', async () => {
		const onRetry = vi.fn();
		const user = userEvent.setup();

		render(<PageError message="加载失败" retry={onRetry} />);

		await user.click(screen.getByText('重试'));

		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it('uses default message when no message provided', () => {
		render(<PageError />);

		expect(screen.getByText('数据加载失败')).toBeInTheDocument();
	});

	it('applies custom className', () => {
		const { container } = render(<PageError className="custom-error" />);

		const wrapper = container.firstElementChild;
		expect(wrapper?.className).toContain('custom-error');
	});
});
