import { render, screen } from '@testing-library/react';
import Pagination from '../Pagination';

describe('Pagination', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it('renders pagination with current page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        hasNext={true}
        hasPrev={false}
      />,
    );

    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /page précédente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /page suivante/i })).toBeInTheDocument();
  });

  it('calls onPageChange when next button is clicked', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        hasNext={true}
        hasPrev={false}
      />,
    );

    const nextButton = screen.getByRole('button', { name: /page suivante/i });
    nextButton.click();

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when previous button is clicked', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
        hasNext={true}
        hasPrev={true}
      />,
    );

    const prevButton = screen.getByRole('button', { name: /page précédente/i });
    prevButton.click();

    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('disables next button when hasNext is false', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
        hasNext={false}
        hasPrev={true}
      />,
    );

    const nextButton = screen.getByRole('button', { name: /page suivante/i });
    expect(nextButton).toBeDisabled();
  });

  it('disables previous button when hasPrev is false', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        hasNext={true}
        hasPrev={false}
      />,
    );

    const prevButton = screen.getByRole('button', { name: /page précédente/i });
    expect(prevButton).toBeDisabled();
  });
});

