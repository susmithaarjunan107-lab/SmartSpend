import Papa from 'papaparse';
import { categoryName } from './categories.js';

const TRANSACTION_FIELDS = [
  'Date',
  'Description',
  'Type',
  'Category',
  'Amount',
  'Currency',
  'Payment Method',
  'Notes',
  'Id',
];

export function transactionsToCsv(transactions, categories, currency = 'INR') {
  const data = transactions.map((transaction) => ({
    Date: transaction.date,
    Description: transaction.description,
    Type: transaction.type,
    Category: categoryName(categories, transaction.categoryId),
    Amount: transaction.amount,
    Currency: currency,
    'Payment Method': transaction.paymentMethod,
    Notes: transaction.notes || '',
    Id: transaction.id,
  }));
  return Papa.unparse({ fields: TRANSACTION_FIELDS, data });
}

export function rowsToCsv(fields, rows) {
  return Papa.unparse({ fields, data: rows });
}

export function downloadTextFile(filename, contents, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
