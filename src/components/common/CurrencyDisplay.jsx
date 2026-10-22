import { useAppData } from '../../context/AppDataContext.jsx';

export default function CurrencyDisplay({ amount, tone }) {
  const { formatMoney } = useAppData();
  const derived = Number(amount) < 0 ? 'negative' : Number(amount) > 0 ? 'positive' : 'neutral';
  return <span className={`money money--${tone || derived}`}>{formatMoney(amount)}</span>;
}
