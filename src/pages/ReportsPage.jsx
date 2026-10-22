import Header from '../components/layout/Header.jsx';
import ReportsDashboard from '../components/reports/ReportsDashboard.jsx';

export default function ReportsPage() {
  return (
    <>
      <Header title="Reports & Analytics" subtitle="Trends and breakdowns from your saved transactions" />
      <ReportsDashboard />
    </>
  );
}
