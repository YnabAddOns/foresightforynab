import { DateTime } from 'luxon';
import * as ynab from 'ynab';

export interface SampleDataConfig {
    includeRepeatingTransactions: boolean;
    includeNonRepeatingTransactions: boolean;
    includeHistoricalTransactions: boolean;
    includeSubtransactions: boolean;
}

export function generateSampleData(
    config: SampleDataConfig = {
        includeRepeatingTransactions: true,
        includeNonRepeatingTransactions: true,
        includeHistoricalTransactions: true,
        includeSubtransactions: true,
    },
) {
    const sampleBudget: ynab.BudgetDetail = {
        id: 'sample-budget-id',
        name: 'Sample Budget',
        last_modified_on: DateTime.local().toISO(),
        first_month: DateTime.local().minus({ months: 6 }).toFormat('yyyy-MM'),
        last_month: DateTime.local().plus({ months: 12 }).toFormat('yyyy-MM'),
        date_format: { format: 'MM/DD/YYYY' },
        currency_format: {
            iso_code: 'USD',
            example_format: '123,456.78',
            decimal_digits: 2,
            decimal_separator: '.',
            symbol_first: true,
            group_separator: ',',
            currency_symbol: '$',
            display_symbol: true,
        },
        accounts: generateSampleAccounts(),
        payees: generateSamplePayees(),
        payee_locations: [],
        category_groups: generateSampleCategoryGroups(),
        categories: generateSampleCategories(),
        months: [],
        transactions: config.includeHistoricalTransactions ? generateSampleHistoricalTransactions() : [],
        subtransactions: config.includeSubtransactions ? generateSampleSubtransactions() : [],
        scheduled_transactions: generateSampleScheduledTransactions(config),
        scheduled_subtransactions: config.includeSubtransactions ? generateSampleScheduledSubtransactions() : [],
    };

    return {
        budget: sampleBudget,
        server_knowledge: 0,
    };
}

function generateSampleAccounts(): ynab.Account[] {
    return [
        {
            id: 'checking-account',
            name: 'Checking Account',
            type: 'checking',
            on_budget: true,
            closed: false,
            note: null,
            balance: 5000000, // $5,000.00
            cleared_balance: 5000000,
            uncleared_balance: 0,
            transfer_payee_id: 'transfer-payee-checking',
            direct_import_linked: false,
            direct_import_in_error: false,
            last_reconciled_at: DateTime.local().minus({ days: 7 }).toISO(),
            debt_original_balance: null,
            debt_interest_rates: null,
            debt_minimum_payments: null,
            debt_escrow_amounts: null,
            deleted: false,
        },
        {
            id: 'savings-account',
            name: 'Savings Account',
            type: 'savings',
            on_budget: true,
            closed: false,
            note: null,
            balance: 25000000, // $25,000.00
            cleared_balance: 25000000,
            uncleared_balance: 0,
            transfer_payee_id: 'transfer-payee-savings',
            direct_import_linked: false,
            direct_import_in_error: false,
            last_reconciled_at: DateTime.local().minus({ days: 14 }).toISO(),
            debt_original_balance: null,
            debt_interest_rates: null,
            debt_minimum_payments: null,
            debt_escrow_amounts: null,
            deleted: false,
        },
        {
            id: 'credit-card',
            name: 'Credit Card',
            type: 'creditCard',
            on_budget: true,
            closed: false,
            note: null,
            balance: -1500000, // -$1,500.00
            cleared_balance: -1500000,
            uncleared_balance: 0,
            transfer_payee_id: 'transfer-payee-credit',
            direct_import_linked: false,
            direct_import_in_error: false,
            last_reconciled_at: DateTime.local().minus({ days: 3 }).toISO(),
            debt_original_balance: null,
            debt_interest_rates: null,
            debt_minimum_payments: null,
            debt_escrow_amounts: null,
            deleted: false,
        },
    ];
}

