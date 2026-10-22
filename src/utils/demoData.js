import { EMPTY_META } from './constants.js';
import { addDaysISO, parseISODate, shiftMonth, todayISO } from './dateUtils.js';

function iso(year, month, day) {
  const last = new Date(year, month, 0).getDate();
  const safe = Math.max(1, Math.min(day, last));
  return `${year}-${String(month).padStart(2, '0')}-${String(safe).padStart(2, '0')}`;
}

function stamp(year, month) {
  return `${year}${String(month).padStart(2, '0')}`;
}

function at(year, month, day) {
  return new Date(year, month - 1, day, 9, 0, 0).toISOString();
}

/**
 * Sample records are dated from the supplied clock so the current month stays useful
 * whenever the app is opened. Nothing here is written until the user asks to load it.
 */
export function buildDemoData(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = todayISO(now);
  const transactions = [];
  const budgets = [];

  const pushTxn = (partial, whenYear, whenMonth) => {
    const date = partial.date || iso(whenYear, whenMonth, partial.day);
    const createdAt = at(whenYear, whenMonth, Number(date.slice(-2)));
    transactions.push({
      id: partial.id,
      description: partial.description,
      amount: partial.amount,
      type: partial.type,
      categoryId: partial.categoryId,
      date,
      paymentMethod: partial.paymentMethod,
      notes: partial.notes || 'Sample data',
      createdAt,
      updatedAt: createdAt,
      isDemo: true,
      ...(partial.recurringExpenseId ? { recurringExpenseId: partial.recurringExpenseId } : {}),
      ...(partial.occurrenceKey ? { occurrenceKey: partial.occurrenceKey } : {}),
    });
  };

  for (let offset = -5; offset <= -1; offset += 1) {
    const point = shiftMonth(year, month, offset);
    const idPart = stamp(point.year, point.month);
    const wave = offset + 6;
    pushTxn({ id: `demo_txn_salary_${idPart}`, description: 'Monthly salary', amount: 85000, type: 'income', categoryId: 'inc_salary', day: 1, paymentMethod: 'Bank Transfer', notes: 'Sample salary' }, point.year, point.month);
    if (offset === -4 || offset === -2) {
      pushTxn({ id: `demo_txn_freelance_${idPart}`, description: 'Freelance website project', amount: 15000 + wave * 250, type: 'income', categoryId: 'inc_freelance', day: 20, paymentMethod: 'UPI', notes: 'Sample freelance income' }, point.year, point.month);
    }
    pushTxn({ id: `demo_txn_rent_${idPart}`, description: 'House rent', amount: 22000, type: 'expense', categoryId: 'exp_housing', day: 2, paymentMethod: 'Bank Transfer', notes: 'Sample rent', recurringExpenseId: 'demo_rec_rent', occurrenceKey: `demo_rec_rent:${iso(point.year, point.month, 2)}` }, point.year, point.month);
    pushTxn({ id: `demo_txn_groceries_a_${idPart}`, description: 'Weekly groceries', amount: 2800 + wave * 40, type: 'expense', categoryId: 'exp_groceries', day: 6, paymentMethod: 'UPI', notes: 'Sample grocery run' }, point.year, point.month);
    pushTxn({ id: `demo_txn_groceries_b_${idPart}`, description: 'Supermarket top-up', amount: 1650 + wave * 25, type: 'expense', categoryId: 'exp_groceries', day: 18, paymentMethod: 'Debit Card', notes: 'Sample grocery run' }, point.year, point.month);
    pushTxn({ id: `demo_txn_food_a_${idPart}`, description: 'Lunch with colleagues', amount: 640 + wave * 15, type: 'expense', categoryId: 'exp_food', day: 4, paymentMethod: 'UPI' }, point.year, point.month);
    pushTxn({ id: `demo_txn_food_b_${idPart}`, description: 'Weekend dinner', amount: 1280 + wave * 20, type: 'expense', categoryId: 'exp_food', day: 16, paymentMethod: 'Credit Card' }, point.year, point.month);
    pushTxn({ id: `demo_txn_metro_${idPart}`, description: 'Metro and auto rides', amount: 860 + wave * 10, type: 'expense', categoryId: 'exp_transport', day: 9, paymentMethod: 'UPI' }, point.year, point.month);
    pushTxn({ id: `demo_txn_fuel_${idPart}`, description: 'Fuel', amount: 1400 + wave * 30, type: 'expense', categoryId: 'exp_transport', day: 21, paymentMethod: 'Credit Card' }, point.year, point.month);
    pushTxn({ id: `demo_txn_power_${idPart}`, description: 'Electricity bill', amount: 1980 + wave * 35, type: 'expense', categoryId: 'exp_utilities', day: 11, paymentMethod: 'Net Banking' }, point.year, point.month);
    pushTxn({ id: `demo_txn_net_${idPart}`, description: 'Home internet', amount: 999, type: 'expense', categoryId: 'exp_utilities', day: 7, paymentMethod: 'UPI', recurringExpenseId: 'demo_rec_internet', occurrenceKey: `demo_rec_internet:${iso(point.year, point.month, 7)}` }, point.year, point.month);
    pushTxn({ id: `demo_txn_movie_${idPart}`, description: 'Movie night', amount: 900 + wave * 20, type: 'expense', categoryId: 'exp_entertainment', day: 22, paymentMethod: 'UPI' }, point.year, point.month);
    pushTxn({ id: `demo_txn_netflix_${idPart}`, description: 'Netflix', amount: 649, type: 'expense', categoryId: 'exp_subscriptions', day: 18, paymentMethod: 'Credit Card' }, point.year, point.month);
    pushTxn({ id: `demo_txn_gym_${idPart}`, description: 'Gym membership', amount: 1500, type: 'expense', categoryId: 'exp_care', day: 12, paymentMethod: 'UPI' }, point.year, point.month);
  }

  const currentId = stamp(year, month);
  const todayDate = parseISODate(today);
  const spentDay = todayDate.getDate();

  pushTxn({ id: `demo_txn_salary_${currentId}`, description: 'Monthly salary', amount: 85000, type: 'income', categoryId: 'inc_salary', day: 1, paymentMethod: 'Bank Transfer', notes: 'Sample salary' }, year, month);

  const recent = [];
  for (let daysAgo = 0; daysAgo < 40 && recent.length < 8; daysAgo += 1) {
    const date = addDaysISO(today, -daysAgo);
    const parsed = parseISODate(date);
    if (parsed.getFullYear() === year && parsed.getMonth() + 1 === month) recent.push(date);
  }
  const pick = (index) => recent[Math.min(index, recent.length - 1)];

  pushTxn({ id: `demo_txn_groceries_${currentId}`, description: 'Weekly groceries', amount: 3600, type: 'expense', categoryId: 'exp_groceries', date: pick(1), paymentMethod: 'UPI', notes: 'Sample grocery run' }, year, month);
  pushTxn({ id: `demo_txn_food_${currentId}`, description: 'Cafe lunch', amount: 540, type: 'expense', categoryId: 'exp_food', date: pick(0), paymentMethod: 'UPI', notes: 'Sample dining' }, year, month);
  pushTxn({ id: `demo_txn_transport_${currentId}`, description: 'Cab to office', amount: 280, type: 'expense', categoryId: 'exp_transport', date: pick(2), paymentMethod: 'Wallet', notes: 'Sample transport' }, year, month);
  pushTxn({ id: `demo_txn_power_${currentId}`, description: 'Electricity bill', amount: 2340, type: 'expense', categoryId: 'exp_utilities', date: pick(3), paymentMethod: 'Net Banking', notes: 'Sample electricity bill' }, year, month);
  pushTxn({ id: `demo_txn_pets_${currentId}`, description: 'Pet food and treats', amount: 890, type: 'expense', categoryId: 'demo_cat_pets', date: pick(4), paymentMethod: 'UPI', notes: 'Sample custom category' }, year, month);

  if (spentDay >= 2) {
    const rentDate = iso(year, month, 2);
    pushTxn({ id: `demo_txn_rent_${currentId}`, description: 'House rent', amount: 22000, type: 'expense', categoryId: 'exp_housing', date: rentDate, paymentMethod: 'Bank Transfer', notes: 'Sample rent', recurringExpenseId: 'demo_rec_rent', occurrenceKey: `demo_rec_rent:${rentDate}` }, year, month);
  }
  if (spentDay >= 7) {
    const netDate = iso(year, month, 7);
    pushTxn({ id: `demo_txn_net_${currentId}`, description: 'Home internet', amount: 999, type: 'expense', categoryId: 'exp_utilities', date: netDate, paymentMethod: 'UPI', notes: 'Sample internet bill', recurringExpenseId: 'demo_rec_internet', occurrenceKey: `demo_rec_internet:${netDate}` }, year, month);
  }

  const nextMonth = shiftMonth(year, month, 1);
  const rentNext = spentDay >= 2 ? iso(nextMonth.year, nextMonth.month, 2) : iso(year, month, 2);
  const netNext = spentDay >= 7 ? iso(nextMonth.year, nextMonth.month, 7) : iso(year, month, 7);
  const overdue = addDaysISO(today, -3);
  const upcoming = addDaysISO(today, 5);
  const metroNext = addDaysISO(today, 2);
  const metroStart = addDaysISO(today, -26);
  const created = now.toISOString();

  const recurringExpenses = [
    {
      id: 'demo_rec_rent',
      description: 'House rent',
      amount: 22000,
      categoryId: 'exp_housing',
      frequency: 'monthly',
      startDate: iso(shiftMonth(year, month, -5).year, shiftMonth(year, month, -5).month, 2),
      nextDueDate: rentNext,
      endDate: null,
      status: 'active',
      paymentMethod: 'Bank Transfer',
      notes: 'Sample recurring rent',
      lastPaidOccurrence: spentDay >= 2 ? iso(year, month, 2) : iso(shiftMonth(year, month, -1).year, shiftMonth(year, month, -1).month, 2),
      createdAt: created,
      updatedAt: created,
      isDemo: true,
    },
    {
      id: 'demo_rec_internet',
      description: 'Home internet',
      amount: 999,
      categoryId: 'exp_utilities',
      frequency: 'monthly',
      startDate: iso(shiftMonth(year, month, -5).year, shiftMonth(year, month, -5).month, 7),
      nextDueDate: netNext,
      endDate: null,
      status: 'active',
      paymentMethod: 'UPI',
      notes: 'Sample broadband bill',
      lastPaidOccurrence: spentDay >= 7 ? iso(year, month, 7) : iso(shiftMonth(year, month, -1).year, shiftMonth(year, month, -1).month, 7),
      createdAt: created,
      updatedAt: created,
      isDemo: true,
    },
    {
      id: 'demo_rec_netflix',
      description: 'Netflix',
      amount: 649,
      categoryId: 'exp_subscriptions',
      frequency: 'monthly',
      startDate: iso(
        shiftMonth(parseISODate(upcoming).getFullYear(), parseISODate(upcoming).getMonth() + 1, -4).year,
        shiftMonth(parseISODate(upcoming).getFullYear(), parseISODate(upcoming).getMonth() + 1, -4).month,
        parseISODate(upcoming).getDate(),
      ),
      nextDueDate: upcoming,
      endDate: null,
      status: 'active',
      paymentMethod: 'Credit Card',
      notes: 'Sample subscription, not paid for the upcoming date',
      lastPaidOccurrence: null,
      createdAt: created,
      updatedAt: created,
      isDemo: true,
    },
    {
      id: 'demo_rec_gym',
      description: 'Gym membership',
      amount: 1500,
      categoryId: 'exp_care',
      frequency: 'monthly',
      startDate: iso(
        shiftMonth(parseISODate(overdue).getFullYear(), parseISODate(overdue).getMonth() + 1, -4).year,
        shiftMonth(parseISODate(overdue).getFullYear(), parseISODate(overdue).getMonth() + 1, -4).month,
        parseISODate(overdue).getDate(),
      ),
      nextDueDate: overdue,
      endDate: null,
      status: 'active',
      paymentMethod: 'UPI',
      notes: 'Sample overdue membership',
      lastPaidOccurrence: null,
      createdAt: created,
      updatedAt: created,
      isDemo: true,
    },
    {
      id: 'demo_rec_metro',
      description: 'Weekly metro pass',
      amount: 360,
      categoryId: 'exp_transport',
      frequency: 'weekly',
      startDate: metroStart,
      nextDueDate: metroNext,
      endDate: null,
      status: 'active',
      paymentMethod: 'UPI',
      notes: 'Sample weekly travel pass',
      lastPaidOccurrence: addDaysISO(metroNext, -7),
      createdAt: created,
      updatedAt: created,
      isDemo: true,
    },
    {
      id: 'demo_rec_domain',
      description: 'Domain renewal',
      amount: 1499,
      categoryId: 'exp_subscriptions',
      frequency: 'yearly',
      startDate: iso(parseISODate(addDaysISO(today, 40)).getFullYear() - 1, parseISODate(addDaysISO(today, 40)).getMonth() + 1, parseISODate(addDaysISO(today, 40)).getDate()),
      nextDueDate: addDaysISO(today, 40),
      endDate: null,
      status: 'active',
      paymentMethod: 'Credit Card',
      notes: 'Sample yearly renewal',
      lastPaidOccurrence: null,
      createdAt: created,
      updatedAt: created,
      isDemo: true,
    },
    {
      id: 'demo_rec_magazine',
      description: 'Weekend magazine',
      amount: 120,
      categoryId: 'exp_entertainment',
      frequency: 'monthly',
      startDate: iso(shiftMonth(year, month, -3).year, shiftMonth(year, month, -3).month, 10),
      nextDueDate: iso(nextMonth.year, nextMonth.month, 10),
      endDate: null,
      status: 'paused',
      paymentMethod: 'Cash',
      notes: 'Sample paused expense',
      lastPaidOccurrence: null,
      createdAt: created,
      updatedAt: created,
      isDemo: true,
    },
  ];

  const budgetStamp = currentId;
  const budgetTime = created;
  const addBudget = (key, scope, categoryId, limit) => {
    budgets.push({
      id: `demo_budget_${key}_${budgetStamp}`,
      scope,
      categoryId,
      limit,
      month,
      year,
      createdAt: budgetTime,
      updatedAt: budgetTime,
      isDemo: true,
    });
  };
  addBudget('overall', 'overall', null, 45000);
  addBudget('groceries', 'category', 'exp_groceries', 3000);
  addBudget('food', 'category', 'exp_food', 5000);
  addBudget('transport', 'category', 'exp_transport', 4000);
  addBudget('housing', 'category', 'exp_housing', 22000);
  addBudget('utilities', 'category', 'exp_utilities', 2500);
  addBudget('entertainment', 'category', 'exp_entertainment', 3000);
  addBudget('subscriptions', 'category', 'exp_subscriptions', 2000);

  const previous = shiftMonth(year, month, -1);
  budgets.push({
    id: `demo_budget_overall_${stamp(previous.year, previous.month)}`,
    scope: 'overall',
    categoryId: null,
    limit: 48000,
    month: previous.month,
    year: previous.year,
    createdAt: budgetTime,
    updatedAt: budgetTime,
    isDemo: true,
  });

  return {
    transactions,
    budgets,
    recurringExpenses,
    customCategories: [
      {
        id: 'demo_cat_pets',
        name: 'Pets',
        type: 'expense',
        icon: 'PawPrint',
        color: '#C43E78',
        isCustom: true,
        isDemo: true,
      },
    ],
    meta: { ...EMPTY_META, demoPromptSeen: true, demoLoaded: true },
  };
}

