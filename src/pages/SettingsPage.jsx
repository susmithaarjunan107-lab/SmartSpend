import { useRef, useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import CategoryManager from '../components/settings/CategoryManager.jsx';
import Button from '../components/common/Button.jsx';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';
import Header from '../components/layout/Header.jsx';
import { CURRENCIES, DATE_FORMATS } from '../utils/constants.js';
import { downloadTextFile } from '../utils/csvExport.js';
import { validateBackup } from '../utils/dataValidation.js';
import { todayISO } from '../utils/dateUtils.js';

export default function SettingsPage() {
  const data = useAppData();
  const fileRef = useRef(null);
  const [importPayload, setImportPayload] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const [confirmClearDemo, setConfirmClearDemo] = useState(false);
  const hasRecords =
    data.transactions.length + data.budgets.length + data.recurringExpenses.length + data.customCategories.length > 0;

  function update(patch) {
    const result = data.updatePreferences(patch);
    if (!result.ok && result.error) data.notify(result.error, 'error');
  }

  function exportBackup() {
    const backup = data.buildBackup();
    if (!backup) {
      data.notify('Nothing is ready to export yet.', 'error');
      return;
    }
    downloadTextFile(`smartspend-backup-${todayISO()}.json`, JSON.stringify(backup, null, 2), 'application/json');
    data.notify('Backup downloaded.');
  }

  function onFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const validated = validateBackup(parsed);
        if (!validated.ok) {
          setImportErrors(validated.errors);
          setImportPayload(null);
          return;
        }
        setImportErrors([]);
        setImportPayload(parsed);
      } catch {
        setImportPayload(null);
        setImportErrors(['The file is not valid JSON.']);
      }
    };
    reader.readAsText(file);
  }

  return (
    <>
      <Header
        title="Settings"
        subtitle="Preferences stay in this browser with the rest of your SmartSpend data"
      />
      <div className="stack">
        <section className="callout">
          <strong>Stored only on this device</strong>
          Transactions, budgets, recurring expenses, categories, and these preferences are saved in this browser’s local storage. They are not synced to another device or browser. Export a backup if you want a copy.
        </section>

        <div className="settings-grid">
          <section className="card stack-form">
            <h2>Preferences</h2>
            <div className="field">
              <label htmlFor="display-name">Display name</label>
              <input
                id="display-name"
                maxLength={40}
                value={data.preferences.displayName}
                onChange={(event) => update({ displayName: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="currency">Currency</label>
              <select id="currency" value={data.preferences.currency} onChange={(event) => update({ currency: event.target.value })}>
                {CURRENCIES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="field-hint">Amounts use the Intl.NumberFormat API. The default is Indian Rupee (₹).</p>
            </div>
            <div className="field">
              <label htmlFor="date-format">Date display</label>
              <select id="date-format" value={data.preferences.dateFormat} onChange={(event) => update({ dateFormat: event.target.value })}>
                {DATE_FORMATS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dashboard-month">Dashboard month</label>
              <select
                id="dashboard-month"
                value={data.preferences.dashboardMonth}
                onChange={(event) => update({ dashboardMonth: event.target.value })}
              >
                <option value="current">Open on the current month</option>
                <option value="remember">Reopen the last month you viewed</option>
              </select>
            </div>
            <div className="field">
              <span id="theme-label">Theme</span>
              <div className="choice-row" role="group" aria-labelledby="theme-label">
                <button type="button" className={`choice${data.preferences.theme === 'light' ? ' is-selected' : ''}`} onClick={() => update({ theme: 'light' })}>
                  Light
                </button>
                <button type="button" className={`choice${data.preferences.theme === 'dark' ? ' is-selected' : ''}`} onClick={() => update({ theme: 'dark' })}>
                  Dark
                </button>
              </div>
            </div>
          </section>

          <section className="card stack-form">
            <h2>Backup and restore</h2>
            <p className="muted">A backup is a JSON file with schema version 1. Importing replaces the data currently stored in this browser after you confirm.</p>
            <div className="button-row">
              <Button onClick={exportBackup}>Export JSON backup</Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Import JSON backup
              </Button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
            </div>
            {importErrors.length ? (
              <div className="banner banner--danger" role="alert">
                <strong>This backup was not imported.</strong>
                <ul>
                  {importErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <h2>Sample data</h2>
            <p className="muted">Sample records are labeled and dated around the current month. Loading them adds records. It does not replace entries you created.</p>
            <div className="button-row">
              <Button variant="secondary" disabled={data.meta.demoLoaded} onClick={() => (hasRecords ? setConfirmDemo(true) : applyDemo())}>
                {data.meta.demoLoaded ? 'Sample data already loaded' : 'Load sample data'}
              </Button>
              <Button variant="secondary" disabled={!data.hasDemoData} onClick={() => setConfirmClearDemo(true)}>
                Clear sample data
              </Button>
            </div>
            <h2>Reset</h2>
            <p className="muted">This removes transactions, budgets, recurring expenses, custom categories, and preferences from this browser.</p>
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Clear all application data
            </Button>
          </section>
        </div>

        <CategoryManager />
      </div>

      {importPayload ? (
        <ConfirmDialog
          title="Replace current data"
          message="Importing this backup will overwrite the transactions, budgets, recurring expenses, categories, and preferences stored in this browser."
          confirmLabel="Replace data"
          onCancel={() => setImportPayload(null)}
          onConfirm={() => {
            const result = data.importBackup(importPayload);
            if (!result.ok) data.notify(result.error || 'Import failed.', 'error');
            else data.notify('Backup imported.');
            setImportPayload(null);
          }}
        />
      ) : null}

      {confirmReset ? (
        <ConfirmDialog
          title="Clear all application data"
          message="This permanently removes SmartSpend data from this browser. Export a backup first if you want to keep a copy."
          confirmLabel="Clear data"
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            const result = data.resetAllData();
            if (!result.ok) data.notify(result.error, 'error');
            else data.notify('All local data was cleared.');
            setConfirmReset(false);
          }}
        />
      ) : null}

      {confirmDemo ? (
        <ConfirmDialog
          title="Add sample data"
          message="Sample records will be added next to your existing data. They are labeled and can be cleared later."
          confirmLabel="Load sample data"
          tone="primary"
          onCancel={() => setConfirmDemo(false)}
          onConfirm={() => {
            applyDemo();
            setConfirmDemo(false);
          }}
        />
      ) : null}

      {confirmClearDemo ? (
        <ConfirmDialog
          title="Clear sample data"
          message="This removes records marked as sample data, including sample records you edited. Entries you created yourself stay."
          confirmLabel="Clear sample data"
          onCancel={() => setConfirmClearDemo(false)}
          onConfirm={() => {
            const result = data.clearDemoData();
            if (!result.ok) data.notify(result.error, 'error');
            else data.notify('Sample data removed.');
            setConfirmClearDemo(false);
          }}
        />
      ) : null}
    </>
  );

  function applyDemo() {
    const result = data.loadDemoData();
    if (!result.ok) data.notify(result.error || 'Sample data could not be loaded.', 'error');
    else data.notify('Sample data loaded.');
  }
}
