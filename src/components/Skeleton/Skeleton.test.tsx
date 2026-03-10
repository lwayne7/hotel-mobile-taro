import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './index';

describe('Skeleton', () => {
    it('renders skeleton rows when loading', () => {
        const { container } = render(<Skeleton loading rows={3} />);

        const rows = container.querySelectorAll('.ht-skeleton-row');
        expect(rows.length).toBe(3);
    });

    it('applies animated class by default', () => {
        const { container } = render(<Skeleton loading />);

        expect(container.querySelector('.ht-skeleton--animated')).toBeTruthy();
    });

    it('does not apply animated class when animated=false', () => {
        const { container } = render(<Skeleton loading animated={false} />);

        expect(container.querySelector('.ht-skeleton--animated')).toBeNull();
    });

    it('renders title block when title prop is true', () => {
        const { container } = render(<Skeleton loading title />);

        expect(container.querySelector('.ht-skeleton-title')).toBeTruthy();
    });

    it('renders avatar when avatar prop is true', () => {
        const { container } = render(<Skeleton loading avatar />);

        expect(container.querySelector('.ht-skeleton-avatar')).toBeTruthy();
    });

    it('renders round avatar by default', () => {
        const { container } = render(<Skeleton loading avatar />);

        expect(container.querySelector('.ht-skeleton-avatar--round')).toBeTruthy();
    });

    it('renders square avatar when avatarShape is square', () => {
        const { container } = render(<Skeleton loading avatar avatarShape="square" />);

        expect(container.querySelector('.ht-skeleton-avatar--square')).toBeTruthy();
    });

    it('renders children when not loading', () => {
        render(
            <Skeleton loading={false}>
                <span>内容已加载</span>
            </Skeleton>
        );

        expect(screen.getByText('内容已加载')).toBeInTheDocument();
    });

    it('returns null when not loading and no children', () => {
        const { container } = render(<Skeleton loading={false} />);

        expect(container.innerHTML).toBe('');
    });

    it('last row has 60% width', () => {
        const { container } = render(<Skeleton loading rows={3} />);

        const rows = container.querySelectorAll('.ht-skeleton-row');
        expect((rows[2] as HTMLElement).style.width).toBe('60%');
    });

    it('custom rows count is respected', () => {
        const { container } = render(<Skeleton loading rows={5} />);

        const rows = container.querySelectorAll('.ht-skeleton-row');
        expect(rows.length).toBe(5);
    });
});
