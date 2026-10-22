import { useEffect, useRef, useState } from 'react';
import { FREQUENCIES, PAYMENT_METHODS } from '../../utils/constants.js';
import { categoriesForType } from '../../utils/categories.js';
import { todayISO } from '../../utils/dateUtils.js';
import { validateRecurringInput } from '../../utils/dataValidation.js';
import Button from '../common/Button.jsx';
import FormField from '../common/FormField.jsx';

export default function RecurringExpenseForm({ categories, initial, onSubmit, onCancel, onDirtyChange }) {
  const [values, setValues] = useState(() => ({
    description: initial?.description || '',
    amount: initial?.amount != null ? String(initial.amount) : '',
    categoryId: initial?.categoryId || '',
    frequency: initial?.frequency || 'monthly',
    startDate: initial?.startDate || todayISO(),
    nextDueDate: initial?.nextDueDate || initial?.startDate || todayISO(),
    endDate: initial?.endDate || '',
    status: initial?.status || 'active',
    paymentMethod: initial?.paymentMethod || 'UPI',
    notes: initial?.notes || '',
  }));
  const [errors, setErrors] = useState({});
  const baseline = useRef('');
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;
  const expenseCategories = categoriesForType(categories, 'expense');

  useEffect(() => {
    baseline.current = JSON.stringify(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onDirtyChangeRef.current?.(JSON.stringify(values) !== baseline.current);
  }, [values]);

  function update(field, value) {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === 'startDate' && (!current.nextDueDate || current.nextDueDate === current.startDate)) {
        next.nextDueDate = value;
      }
      return next;
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validated = validateRecurringInput(values, categories);
    if (!validated.ok) {
      setErrors(validated.errors);
      return;
    }
    const result = onSubmit(values);
    if (result && result.ok === false && result.errors) setErrors(result.errors);
  }

  return (
    <form className="stack-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <FormField id="rec-description" label="Description" error={errors.description}>
          <input value={values.description} maxLength={120} onChange={(event) => update('description', event.target.value)} />
        </FormField>
        <FormField id="rec-amount" label="Amount" error={errors.amount}>
          <input value={values.amount} inputMode="decimal" onChange={(event) => update('amount', event.target.value)} />
        </FormField>
        <FormField id="rec-category" label="Category" error={errors.categoryId}>
          <select value={values.categoryId} onChange={(event) => update('categoryId', event.target.value)}>
            <option value="">Select a category</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="rec-frequency" label="Frequency" error={errors.frequency}>
          <select value={values.frequency} onChange={(event) => update('frequency', event.target.value)}>
            {FREQUENCIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="rec-start" label="Start date" error={errors.startDate}>
          <input type="date" value={values.startDate} onChange={(event) => update('startDate', event.target.value)} />
        </FormField>
        <FormField id="rec-next" label="Next due date" error={errors.nextDueDate}>
          <input type="date" value={values.nextDueDate} onChange={(event) => update('nextDueDate', event.target.value)} />
        </FormField>
        <FormField id="rec-end" label="End date" error={errors.endDate} hint="Optional">
          <input type="date" value={values.endDate} onChange={(event) => update('endDate', event.target.value)} />
        </FormField>
        <FormField id="rec-payment" label="Payment method" error={errors.paymentMethod}>
          <select value={values.paymentMethod} onChange={(event) => update('paymentMethod', event.target.value)}>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="rec-status" label="Status" error={errors.status}>
          <select value={values.status} onChange={(event) => update('status', event.target.value)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </FormField>
      </div>
      <FormField id="rec-notes" label="Notes" error={errors.notes} hint="Optional">
        <textarea rows={3} maxLength={500} value={values.notes} onChange={(event) => update('notes', event.target.value)} />
      </FormField>
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? 'Save changes' : 'Save recurring expense'}</Button>
      </div>
    </form>
  );
}
