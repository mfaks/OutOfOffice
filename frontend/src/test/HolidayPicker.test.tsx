import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { HolidayPicker } from '../components/HolidayPicker';

afterEach(() => {
  vi.restoreAllMocks();
});

function renderPicker(holidays: Date[] = [], onChange = vi.fn()) {
  return render(<HolidayPicker holidays={holidays} onChange={onChange} />);
}

describe('HolidayPicker', () => {
  it('shows "Click to add holidays" when no holidays selected', () => {
    renderPicker();
    expect(screen.getByText(/click to add holidays/i)).toBeInTheDocument();
  });

  it('shows count when holidays are present', () => {
    renderPicker([new Date(2026, 6, 4)]);
    expect(screen.getByText(/1 holiday selected/i)).toBeInTheDocument();
  });

  it('shows plural count for multiple holidays', () => {
    renderPicker([new Date(2026, 6, 4), new Date(2026, 11, 25)]);
    expect(screen.getByText(/2 holidays selected/i)).toBeInTheDocument();
  });

  it('calendar section is hidden by default', () => {
    renderPicker();
    expect(
      screen.queryByText(/upcoming us federal holidays/i),
    ).not.toBeInTheDocument();
  });

  it('clicking the toggle opens the calendar section', async () => {
    renderPicker();
    await userEvent.click(screen.getByText(/click to add holidays/i));
    expect(
      screen.getByText(/upcoming us federal holidays/i),
    ).toBeInTheDocument();
  });

  it('clicking the toggle twice closes the section', async () => {
    renderPicker();
    // closest('button') reaches the outer toggle, not the inner label
    const toggle = screen
      .getByText(/click to add holidays/i)
      .closest('button')!;
    await userEvent.click(toggle);
    await userEvent.click(toggle);
    expect(
      screen.queryByText(/upcoming us federal holidays/i),
    ).not.toBeInTheDocument();
  });

  it('"Add all" button calls onChange with all federal holidays', async () => {
    const onChange = vi.fn();
    renderPicker([], onChange);
    await userEvent.click(screen.getByText(/click to add holidays/i));
    await userEvent.click(screen.getByText(/add all/i));
    expect(onChange).toHaveBeenCalledOnce();
    const added: Date[] = onChange.mock.calls[0][0];
    expect(added.length).toBeGreaterThan(0);
  });

  it('"Add all" button is hidden when all federal holidays already selected', async () => {
    // Open the picker and add all, then re-render with those holidays
    const onChange = vi.fn();
    const { rerender } = render(
      <HolidayPicker holidays={[]} onChange={onChange} />,
    );
    await userEvent.click(screen.getByText(/click to add holidays/i));
    await userEvent.click(screen.getByText(/add all/i));
    const allHolidays: Date[] = onChange.mock.calls[0][0];

    rerender(<HolidayPicker holidays={allHolidays} onChange={onChange} />);
    expect(screen.queryByText(/add all/i)).not.toBeInTheDocument();
  });

  it('clicking a federal holiday pill calls onChange with that date added', async () => {
    const onChange = vi.fn();
    renderPicker([], onChange);
    await userEvent.click(screen.getByText(/click to add holidays/i));
    // Memorial Day (May) is always a future holiday relative to today
    const memorialDayButton = screen.getByRole('button', {
      name: /memorial day/i,
    });
    await userEvent.click(memorialDayButton);
    expect(onChange).toHaveBeenCalledOnce();
    const added: Date[] = onChange.mock.calls[0][0];
    expect(added).toHaveLength(1);
  });

  it('holiday chips appear when holidays are selected and section is open', async () => {
    const holiday = new Date(2026, 6, 4); // July 4
    renderPicker([holiday]);
    await userEvent.click(screen.getByText(/1 holiday selected/i));
    expect(screen.getByText('Jul 4')).toBeInTheDocument();
  });

  it('clicking remove chip on a holiday calls onChange without that date', async () => {
    const holiday = new Date(2026, 6, 4);
    const onChange = vi.fn();
    renderPicker([holiday], onChange);
    await userEvent.click(screen.getByText(/1 holiday selected/i));
    await userEvent.click(screen.getByLabelText(/remove jul 4/i));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