function generateSamplePayees(): ynab.Payee[] {
    return [
        {
            id: 'netflix',
            name: 'Netflix',
            transfer_account_id: null,
            deleted: false,
        },
        {
            id: 'spotify',
            name: 'Spotify',
            transfer_account_id: null,
            deleted: false,
        },
        {
            id: 'amazon-prime',
            name: 'Amazon Prime',
            transfer_account_id: null,
            deleted: false,
        },
        {
            id: 'gym-membership',
            name: 'Planet Fitness',
            transfer_account_id: null,
            deleted: false,
        },
        {
            id: 'car-insurance',
            name: 'Geico',
            transfer_account_id: null,
            deleted: false,
        },
        {
            id: 'rent',
            name: 'Apartment Complex',
            transfer_account_id: null,
            deleted: false,
        },
        {
            id: 'electric-bill',
            name: 'Electric Company',
            transfer_account_id: null,
            deleted: false,
        },
        {
            id: 'internet-bill',
            name: 'Comcast',
            transfer_account_id: null,
            deleted: false,
        },
        {
            id: 'salary',
            name: 'Employer Inc.',
            transfer_account_id: null,
            deleted: false,
        },
        {
            id: 'freelance',
            name: 'Freelance Client',
            transfer_account_id: null,
            deleted: false,
        },
        {
            id: 'transfer-payee-checking',
            name: 'Checking Account',
            transfer_account_id: 'checking-account',
            deleted: false,
        },
        {
            id: 'transfer-payee-savings',
            name: 'Savings Account',
            transfer_account_id: 'savings-account',
            deleted: false,
        },
        {
            id: 'transfer-payee-credit',
            name: 'Credit Card',
            transfer_account_id: 'credit-card',
            deleted: false,
        },
    ];
}

function generateSampleCategoryGroups(): ynab.CategoryGroup[] {
    return [
        {
            id: 'monthly-bills',
            name: 'Monthly Bills',
            hidden: false,
            deleted: false,
        },
        {
            id: 'entertainment',
            name: 'Entertainment',
            hidden: false,
            deleted: false,
        },
        {
            id: 'transportation',
            name: 'Transportation',
            hidden: false,
            deleted: false,
        },
        {
            id: 'income',
            name: 'Income',
            hidden: false,
            deleted: false,
        },
        {
            id: 'savings',
            name: 'Savings',
            hidden: false,
            deleted: false,
        },
    ];
}

