import { render, screen } from '@testing-library/react';
import SidebarOverlay from '../SidebarOverlay';

describe('SidebarOverlay', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SidebarOverlay isOpen={false} onClose={mockOnClose} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders overlay when isOpen is true', () => {
    const { container } = render(<SidebarOverlay isOpen={true} onClose={mockOnClose} />);
    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', () => {
    const { container } = render(<SidebarOverlay isOpen={true} onClose={mockOnClose} />);
    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
    overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('has aria-hidden on overlay', () => {
    const { container } = render(<SidebarOverlay isOpen={true} onClose={mockOnClose} />);
    const overlay = container.querySelector('[aria-hidden="true"]');
    expect(overlay).toBeInTheDocument();
  });
});
