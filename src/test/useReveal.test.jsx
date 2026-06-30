import { describe, it, expect } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import { useReveal } from '../lib/useReveal';

const Revealable = ({ options }) => {
  const ref = useReveal(options);
  return <div ref={ref} data-testid="box" className="reveal" />;
};

describe('useReveal', () => {
  it('adds is-visible and unobserves when the element intersects', () => {
    const { getByTestId } = render(<Revealable />);
    const box = getByTestId('box');
    expect(box).not.toHaveClass('is-visible');
    act(() => globalThis.__io.trigger(true));
    expect(box).toHaveClass('is-visible');
    expect(globalThis.__io.observed).toHaveLength(0); // unobserved
  });

  it('does nothing while the element is not intersecting', () => {
    const { getByTestId } = render(<Revealable />);
    act(() => globalThis.__io.trigger(false));
    expect(getByTestId('box')).not.toHaveClass('is-visible');
  });

  it('merges caller options into the observer', () => {
    render(<Revealable options={{ rootMargin: '50px' }} />);
    expect(globalThis.__io.options).toMatchObject({ threshold: 0.12, rootMargin: '50px' });
  });

  it('returns early when the ref is never attached', () => {
    renderHook(() => useReveal());
    // No element observed -> no observer instance created this render.
    expect(globalThis.__io).toBeUndefined();
  });
});
