import { useState } from 'react';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/constants.js';
import { validateCategoryInput } from '../../utils/dataValidation.js';
import CategoryIcon from '../common/CategoryIcon.jsx';
import Button from '../common/Button.jsx';
import FormField from '../common/FormField.jsx';

export default function CategoryEditor({ initial, type, categories = [], onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [icon, setIcon] = useState(initial?.icon || 'Tag');
  const [color, setColor] = useState(initial?.color || CATEGORY_COLORS[0]);
  const [errors, setErrors] = useState({});

  function handleSubmit(event) {
    event.preventDefault();
    const payload = { name, icon, color, type: initial?.type || type };
    const validated = validateCategoryInput(payload, categories, initial?.id);
    if (!validated.ok) {
      setErrors(validated.errors);
      return;
    }
    const result = onSave(payload);
    if (result && result.ok === false) setErrors(result.errors || { name: result.error });
  }

  return (
    <form className="stack-form" onSubmit={handleSubmit}>
      <FormField id="category-name" label="Name" error={errors.name}>
        <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} />
      </FormField>
      <div className="field">
        <span>Color</span>
        <div className="choice-row" role="listbox" aria-label="Category color">
          {CATEGORY_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              className={`color-dot${color === swatch ? ' is-selected' : ''}`}
              style={{ background: swatch }}
              aria-label={swatch}
              aria-selected={color === swatch}
              onClick={() => setColor(swatch)}
            />
          ))}
        </div>
        {errors.color ? <p className="field-error">{errors.color}</p> : null}
      </div>
      <div className="field">
        <span>Icon</span>
        <div className="icon-picker">
          {CATEGORY_ICONS.map((item) => (
            <button
              key={item}
              type="button"
              className={icon === item ? 'is-selected' : ''}
              aria-label={item}
              aria-pressed={icon === item}
              onClick={() => setIcon(item)}
            >
              <CategoryIcon name={item} size={16} />
            </button>
          ))}
        </div>
        {errors.icon ? <p className="field-error">{errors.icon}</p> : null}
      </div>
      <div className="form-actions">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? 'Save category' : 'Add category'}</Button>
      </div>
    </form>
  );
}