export function loadDemoIntoState(state, now = new Date()) {
  if (state.meta?.demoLoaded) {
    return { ok: false, error: 'Sample data is already loaded.', state };
  }
  const demo = buildDemoData(now);
  const existing = {
    transactions: new Set(state.transactions.map((item) => item.id)),
    budgets: new Set(state.budgets.map((item) => item.id)),
    recurringExpenses: new Set(state.recurringExpenses.map((item) => item.id)),
    customCategories: new Set(state.customCategories.map((item) => item.id)),
  };
  return {
    ok: true,
    state: {
      ...state,
      transactions: [...state.transactions, ...demo.transactions.filter((item) => !existing.transactions.has(item.id))],
      budgets: [...state.budgets, ...demo.budgets.filter((item) => !existing.budgets.has(item.id))],
      recurringExpenses: [
        ...state.recurringExpenses,
        ...demo.recurringExpenses.filter((item) => !existing.recurringExpenses.has(item.id)),
      ],
      customCategories: [
        ...state.customCategories,
        ...demo.customCategories.filter((item) => !existing.customCategories.has(item.id)),
      ],
      meta: { ...state.meta, demoPromptSeen: true, demoLoaded: true },
    },
  };
}

export function clearDemoFromState(state) {
  return {
    ok: true,
    state: {
      ...state,
      transactions: state.transactions.filter((item) => !item.isDemo),
      budgets: state.budgets.filter((item) => !item.isDemo),
      recurringExpenses: state.recurringExpenses.filter((item) => !item.isDemo),
      customCategories: state.customCategories.filter((item) => !item.isDemo),
      meta: { ...state.meta, demoLoaded: false, demoPromptSeen: true },
    },
  };
}