function generateSampleCategories(): ynab.Category[] {
    return [
        // Monthly Bills
        {
            id: 'rent-category',
            category_group_id: 'monthly-bills',
            name: 'Rent',
            hidden: false,
            original_category_group_id: 'monthly-bills',
            note: null,
            budgeted: 0,
            activity: 0,
            balance: 0,
            goal_type: null,
            goal_day: null,
            goal_cadence: null,
            goal_cadence_frequency: null,
            goal_creation_month: null,
            goal_target: null,
            goal_target_month: null,
            goal_percentage_complete: null,
            goal_months_to_budget: null,
            goal_under_funded: null,
            goal_overall_funded: null,
            goal_overall_left: null,
            deleted: false,
        },
        {
            id: 'utilities-category',
            category_group_id: 'monthly-bills',
            name: 'Utilities',
            hidden: false,
            original_category_group_id: 'monthly-bills',
            note: null,
            budgeted: 0,
            activity: 0,
            balance: 0,
            goal_type: null,
            goal_day: null,
            goal_cadence: null,
            goal_cadence_frequency: null,
            goal_creation_month: null,
            goal_target: null,
            goal_target_month: null,
            goal_percentage_complete: null,
            goal_months_to_budget: null,
            goal_under_funded: null,
            goal_overall_funded: null,
            goal_overall_left: null,
            deleted: false,
        },
        {
            id: 'insurance-category',
            category_group_id: 'monthly-bills',
            name: 'Insurance',
            hidden: false,
            original_category_group_id: 'monthly-bills',
            note: null,
            budgeted: 0,
            activity: 0,
            balance: 0,
            goal_type: null,
            goal_day: null,
            goal_cadence: null,
            goal_cadence_frequency: null,
            goal_creation_month: null,
            goal_target: null,
            goal_target_month: null,
            goal_percentage_complete: null,
            goal_months_to_budget: null,
            goal_under_funded: null,
            goal_overall_funded: null,
            goal_overall_left: null,
            deleted: false,
        },
        // Entertainment
        {
            id: 'streaming-category',
            category_group_id: 'entertainment',
            name: 'Streaming Services',
            hidden: false,
            original_category_group_id: 'entertainment',
            note: null,
            budgeted: 0,
            activity: 0,
            balance: 0,
            goal_type: null,
            goal_day: null,
            goal_cadence: null,
            goal_cadence_frequency: null,
            goal_creation_month: null,
            goal_target: null,
            goal_target_month: null,
            goal_percentage_complete: null,
            goal_months_to_budget: null,
            goal_under_funded: null,
            goal_overall_funded: null,
            goal_overall_left: null,
            deleted: false,
        },
        {
            id: 'gym-category',
            category_group_id: 'entertainment',
            name: 'Gym Membership',
            hidden: false,
            original_category_group_id: 'entertainment',
            note: null,
            budgeted: 0,
            activity: 0,
            balance: 0,
            goal_type: null,
            goal_day: null,
            goal_cadence: null,
            goal_cadence_frequency: null,
            goal_creation_month: null,
            goal_target: null,
            goal_target_month: null,
            goal_percentage_complete: null,
            goal_months_to_budget: null,
            goal_under_funded: null,
            goal_overall_funded: null,
            goal_overall_left: null,
            deleted: false,
        },
        // Transportation
        {
            id: 'car-insurance-category',
            category_group_id: 'transportation',
            name: 'Car Insurance',
            hidden: false,
            original_category_group_id: 'transportation',
            note: null,
            budgeted: 0,
            activity: 0,
            balance: 0,
            goal_type: null,
            goal_day: null,
            goal_cadence: null,
            goal_cadence_frequency: null,
            goal_creation_month: null,
            goal_target: null,
            goal_target_month: null,
            goal_percentage_complete: null,
            goal_months_to_budget: null,
            goal_under_funded: null,
            goal_overall_funded: null,
            goal_overall_left: null,
            deleted: false,
        },
        // Income
        {
            id: 'salary-category',
            category_group_id: 'income',
            name: 'Salary',
            hidden: false,
            original_category_group_id: 'income',
            note: null,
            budgeted: 0,
            activity: 0,
            balance: 0,
            goal_type: null,
            goal_day: null,
            goal_cadence: null,
            goal_cadence_frequency: null,
            goal_creation_month: null,
            goal_target: null,
            goal_target_month: null,
            goal_percentage_complete: null,
            goal_months_to_budget: null,
            goal_under_funded: null,
            goal_overall_funded: null,
            goal_overall_left: null,
            deleted: false,
        },
        {
            id: 'freelance-category',
            category_group_id: 'income',
            name: 'Freelance Income',
            hidden: false,
            original_category_group_id: 'income',
            note: null,
            budgeted: 0,
            activity: 0,
            balance: 0,
            goal_type: null,
            goal_day: null,
            goal_cadence: null,
            goal_cadence_frequency: null,
            goal_creation_month: null,
            goal_target: null,
            goal_target_month: null,
            goal_percentage_complete: null,
            goal_months_to_budget: null,
            goal_under_funded: null,
            goal_overall_funded: null,
            goal_overall_left: null,
            deleted: false,
        },
        // Savings
        {
            id: 'emergency-fund-category',
            category_group_id: 'savings',
            name: 'Emergency Fund',
            hidden: false,
            original_category_group_id: 'savings',
            note: null,
            budgeted: 0,
            activity: 0,
            balance: 0,
            goal_type: null,
            goal_day: null,
            goal_cadence: null,
            goal_cadence_frequency: null,
            goal_creation_month: null,
            goal_target: null,
            goal_target_month: null,
            goal_percentage_complete: null,
            goal_months_to_budget: null,
            goal_under_funded: null,
            goal_overall_funded: null,
            goal_overall_left: null,
            deleted: false,
        },
    ];
}

