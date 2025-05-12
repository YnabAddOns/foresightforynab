import { DateTime } from 'luxon';
import * as ynab from 'ynab';

export interface ScheduledTransaction extends Omit<ynab.ScheduledTransactionSummary, 'date' | 'date_next'> {
    date: DateTime;
    date_next: DateTime;
    flow_type: 'outflow' | 'inflow';
    is_transfer: boolean;
    payee: {
        id: string;
        name: string;
    };
    category: {
        id: string;
        name: string;
        category_group: {
            id: string;
            name: string;
        };
    };
    real_amount: number;
    real_absolute_amount: number;
    subtransactions: ScheduledSubTransaction[];
}

export interface Category extends ynab.Category {
    category_group: ynab.CategoryGroup | null;
}

export interface ScheduledSubTransaction extends Omit<ynab.ScheduledSubTransaction, 'date' | 'date_next'> {
    date: DateTime;
    date_next: DateTime;
    flow_type: 'outflow' | 'inflow';
    is_transfer: boolean;
    payee: ynab.Payee;
    category: Category;
    real_amount: number;
    real_absolute_amount: number;
}
