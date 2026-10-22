import { useEffect, useRef, useState } from 'react';
import { categoriesForType } from '../../utils/categories.js';
import { validateBudgetInput } from '../../utils/dataValidation.js';
import { monthLabel } from '../../utils/dateUtils.js';
import Button from '../common/Button.jsx';
import FormField from '../common/FormField.jsx';

export default function BudgetForm({ categories, initial, defaultMonth, defaultYear, onSubmit, onCancel, onDirtyChange }) {
  const [values, setValues] = useState({
    scope: initial?.scope || 'category',
    categoryId: initial?.categoryId || '',
    limit: initial?.limit != null ? String(initial.limit) : '',
    month: initial?.month || defaultMonth,
    year: initial?.year || defaultYear,
  });
  const [errors, setErrors] = useState({});
  const baseline = useRef('');
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;
  const expenseCategories = categoriesForType(categories, 'expense');
  const years = [];
  for (let year = defaultYear - 2; year <= defaultYear + 3; year += 1) years.push(year);
  if (initial?.year && !years.includes(initial.year)) years.push(initial.year);

  useEffect(() => {
    baseline.current = JSON.stringify(values);
    // Capture the form exactly as opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onDirtyChangeRef.current?.(JSON.stringify(values) !== baseline.current);
  }, [values]);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      ...values,
      month: Number(values.month),
      year: Number(values.year),
      categoryId: values.scope === 'overall' ? null : values.categoryId,
    };
    const validated = validateBudgetInput(payload, categories);
    if (!validated.ok) {
      setErrors(validated.errors);
      return;
    }
    const result = onSubmit(payload);
    if (result && result.ok === false && result.errors) setErrors(result.errors);
  }

  return (
    <form className="stack-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <span id="budget-scope-label">Budget type</span>
        <div className="choice-row" role="group" aria-labelledby="budget-scope-label">
          <button type="button" className={`choice${values.scope === 'overall' ? ' is-selected' : ''}`} onClick={() => update('scope', 'overall')}>
            Overall monthly budget
          </button>
          <button type="button" className={`choice${values.scope === 'category' ? ' is-selected' : ''}`} onClick={() => update('scope', 'category')}>
            Category budget
          </button>
        </div>
        {errors.scope ? <p className="field-error">{errors.scope}</p> : null}
      </div>
      {values.scope === 'category' ? (
        <FormField id="budget-category" label="Category" error={errors.categoryId}>
          <select value={values.categoryId || ''} onChange={(event) => update('categoryId', event.target.value)}>
            <option value="">Select a category</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FormField>
      ) : (
        <p className="callout">This cap applies to every expense in the month. It is not the sum of category budgets.</p>
      )}
      <div className="form-grid">
        <FormField id="budget-limit" label="Monthly limit" error={errors.limit}>
          <input value={values.limit} inputMode="decimal" onChange={(event) => update('limit', event.target.value)} />
        </FormField>
        <FormField id="budget-month" label="Month" error={errors.month}>
          <select value={values.month} onChange={(event) => update('month', Number(event.target.value))}>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {monthLabel(values.year, index + 1, 'MMMM')}
              </option>
            ))}
          </select>
        </FormField>
        <FormField id="budget-year" label="Year" error={errors.year}>
          <select value={values.year} onChange={(event) => update('year', Number(event.target.value))}>
            {years.sort((a, b) => a - b).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? 'Save changes' : 'Save budget'}</Button>
      </div>
    </form>
  );
}