function generateSampleScheduledTransactions(config: SampleDataConfig): ynab.ScheduledTransactionSummary[] {
    const transactions: ynab.ScheduledTransactionSummary[] = [];

    if (config.includeRepeatingTransactions) {
        // Monthly repeating transactions
        transactions.push(
            {
                id: 'netflix-monthly',
                date_first: DateTime.local().minus({ months: 6 }).toFormat('yyyy-MM-dd'),
                date_next: DateTime.local().plus({ days: 5 }).toFormat('yyyy-MM-dd'),
                frequency: 'monthly',
                amount: -1599, // -$15.99
                memo: 'Netflix subscription',
                flag_color: null,
                flag_name: null,
                account_id: 'checking-account',
                payee_id: 'netflix',
                category_id: 'streaming-category',
                transfer_account_id: null,
                deleted: false,
            },
            {
                id: 'spotify-monthly',
                date_first: DateTime.local().minus({ months: 3 }).toFormat('yyyy-MM-dd'),
                date_next: DateTime.local().plus({ days: 12 }).toFormat('yyyy-MM-dd'),
                frequency: 'monthly',
                amount: -999, // -$9.99
                memo: 'Spotify Premium',
                flag_color: null,
                flag_name: null,
                account_id: 'checking-account',
                payee_id: 'spotify',
                category_id: 'streaming-category',
                transfer_account_id: null,
                deleted: false,
            },
            {
                id: 'amazon-prime-yearly',
                date_first: DateTime.local().minus({ months: 12 }).toFormat('yyyy-MM-dd'),
                date_next: DateTime.local().plus({ months: 2, days: 15 }).toFormat('yyyy-MM-dd'),
                frequency: 'yearly',
                amount: -11900, // -$119.00
                memo: 'Amazon Prime annual membership',
                flag_color: null,
                flag_name: null,
                account_id: 'checking-account',
                payee_id: 'amazon-prime',
                category_id: 'streaming-category',
                transfer_account_id: null,
                deleted: false,
            },
            {
                id: 'gym-monthly',
                date_first: DateTime.local().minus({ months: 2 }).toFormat('yyyy-MM-dd'),
                date_next: DateTime.local().plus({ days: 3 }).toFormat('yyyy-MM-dd'),
                frequency: 'monthly',
                amount: -2499, // -$24.99
                memo: 'Planet Fitness membership',
                flag_color: null,
                flag_name: null,
                account_id: 'checking-account',
                payee_id: 'gym-membership',
                category_id: 'gym-category',
                transfer_account_id: null,
                deleted: false,
            },
            {
                id: 'car-insurance-quarterly',
                date_first: DateTime.local().minus({ months: 9 }).toFormat('yyyy-MM-dd'),
                date_next: DateTime.local().plus({ months: 1, days: 8 }).toFormat('yyyy-MM-dd'),
                frequency: 'every3Months',
                amount: -45000, // -$450.00
                memo: 'Car insurance premium',
                flag_color: null,
                flag_name: null,
                account_id: 'checking-account',
                payee_id: 'car-insurance',
                category_id: 'car-insurance-category',
                transfer_account_id: null,
                deleted: false,
            },
            {
                id: 'salary-biweekly',
                date_first: DateTime.local().minus({ months: 6 }).toFormat('yyyy-MM-dd'),
                date_next: DateTime.local().plus({ days: 7 }).toFormat('yyyy-MM-dd'),
                frequency: 'everyOtherWeek',
                amount: 250000, // $2,500.00
                memo: 'Bi-weekly salary',
                flag_color: null,
                flag_name: null,
                account_id: 'checking-account',
                payee_id: 'salary',
                category_id: 'salary-category',
                transfer_account_id: null,
                deleted: false,
            },
            {
                id: 'freelance-monthly',
                date_first: DateTime.local().minus({ months: 4 }).toFormat('yyyy-MM-dd'),
                date_next: DateTime.local().plus({ days: 10 }).toFormat('yyyy-MM-dd'),
                frequency: 'monthly',
                amount: 150000, // $1,500.00
                memo: 'Monthly freelance payment',
                flag_color: null,
                flag_name: null,
                account_id: 'checking-account',
                payee_id: 'freelance',
                category_id: 'freelance-category',
                transfer_account_id: null,
                deleted: false,
            },
        );
    }

    if (config.includeNonRepeatingTransactions) {
        // Non-repeating scheduled transactions
        transactions.push(
            {
                id: 'rent-monthly',
                date_first: DateTime.local().toFormat('yyyy-MM-dd'),
                date_next: DateTime.local().plus({ months: 1, days: 1 }).toFormat('yyyy-MM-dd'),
                frequency: 'never',
                amount: -180000, // -$1,800.00
                memo: 'Monthly rent payment',
                flag_color: null,
                flag_name: null,
                account_id: 'checking-account',
                payee_id: 'rent',
                category_id: 'rent-category',
                transfer_account_id: null,
                deleted: false,
            },
            {
                id: 'electric-bill-monthly',
                date_first: DateTime.local().toFormat('yyyy-MM-dd'),
                date_next: DateTime.local().plus({ months: 1, days: 15 }).toFormat('yyyy-MM-dd'),
                frequency: 'never',
                amount: -8500, // -$85.00
                memo: 'Electric bill',
                flag_color: null,
                flag_name: null,
                account_id: 'checking-account',
                payee_id: 'electric-bill',
                category_id: 'utilities-category',
                transfer_account_id: null,
                deleted: false,
            },
            {
                id: 'internet-bill-monthly',
                date_first: DateTime.local().toFormat('yyyy-MM-dd'),
                date_next: DateTime.local().plus({ months: 1, days: 20 }).toFormat('yyyy-MM-dd'),
                frequency: 'never',
                amount: -7999, // -$79.99
                memo: 'Internet service',
                flag_color: null,
                flag_name: null,
                account_id: 'checking-account',
                payee_id: 'internet-bill',
                category_id: 'utilities-category',
                transfer_account_id: null,
                deleted: false,
            },
        );
    }

    return transactions;
}

