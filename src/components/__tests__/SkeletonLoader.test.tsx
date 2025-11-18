import { render, screen } from '@testing-library/react';
import { SkeletonLoader, TableSkeleton, CardSkeleton } from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders skeleton loader with custom className', () => {
    const { container } = render(<SkeletonLoader className="custom-class" />);
    const skeleton = container.firstChild;
    expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200', 'rounded', 'custom-class');
  });

  it('renders table skeleton with specified rows and columns', () => {
    render(<TableSkeleton rows={3} cols={4} />);
    // Check that skeleton elements are rendered
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders card skeleton', () => {
    render(<CardSkeleton />);
    const card = document.querySelector('.bg-white.shadow.rounded-lg');
    expect(card).toBeInTheDocument();
  });
});

