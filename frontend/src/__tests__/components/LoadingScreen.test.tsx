import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingScreen from '../../components/common/LoadingScreen';

describe('LoadingScreen', () => {
  it('renders loading text', () => {
    render(<LoadingScreen />);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('renders the Bot icon container', () => {
    const { container } = render(<LoadingScreen />);
    // The icon wrapper div should be present
    const iconWrapper = container.querySelector('.bg-poke-600');
    expect(iconWrapper).toBeInTheDocument();
  });

  it('renders the full-screen container', () => {
    const { container } = render(<LoadingScreen />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('min-h-screen');
  });
});