function generateSampleScheduledSubtransactions(): ynab.ScheduledSubTransaction[] {
    return [
        {
            id: 'netflix-basic',
            scheduled_transaction_id: 'netflix-monthly',
            amount: -899, // -$8.99
            memo: 'Basic plan',
            payee_id: 'netflix',
            payee_name: 'Netflix',
            category_id: 'streaming-category',
            category_name: 'Streaming Services',
            transfer_account_id: null,
            deleted: false,
        },
        {
            id: 'netflix-premium',
            scheduled_transaction_id: 'netflix-monthly',
            amount: -700, // -$7.00
            memo: 'Premium upgrade',
            payee_id: 'netflix',
            payee_name: 'Netflix',
            category_id: 'streaming-category',
            category_name: 'Streaming Services',
            transfer_account_id: null,
            deleted: false,
        },
    ];
}

function generateSampleHistoricalTransactions(): ynab.TransactionSummary[] {
    const transactions: ynab.TransactionSummary[] = [];
    const now = DateTime.local();

    // Generate historical transactions for the past 6 months
    for (let i = 0; i < 6; i++) {
        const month = now.minus({ months: i });

        // Netflix payments
        transactions.push({
            id: `netflix-historical-${i}`,
            date: month.plus({ days: 5 }).toFormat('yyyy-MM-dd'),
            amount: -1599,
            memo: 'Netflix subscription',
            cleared: 'cleared',
            approved: true,
            flag_color: null,
            flag_name: null,
            account_id: 'checking-account',
            payee_id: 'netflix',
            category_id: 'streaming-category',
            transfer_account_id: null,
            transfer_transaction_id: null,
            matched_transaction_id: null,
            import_id: null,
            import_payee_name: null,
            import_payee_name_original: null,
            debt_transaction_type: null,
            deleted: false,
        });

        // Spotify payments
        transactions.push({
            id: `spotify-historical-${i}`,
            date: month.plus({ days: 12 }).toFormat('yyyy-MM-dd'),
            amount: -999,
            memo: 'Spotify Premium',
            cleared: 'cleared',
            approved: true,
            flag_color: null,
            flag_name: null,
            account_id: 'checking-account',
            payee_id: 'spotify',
            category_id: 'streaming-category',
            transfer_account_id: null,
            transfer_transaction_id: null,
            matched_transaction_id: null,
            import_id: null,
            import_payee_name: null,
            import_payee_name_original: null,
            debt_transaction_type: null,
            deleted: false,
        });

        // Gym payments
        transactions.push({
            id: `gym-historical-${i}`,
            date: month.plus({ days: 3 }).toFormat('yyyy-MM-dd'),
            amount: -2499,
            memo: 'Planet Fitness membership',
            cleared: 'cleared',
            approved: true,
            flag_color: null,
            flag_name: null,
            account_id: 'checking-account',
            payee_id: 'gym-membership',
            category_id: 'gym-category',
            transfer_account_id: null,
            transfer_transaction_id: null,
            matched_transaction_id: null,
            import_id: null,
            import_payee_name: null,
            import_payee_name_original: null,
            debt_transaction_type: null,
            deleted: false,
        });

        // Salary payments (bi-weekly)
        for (let j = 0; j < 2; j++) {
            transactions.push({
                id: `salary-historical-${i}-${j}`,
                date: month.plus({ days: 7 + j * 14 }).toFormat('yyyy-MM-dd'),
                amount: 250000,
                memo: 'Bi-weekly salary',
                cleared: 'cleared',
                approved: true,
                flag_color: null,
                flag_name: null,
                account_id: 'checking-account',
                payee_id: 'salary',
                category_id: 'salary-category',
                transfer_account_id: null,
                transfer_transaction_id: null,
                matched_transaction_id: null,
                import_id: null,
                import_payee_name: null,
                import_payee_name_original: null,
                debt_transaction_type: null,
                deleted: false,
            });
        }
    }

    return transactions;
}

