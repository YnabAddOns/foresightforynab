import { DateTime, DateTimeMaybeValid } from 'luxon';
import * as ynab from 'ynab';

export function storePlans(plans: any) {
    localStorage.setItem('budgetsData', JSON.stringify(plans));
}

export interface Plans {
    budgets: ynab.BudgetDetail[];
    default_budget: ynab.BudgetDetail;
}

export function getPlans(): Plans {
    return JSON.parse(
        localStorage.getItem('budgetsData') ??
        JSON.stringify({
            budgets: [],
            defaultBudget: {
                id: null,
                name: null,
                last_modified_on: null,
                first_month: null,
                last_month: null,
                date_format: { format: null },
                currency_format: {
                    iso_code: null,
                    example_format: null,
                    decimal_digits: null,
                    decimal_separator: null,
                    symbol_first: null,
                    group_separator: null,
                    currency_symbol: null,
                    display_symbol: null,
                },
            },
        }),
    );
}

export function storePlan(plan: any, key: string) {
    localStorage.setItem(`plan-${key}`, JSON.stringify(plan));
}

export interface PlanWithServerKnowledge {
    budget: ynab.BudgetDetail;
    server_knowledge: number;
}

export function getPlan(key: string): PlanWithServerKnowledge {
    return JSON.parse(localStorage.getItem(`plan-${key}`) ?? JSON.stringify({}));
}

export function getPlanFromBudgetsData(key: string): PlanWithServerKnowledge | null {
    const plans = getPlans();
    const plan = plans.budgets.find((plan: any) => plan.id === key);

    if (!plan) {
        return null;
    }

    return {
        budget: plan,
        server_knowledge: 0,
    };
}

export function storeStartDate(startDate: any) {
    localStorage.setItem('startDate', startDate);
}

export function getStartDate(): string {
    const date = new Date();

    return localStorage.getItem('startDate') ?? DateTime.local(date.getFullYear(), date.getMonth(), 1).toFormat('yyyy-MM-dd');
}

export function storeEndDate(endDate: any) {
    localStorage.setItem('endDate', endDate);
}

export function getEndDate(): string {
    const date = new Date();

    return (
        localStorage.getItem('endDate') ??
        DateTime.local(date.getFullYear(), date.getMonth() + 1)
            .minus({ days: 1 })
            .toFormat('yyyy-MM-dd')
    );
}

export function storeFlowType(flowType: any) {
    localStorage.setItem('flowType', flowType);
}

export function getFlowType() {
    const flowType = localStorage.getItem('flowType') ?? localStorage.getItem('inflowOrOutflow');

    if (flowType === 'outflow') {
        return 'outflow';
    }

    if (flowType === 'inflow') {
        return 'inflow';
    }

    return 'all';
}

export function storeIncludeTransfers(includeTransfers: any) {
    localStorage.setItem('includeTransfers', JSON.stringify(includeTransfers as boolean));
}

export function getIncludeTransfers(): boolean {
    return localStorage.getItem('includeTransfers') === 'true';
}

export function storeSelectedPlanKey(selectedPlanKey: string) {
    localStorage.setItem('selectedBudget', selectedPlanKey);
}

export function getSelectedPlanKey(): string {
    return localStorage.getItem('selectedBudget') ?? '';
}

export function storeYearAccordions(yearAccordions: number[]) {
    localStorage.setItem('yearAccordions', JSON.stringify(yearAccordions));
}

export function getYearAccordions(): number[] {
    return JSON.parse(localStorage.getItem('yearAccordions') ?? '[]');
}

export function clearAllData(): void {
    localStorage.clear();
}

export function checkForStorageCompatibility(): void {
    const uid = new Date().getMilliseconds().toString();

    window.localStorage.setItem(uid, uid);

    const fail = window.localStorage.getItem(uid) != uid;

    window.localStorage.removeItem(uid);

    if (fail) {
        throw new Error('Local storage is not available on this browser');
    }
}

export function storeLastCallDate(): void {
    window.localStorage.setItem('lastCallDate', DateTime.local().toString());
}

export function getLastCallDate(): DateTimeMaybeValid | null {
    const result = window.localStorage.getItem('lastCallDate');

    return result ? DateTime.fromISO(result) : null;
}

export const repeating = {
    storeSelectedSort: (selectedSort: string) => {
        localStorage.setItem('repeatingSelectedSort', selectedSort);
    },
    getSelectedSort: () => {
        return localStorage.getItem('repeatingSelectedSort');
    },
    storeSortOrder: (sortOrder: 'desc|asc' | string) => {
        localStorage.setItem('repeatingSortOrder', sortOrder);
    },
    getSortOrder: () => {
        return localStorage.getItem('repeatingSortOrder');
    },
    storeShowRelativeDates: (showRelativeDates: boolean) => {
        localStorage.setItem('repeatingShowRelativeDates', showRelativeDates.toString());
    },
    getShowRelativeDates: () => {
        return localStorage.getItem('repeatingShowRelativeDates') === 'true';
    },
};
