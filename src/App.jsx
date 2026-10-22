import { Navigate, Route, Routes } from 'react-router-dom';
import { AppDataProvider } from './context/AppDataContext.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import BudgetsPage from './pages/BudgetsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import RecurringExpensesPage from './pages/RecurringExpensesPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';

export default function App() {
  return (
    <AppDataProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="recurring" element={<RecurringExpensesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AppDataProvider>
  );
}
