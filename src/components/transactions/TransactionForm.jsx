import { useEffect, useRef, useState } from 'react';
import { PAYMENT_METHODS } from '../../utils/constants.js';
import { categoriesForType } from '../../utils/categories.js';
import { todayISO } from '../../utils/dateUtils.js';
import { validateTransactionInput } from '../../utils/dataValidation.js';
import Button from '../common/Button.jsx';
import FormField from '../common/FormField.jsx';

const EMPTY = {
  description: '',
  amount: '',
  type: 'expense',
  categoryId: '',
  date: '',
  paymentMethod: 'UPI',
  notes: '',
};

export default function TransactionForm({ categories, initial, onSubmit, onCancel, onCreateCategory, onDirtyChange }) {
  const [values, setValues] = useState(() => ({
    ...EMPTY,
    date: todayISO(),
    ...(initial
      ? {
          description: initial.description || '',
          amount: initial.amount != null ? String(initial.amount) : '',
          type: initial.type || 'expense',
          categoryId: initial.categoryId || '',
          date: initial.date || todayISO(),
          paymentMethod: initial.paymentMethod || 'UPI',
          notes: initial.notes || '',
        }
      : {}),
  }));
  const [errors, setErrors] = useState({});
  const lock = useRef(false);
  const baseline = useRef('');
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;
  const choices = categoriesForType(categories, values.type);

  useEffect(() => {
    baseline.current = JSON.stringify(values);
    // The baseline is the form as it was opened, including defaults.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onDirtyChangeRef.current?.(JSON.stringify(values) !== baseline.current);
  }, [values]);

  function update(field, value) {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === 'type' && !categories.some((category) => category.id === next.categoryId && category.type === value)) {
        next.categoryId = '';
      }
      return next;
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (lock.current) return;
    const validated = validateTransactionInput(values, categories);
    if (!validated.ok) {
      setErrors(validated.errors);
      return;
    }
    lock.current = true;
    const result = onSubmit(values);
    if (result && result.ok === false && result.errors) setErrors(result.errors);
    lock.current = false;
  }

  return (
    <form className="stack-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <FormField id="txn-description" label="Description" error={errors.description}>
          <input
            value={values.description}
            onChange={(event) => update('description', event.target.value)}
            maxLength={120}
            autoComplete="off"
          />
        </FormField>
        <FormField id="txn-amount" label="Amount" error={errors.amount}>
          <input
            value={values.amount}
            onChange={(event) => update('amount', event.target.value)}
            inputMode="decimal"
            autoComplete="off"
          />
        </FormField>
        <FormField id="txn-type" label="Type" error={errors.type}>
          <select value={values.type} onChange={(event) => update('type', event.target.value)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </FormField>
        <FormField id="txn-category" label="Category" error={errors.categoryId}>
          <select value={values.categoryId} onChange={(event) => update('categoryId', event.target.value)}>
            <option value="">Select a category</option>
            {choices.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="txn-date" label="Date" error={errors.date}>
          <input type="date" value={values.date} onChange={(event) => update('date', event.target.value)} />
        </FormField>
        <FormField id="txn-payment" label="Payment method" error={errors.paymentMethod}>
          <select value={values.paymentMethod} onChange={(event) => update('paymentMethod', event.target.value)}>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField id="txn-notes" label="Notes" error={errors.notes} hint="Optional">
        <textarea value={values.notes} onChange={(event) => update('notes', event.target.value)} rows={3} maxLength={500} />
      </FormField>
      {onCreateCategory ? (
        <button type="button" className="text-button" onClick={() => onCreateCategory(values.type)}>
          Add a custom category
        </button>
      ) : null}
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {initial ? 'Save changes' : 'Save transaction'}
        </Button>
      </div>
    </form>
  );
}
