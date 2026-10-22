import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CATEGORIES } from '../../utils/categories.js';
import TransactionForm from './TransactionForm.jsx';

describe('TransactionForm', () => {
  it('shows inline errors and does not drop what the user typed', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TransactionForm categories={DEFAULT_CATEGORIES} onSubmit={onSubmit} onCancel={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Save transaction' }));
    expect(screen.getByText('Description is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Description'), 'Coffee');
    await user.type(screen.getByLabelText('Amount'), '0');
    await user.click(screen.getByRole('button', { name: 'Save transaction' }));

    expect(screen.getByLabelText('Description')).toHaveValue('Coffee');
    expect(screen.getByText(/greater than zero/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid transaction once', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => ({ ok: true }));
    render(<TransactionForm categories={DEFAULT_CATEGORIES} onSubmit={onSubmit} onCancel={() => {}} />);

    await user.type(screen.getByLabelText('Description'), 'Coffee');
    await user.type(screen.getByLabelText('Amount'), '120.50');
    await user.selectOptions(screen.getByLabelText('Type'), 'expense');
    await user.selectOptions(screen.getByLabelText('Category'), 'exp_food');
    await user.clear(screen.getByLabelText('Date'));
    await user.type(screen.getByLabelText('Date'), '2026-10-22');
    await user.selectOptions(screen.getByLabelText('Payment method'), 'UPI');
    await user.type(screen.getByLabelText('Notes'), 'Morning');
    await user.click(screen.getByRole('button', { name: 'Save transaction' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      description: 'Coffee',
      amount: '120.50',
      type: 'expense',
      categoryId: 'exp_food',
      date: '2026-10-22',
      paymentMethod: 'UPI',
      notes: 'Morning',
    });
  });
});
