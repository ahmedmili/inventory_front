import { render, screen } from '@testing-library/react';
import ModernTable from '../ModernTable';

describe('ModernTable', () => {
  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'value', label: 'Valeur' },
  ];

  const data = [
    { id: '1', name: 'Item A', value: '10' },
    { id: '2', name: 'Item B', value: '20' },
  ];

  it('renders empty message when data is empty', () => {
    render(
      <ModernTable
        columns={columns}
        data={[]}
        emptyMessage="Aucune donnée"
      />,
    );
    expect(screen.getByText('Aucune donnée')).toBeInTheDocument();
  });

  it('renders table with headers and data', () => {
    render(<ModernTable columns={columns} data={data} />);
    expect(screen.getByRole('columnheader', { name: /nom/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /valeur/i })).toBeInTheDocument();
    expect(screen.getByText('Item A')).toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('applies custom emptyMessage when provided', () => {
    render(
      <ModernTable
        columns={columns}
        data={[]}
        emptyMessage="Liste vide"
      />,
    );
    expect(screen.getByText('Liste vide')).toBeInTheDocument();
  });

  it('renders scroll container with overflow-x-auto when has data', () => {
    const { container } = render(<ModernTable columns={columns} data={data} />);
    const wrapper = container.querySelector('.overflow-x-auto');
    expect(wrapper).toBeInTheDocument();
  });

  it('uses default minWidth on table when has data', () => {
    const { container } = render(<ModernTable columns={columns} data={data} />);
    const table = container.querySelector('table');
    expect(table).toHaveStyle({ minWidth: '600px' });
  });

  it('uses custom minWidth when provided', () => {
    const { container } = render(
      <ModernTable columns={columns} data={data} minWidth="1000px" />,
    );
    const table = container.querySelector('table');
    expect(table).toHaveStyle({ minWidth: '1000px' });
  });
});