function generateSampleSubtransactions(): ynab.SubTransaction[] {
    return [
        {
            id: 'netflix-basic-historical',
            transaction_id: 'netflix-historical-0',
            amount: -899,
            memo: 'Basic plan',
            payee_id: 'netflix',
            payee_name: 'Netflix',
            category_id: 'streaming-category',
            category_name: 'Streaming Services',
            transfer_account_id: null,
            transfer_transaction_id: null,
            deleted: false,
        },
        {
            id: 'netflix-premium-historical',
            transaction_id: 'netflix-historical-0',
            amount: -700,
            memo: 'Premium upgrade',
            payee_id: 'netflix',
            payee_name: 'Netflix',
            category_id: 'streaming-category',
            category_name: 'Streaming Services',
            transfer_account_id: null,
            transfer_transaction_id: null,
            deleted: false,
        },
    ];
}

export function injectSampleData(config?: SampleDataConfig) {
    const sampleData = generateSampleData(config);

    // Store the sample data in localStorage
    localStorage.setItem('plan-sample-budget-id', JSON.stringify(sampleData));
    localStorage.setItem('selectedBudget', 'sample-budget-id');

    // Preserve original live budgets data before overwriting
    const originalBudgetsData = localStorage.getItem('budgetsData');
    if (originalBudgetsData) {
        try {
            const parsed = JSON.parse(originalBudgetsData);
            // Only preserve if it contains live budgets (not sample data)
            if (parsed.budgets && parsed.budgets.length > 0 && !parsed.budgets.every((budget: any) => budget.id === 'sample-budget-id')) {
                localStorage.setItem('originalBudgetsData', originalBudgetsData);

                // Also preserve all live plan data
                parsed.budgets.forEach((budget: any) => {
                    if (budget.id !== 'sample-budget-id') {
                        const planData = localStorage.getItem(`plan-${budget.id}`);
                        if (planData) {
                            localStorage.setItem(`originalPlan-${budget.id}`, planData);
                        }
                    }
                });
            }
        } catch (e) {
            // If parsing fails, don't preserve
            console.error('Error parsing budgetsData:', e);
        }
    }

    // Store sample budgets list
    localStorage.setItem(
        'budgetsData',
        JSON.stringify({
            budgets: [sampleData.budget],
            default_budget: sampleData.budget,
        }),
    );

    return sampleData;
}

export function clearSampleData() {
    localStorage.removeItem('plan-sample-budget-id');
    localStorage.removeItem('selectedBudget');

    // Restore original live budgets data if it exists
    const originalBudgetsData = localStorage.getItem('originalBudgetsData');
    if (originalBudgetsData) {
        localStorage.setItem('budgetsData', originalBudgetsData);
        localStorage.removeItem('originalBudgetsData');

        // Also restore all live plan data
        try {
            const parsed = JSON.parse(originalBudgetsData);
            if (parsed.budgets) {
                parsed.budgets.forEach((budget: any) => {
                    if (budget.id !== 'sample-budget-id') {
                        const originalPlanData = localStorage.getItem(`originalPlan-${budget.id}`);
                        if (originalPlanData) {
                            localStorage.setItem(`plan-${budget.id}`, originalPlanData);
                            localStorage.removeItem(`originalPlan-${budget.id}`);
                        }
                    }
                });
            }
        } catch (e) {
            // If parsing fails, continue without restoring plan data
            console.error('Error parsing budgetsData:', e);
        }
    } else {
        // Only remove budgetsData if it only contains sample data
        const budgetsData = localStorage.getItem('budgetsData');
        if (budgetsData) {
            try {
                const parsed = JSON.parse(budgetsData);
                // If budgetsData only contains the sample budget, remove it
                if (parsed.budgets && parsed.budgets.length === 1 && parsed.budgets[0].id === 'sample-budget-id') {
                    localStorage.removeItem('budgetsData');
                }
            } catch (e) {
                // If parsing fails, remove it to be safe
                localStorage.removeItem('budgetsData');
                console.error('Error parsing budgetsData:', e);
            }
        }
    }
}
