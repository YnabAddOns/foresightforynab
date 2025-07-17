<script setup lang="ts">
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import CardContent from '@/components/ui/CardContent.vue';
import CardDescription from '@/components/ui/CardDescription.vue';
import CardHeader from '@/components/ui/CardHeader.vue';
import CardTitle from '@/components/ui/CardTitle.vue';
import Input from '@/components/ui/Input.vue';
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue';
import Pagination from '@/components/ui/Pagination.vue';
import { ScheduledTransaction } from '@/composables/useInterface';
import {
    checkForStorageCompatibility,
    clearAllData,
    getEndDate,
    getFlowType,
    getIncludeTransfers,
    getLastCallDate,
    getPlan,
    getPlans,
    getSelectedPlanKey,
    getStartDate,
    getYearAccordions,
    Plans,
    PlanWithServerKnowledge,
    storeEndDate,
    storeFlowType,
    storeIncludeTransfers,
    storeLastCallDate,
    storePlan,
    storePlans,
    storeSelectedPlanKey,
    storeStartDate,
    storeYearAccordions,
} from '@/composables/useStorage';
import { Head, router } from '@inertiajs/vue3';
import { DateTime, Interval } from 'luxon';
import { computed, ComputedRef, onMounted, ref, ToRef, watch } from 'vue';
import * as ynab from 'ynab';
import Layout from '../layouts/AppLayout.vue';

defineOptions({ layout: Layout });

const props = defineProps({
    ynabAccessToken: {
        type: [String, null],
        default: null,
    },
    ynabAuthorizationUrl: {
        type: String,
        required: true,
    },
    name: String,
    errors: Object,
    ziggy: Object,
    cookieConsent: Boolean,
});

const ynabApi = ref(props.ynabAccessToken ? new ynab.API(props.ynabAccessToken) : null);

onMounted(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));

    const access_token_url_param = params.get('access_token');

    if (access_token_url_param) {
        ynabApi.value = new ynab.API(access_token_url_param);

        try {
            router.post(route('access-token'), {
                access_token: access_token_url_param,
            });
        } catch (e: any) {
            console.error(e);
        }
    }
});

const supportsStorageOnBrowser = computed(() => {
    try {
        checkForStorageCompatibility();
    } catch (error) {
        console.error(error);

        return false;
    }

    return true;
});

const gettingListOfPlans = ref(false);

async function getListOfPlans(reload: boolean = false) {
    if (!ynabApi.value) {
        window.location.href = props.ynabAuthorizationUrl;

        return;
    }

    gettingListOfPlans.value = true;

    let planResponse: ynab.BudgetSummaryResponse;

    try {
        planResponse = await ynabApi.value?.budgets?.getBudgets();
    } catch (error: any) {
        console.error(error);

        gettingListOfPlans.value = false;

        if (error.error.id === '401') {
            window.location.href = props.ynabAuthorizationUrl;
        }

        return;
    }

    storePlans(planResponse.data);

    selectedPlanKey.value = planResponse.data?.default_budget?.id ?? '';

    gettingListOfPlans.value = false;

    if (reload) {
        window.location.reload();
    }
}

const gettingDataForPlan = ref(false);

async function getDataForPlan(reload: boolean = false) {
    if (!ynabApi.value) {
        window.location.href = props.ynabAuthorizationUrl;

        return;
    }

    let planByIdResponse: ynab.BudgetDetailResponse | undefined;

    if (!selectedPlanKey.value) {
        gettingDataForPlan.value = false;

        return;
    }

    gettingDataForPlan.value = true;

    try {
        // todo: implement server knowledge
        // const lastKnowledgeOfServer: number = plan.value?.server_knowledge;

        planByIdResponse = await ynabApi.value?.budgets?.getBudgetById(selectedPlanKey.value /**,lastKnowledgeOfServer*/);
    } catch (error: any) {
        console.error(error);

        gettingDataForPlan.value = false;

        if (error.error.id === '401') {
            window.location.href = props.ynabAuthorizationUrl;
        }

        return;
    }

    if (!planByIdResponse) {
        throw new Error('No results found for selected plan.');
    }

    storePlan(planByIdResponse.data, selectedPlanKey.value);

    storeLastCallDate();

    gettingDataForPlan.value = false;

    if (reload) {
        window.location.reload();
    }
}

function clearAllDataAndReload() {
    clearAllData();

    window.location.reload();
}

const plans: ComputedRef<Plans> = computed(() => {
    return getPlans();
});

const specifiedPlan: ComputedRef<PlanWithServerKnowledge> = computed(() => {
    return getPlan(selectedPlanKey.value);
});

const startDate = ref(getStartDate());

/* v8 ignore next 3 */
watch(startDate, (newValue) => {
    storeStartDate(newValue);
});

const adjustedStartDate = computed(() => {
    return DateTime.fromISO(startDate.value);
});

const endDate = ref(getEndDate());

/* v8 ignore next 3 */
watch(endDate, (newValue) => {
    storeEndDate(newValue);
});

const adjustedEndDate = computed(() => {
    return DateTime.fromISO(endDate.value);
});

const startAndEndDateInterval: ComputedRef<Interval> = computed(() => {
    return Interval.fromDateTimes(adjustedStartDate.value, adjustedEndDate.value);
});

const flowType = ref(getFlowType());

/* v8 ignore next 3 */
watch(flowType, (newValue) => {
    storeFlowType(newValue);
});

const includeTransfers = ref(getIncludeTransfers());

/* v8 ignore next 3 */
watch(includeTransfers, (newValue) => {
    storeIncludeTransfers(newValue);
});

const categories = computed(() => {
    return (
        specifiedPlan.value?.budget?.categories
            ?.filter((category: ynab.Category) => {
                return !category.deleted;
            })
            ?.map((category: ynab.Category) => {
                return {
                    ...category,
                    category_group:
                        (specifiedPlan.value?.budget?.category_groups ?? []).find((categoryGroup: ynab.CategoryGroup) => {
                            return categoryGroup.id === category.category_group_id;
                        }) ?? null,
                };
            }) ?? []
    );
});

const payees: ComputedRef<any[]> = computed(() => {
    return (
        specifiedPlan.value?.budget?.payees
            ?.filter((payee: ynab.Payee) => {
                return !payee.deleted;
            })
            ?.map((payee: ynab.Payee) => {
                return {
                    ...payee,
                    repeating_transaction:
                        repeatingTransactions.value?.find((transaction: any) => {
                            return transaction.payee_id === payee.id;
                        }) ?? null,
                };
            }) ?? []
    );
});

const repeatingTransactions = computed(() => {
    return (
        specifiedPlan.value?.budget?.scheduled_transactions
            ?.filter((transaction: ynab.ScheduledTransactionSummary) => {
                return transaction.frequency !== 'never' && !transaction?.deleted;
            })
            ?.map((transaction: ynab.ScheduledTransactionSummary) => {
                return {
                    ...transaction,
                };
            }) ?? []
    );
});

const scheduledTransactions = computed(() => {
    const scheduledSubtransactions =
        specifiedPlan.value?.budget?.scheduled_subtransactions
            ?.filter((subtransaction: ynab.ScheduledSubTransaction) => {
                return !subtransaction?.deleted;
            })
            ?.map((subtransaction: ynab.ScheduledSubTransaction) => {
                const realAmount = subtransaction.amount / 1000;

                return {
                    ...subtransaction,
                    real_amount: realAmount,
                    real_absolute_amount: Math.abs(realAmount),
                    flow_type: subtransaction.amount >= 0 ? 'inflow' : 'outflow',
                    is_transfer: !!subtransaction.transfer_account_id,
                    category:
                        categories.value.find((category: ynab.Category) => {
                            return category.id === subtransaction.category_id;
                        }) ?? null,
                };
            }) ?? [];

    return (
        specifiedPlan.value?.budget?.scheduled_transactions
            ?.filter((transaction: ynab.ScheduledTransactionSummary) => {
                return !transaction?.deleted;
            })
            ?.map((transaction: ynab.ScheduledTransactionSummary) => {
                const realAmount = transaction.amount / 1000;

                return {
                    ...transaction,
                    date: transaction?.date_next ? DateTime.fromISO(transaction.date_next) : null,
                    real_amount: realAmount,
                    real_absolute_amount: Math.abs(realAmount),
                    flow_type: transaction.amount >= 0 ? 'inflow' : 'outflow',
                    is_transfer: !!transaction.transfer_account_id,
                    category:
                        categories.value.find((category: ynab.Category) => {
                            return category.id === transaction.category_id;
                        }) ?? null,
                    payee:
                        payees.value.find((payee: any) => {
                            return payee.id === transaction.payee_id;
                        }) ?? null,
                    subtransactions:
                        scheduledSubtransactions.filter((subtransaction: ynab.ScheduledSubTransaction) => {
                            return subtransaction.scheduled_transaction_id === transaction.id;
                        }) ?? [],
                };
            }) ?? []
    );
});

function filterByFlowType(transaction: any) {
    if (flowType.value === 'all') {
        return true;
    }

    return transaction.flow_type === flowType.value;
}

function filterByIncludeTransfers(transaction: any) {
    if (includeTransfers.value) {
        return true;
    }

    return !transaction.is_transfer;
}

const flowTypeIsAll = computed(() => {
    return flowType.value === 'all';
});

interface Payee extends ynab.Payee {
    repeating_transaction: ynab.ScheduledTransactionDetail;
}

interface Category extends ynab.Category {
    category_group: ynab.CategoryGroup | null;
}

interface TableTransaction {
    id: string;
    date: DateTime | null;
    payee: Payee | null;
    category: Category | null;
    amount: number;
    absolute_amount: number;
    frequency: string | null;
    parent_transaction: any;
    flow_type: string;
}

const tableTransactions: ComputedRef<TableTransaction[]> = computed(() => {
    const result: Array<TableTransaction> = [];

    const getScheduledTransactionsWithRepeatingUpToEndDate = () => {
        const result: ScheduledTransaction[] = [];

        if (!endDate.value) {
            return [];
        }

        const endDateValue: DateTime = adjustedEndDate.value;

        const generateTransactionsForFrequency = (
            transaction: any,
            frequency: ynab.ScheduledTransactionFrequency,
            frequencyUnits: 'days' | 'weeks' | 'months' | 'years',
            frequencyMultiplier: number = 1,
        ) => {
            const thisResult: ScheduledTransaction[] = [];

            let date: DateTime = transaction.date;

            if (transaction.frequency === frequency) {
                while (date <= endDateValue) {
                    thisResult.push({
                        ...transaction,
                        date: date,
                        date_next: date,
                        flow_type: transaction.amount >= 0 ? 'inflow' : 'outflow',
                    });

                    date = date.plus({ [frequencyUnits]: frequencyMultiplier });
                }
            }

            return thisResult;
        };

        scheduledTransactions.value
            .filter((transaction) => {
                return transaction?.frequency !== null && transaction.frequency !== 'never' && !transaction.deleted;
            })
            .forEach((transaction) => {
                if (!transaction?.date) {
                    return;
                }

                result.push(...generateTransactionsForFrequency(transaction, 'daily', 'days'));
                result.push(...generateTransactionsForFrequency(transaction, 'weekly', 'weeks'));
                result.push(...generateTransactionsForFrequency(transaction, 'everyOtherWeek', 'weeks', 2));

                if (transaction.frequency === 'twiceAMonth') {
                    let date: DateTime = transaction.date;

                    const endOfMonthDate = date.endOf('month');

                    date = transaction.date;

                    const daysToGetToEndOfMonth = Math.floor(endOfMonthDate.diff(date, 'days').days);

                    const days = Math.floor(daysToGetToEndOfMonth / 2);

                    const temp = [];

                    const groupedResults = Object.groupBy(
                        generateTransactionsForFrequency(transaction, 'twiceAMonth', 'days', days).map((transaction) => {
                            const date: DateTime = transaction.date;

                            return {
                                ...transaction,
                                monthAndYear: date.toFormat('MMMM yyyy'),
                            };
                        }),
                        ({ monthAndYear }) => monthAndYear,
                    );

                    for (const [key] of Object.entries(groupedResults)) {
                        if (groupedResults[key] === undefined) {
                            continue;
                        }

                        temp.push(groupedResults[key][0]);
                        temp.push(groupedResults[key][1]);
                    }

                    result.push(...temp);
                }

                result.push(...generateTransactionsForFrequency(transaction, 'every4Weeks', 'weeks', 4));
                result.push(...generateTransactionsForFrequency(transaction, 'monthly', 'months'));
                result.push(...generateTransactionsForFrequency(transaction, 'everyOtherMonth', 'months', 2));
                result.push(...generateTransactionsForFrequency(transaction, 'every3Months', 'months', 3));
                result.push(...generateTransactionsForFrequency(transaction, 'every4Months', 'months', 4));
                result.push(...generateTransactionsForFrequency(transaction, 'twiceAYear', 'months', 6));
                result.push(...generateTransactionsForFrequency(transaction, 'yearly', 'years'));
                result.push(...generateTransactionsForFrequency(transaction, 'everyOtherYear', 'years', 2));
            });

        const repeatingScheduledTransactionsUpToEndDate = result;

        const nonRepeatingScheduledTransactions = scheduledTransactions.value.filter((transaction) => {
            return (transaction?.frequency === null || transaction.frequency === 'never') && !transaction.deleted;
        });

        return [...nonRepeatingScheduledTransactions, ...repeatingScheduledTransactionsUpToEndDate].sort((a, b) => {
            if (!(b?.date && a?.date)) {
                return 1;
            }

            return b.date.toMillis() - a.date.toMillis();
        });
    };

    const getFilteredFuture = () => {
        return (
            getScheduledTransactionsWithRepeatingUpToEndDate().filter((transaction) => {
                const date: DateTime | null = transaction?.date ?? null;

                if (!date) {
                    return false;
                }

                return (
                    (startAndEndDateInterval.value.contains(date) || date.hasSame(adjustedEndDate.value, 'day')) &&
                    filterByFlowType(transaction) &&
                    transaction?.deleted === false &&
                    filterByIncludeTransfers(transaction)
                );
            }) ?? []
        );
    };

    const getFilteredHistorical = () => {
        const subtransactions =
            specifiedPlan.value?.budget?.subtransactions
                ?.filter((subtransaction: ynab.SubTransaction) => {
                    return !subtransaction.deleted;
                })
                ?.map((subtransaction: ynab.SubTransaction) => {
                    const realAmount = subtransaction.amount / 1000;

                    return {
                        ...subtransaction,
                        real_amount: realAmount,
                        real_absolute_amount: Math.abs(realAmount),
                        flow_type: subtransaction.amount >= 0 ? 'inflow' : 'outflow',
                        is_transfer: !!subtransaction.transfer_account_id,
                        category:
                            categories.value.find((category: ynab.Category) => {
                                return category.id === subtransaction.category_id;
                            }) ?? null,
                    };
                }) ?? [];

        const transactions =
            specifiedPlan.value?.budget?.transactions?.map((transaction) => {
                const realAmount = transaction.amount / 1000;

                return {
                    ...transaction,
                    date: DateTime.fromISO(transaction.date),
                    real_amount: realAmount,
                    real_absolute_amount: Math.abs(realAmount),
                    flow_type: transaction.amount >= 0 ? 'inflow' : 'outflow',
                    is_transfer: !!transaction.transfer_account_id,
                    category:
                        categories.value.find((category: ynab.Category) => {
                            return category.id === transaction.category_id;
                        }) ?? null,
                    payee:
                        payees.value.find((payee: ynab.Payee) => {
                            return payee.id === transaction.payee_id;
                        }) ?? null,
                    subtransactions:
                        subtransactions.filter((subtransaction: ynab.SubTransaction) => {
                            return subtransaction.transaction_id === transaction.id;
                        }) ?? [],
                };
            }) ?? [];

        return (
            transactions.filter((transaction) => {
                return (
                    (startAndEndDateInterval.value.contains(transaction.date) || transaction.date.hasSame(adjustedEndDate.value, 'day')) &&
                    filterByFlowType(transaction) &&
                    !transaction?.deleted &&
                    filterByIncludeTransfers(transaction)
                );
            }) ?? []
        );
    };

    const mergedHistoricalAndFuture =
        [...getFilteredFuture(), ...getFilteredHistorical()].sort((a, b) => {
            if (!(b?.date && a?.date)) {
                return 1;
            }

            return b.date.toMillis() - a.date.toMillis();
        }) ?? [];

    mergedHistoricalAndFuture.forEach(function (transaction) {
        if (transaction.subtransactions.length) {
            transaction.subtransactions.forEach((subtransaction) => {
                const payee = payees.value.filter((payee: ynab.Payee) => payee.id === subtransaction.payee_id)[0];

                const category = categories.value.filter((category: ynab.Category) => category.id === subtransaction.category_id)[0];

                result.push({
                    id: subtransaction.id,
                    date: transaction.date,
                    payee: payee ? payee : transaction.payee,
                    category: category ? category : (transaction.category as Category),
                    amount: subtransaction.real_amount,
                    absolute_amount: subtransaction.real_absolute_amount,
                    frequency: isScheduledTransaction(transaction) ? transaction.frequency : null,
                    parent_transaction: transaction,
                    flow_type: subtransaction.flow_type,
                });
            });
        } else {
            result.push({
                id: transaction.id,
                date: transaction.date,
                payee: transaction?.payee ?? null,
                category: (transaction?.category as Category) ?? null,
                amount: transaction.real_amount,
                absolute_amount: transaction.real_absolute_amount,
                frequency: isScheduledTransaction(transaction) ? transaction.frequency : null,
                parent_transaction: null,
                flow_type: transaction.flow_type,
            });
        }
    });

    return result.sort((a, b) => {
        if (!(b?.date && a?.date)) {
            return 1;
        }

        return b.date.toMillis() - a.date.toMillis();
    });
});

const filteredTotalAmount: ComputedRef<number> = computed(() => {
    return tableTransactions.value.reduce((acc: number, transaction) => {
        return acc + transaction.absolute_amount;
    }, 0);
});

const filteredTotalRevenue: ComputedRef<number> = computed(() => {
    return tableTransactions.value.reduce((acc: number, transaction) => {
        if (transaction.amount > 0) {
            return acc + transaction.absolute_amount;
        }

        return acc;
    }, 0);
});

const filteredTotalExpenses: ComputedRef<number> = computed(() => {
    return tableTransactions.value.reduce((acc: number, transaction) => {
        if (transaction.amount < 0) {
            return acc + transaction.absolute_amount;
        }

        return acc;
    }, 0);
});

const filteredNetAmount: ComputedRef<number> = computed(() => {
    return filteredTotalRevenue.value - filteredTotalExpenses.value;
});

const yearMonthAggregates = computed(() => {
    const start = adjustedStartDate.value;
    const end = adjustedEndDate.value;

    const years: any = [];

    for (let i = start.year; i <= end.year; i++) {
        const amount = tableTransactions.value
            .filter((transaction) => {
                if (!transaction?.date) {
                    return false;
                }

                return transaction.date.year === i;
            })
            .reduce((acc: number, transaction) => {
                return acc + transaction.absolute_amount;
            }, 0);

        const revenue = tableTransactions.value
            .filter((transaction) => {
                if (!transaction?.date) {
                    return false;
                }

                return transaction.date.year === i && transaction.amount > 0;
            })
            .reduce((acc: number, transaction) => {
                return acc + transaction.absolute_amount;
            }, 0);

        const expense = tableTransactions.value
            .filter((transaction) => {
                if (!transaction?.date) {
                    return false;
                }

                return transaction.date.year === i && transaction.amount < 0;
            })
            .reduce((acc: number, transaction) => {
                return acc + transaction.absolute_amount;
            }, 0);

        const net = revenue - expense;

        years.push({
            year: i,
            initialMonth: start.monthLong,
            months: [],
            amount,
            revenue,
            expense,
            net,
            current: DateTime.now().year === i,
        });

        for (let j = 0; j <= 12; j++) {
            const month = DateTime.local(i, j, 1);

            if (month >= start && month <= end) {
                const amount = tableTransactions.value
                    .filter((transaction) => {
                        if (!transaction?.date) {
                            return false;
                        }

                        return transaction.date.year === i && transaction.date.month === j;
                    })
                    .reduce((acc: number, transaction) => {
                        return acc + transaction.absolute_amount;
                    }, 0);

                const revenue = tableTransactions.value
                    .filter((transaction) => {
                        if (!transaction?.date) {
                            return false;
                        }

                        return transaction.date.year === i && transaction.date.month === j && transaction.amount > 0;
                    })
                    .reduce((acc: number, transaction) => {
                        return acc + transaction.absolute_amount;
                    }, 0);

                const expense = tableTransactions.value
                    .filter((transaction) => {
                        if (!transaction?.date) {
                            return false;
                        }

                        return transaction.date.year === i && transaction.date.month === j && transaction.amount < 0;
                    })
                    .reduce((acc: number, transaction) => {
                        return acc + transaction.absolute_amount;
                    }, 0);

                const net = revenue - expense;

                const result: any = {
                    name: month.monthLong,
                    amount,
                    revenue,
                    expense,
                    net,
                    current: DateTime.now().monthLong === month.monthLong && DateTime.now().year === i,
                };

                years[years.length - 1].months.push(result);
            }
        }
    }

    return years;
});

function transformDateToLocaleString(date: DateTime | null) {
    return date?.toLocaleString(DateTime.DATE_MED) ?? null;
}

function isScheduledTransaction(obj: any): obj is ScheduledTransaction {
    return 'frequency' in obj;
}

const defaultPlan: ComputedRef<ynab.BudgetDetail | null> = computed(() => {
    return plans?.value?.default_budget;
});

const listOfPlans: object = computed(() => {
    const result: any = {};

    if (defaultPlan.value) {
        result[defaultPlan.value.id] = defaultPlan.value.name;
    }

    plans.value.budgets.forEach((budget: ynab.BudgetDetail) => {
        result[budget.id] = budget.name;
    });

    return result;
});

const selectedPlanKey = ref(getSelectedPlanKey());

/* v8 ignore next 3 */
watch(selectedPlanKey, (newValue) => {
    storeSelectedPlanKey(newValue);
});

const yearAccordions: ToRef<Array<number>> = ref(getYearAccordions());

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Computed pagination values
const paginatedTransactions = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return tableTransactions.value.slice(start, end);
});

const totalPages = computed(() => {
    return Math.ceil(tableTransactions.value.length / itemsPerPage.value);
});

// Pagination handlers
function handlePageChange(page: number) {
    currentPage.value = page;
}

function handleItemsPerPageChange(newItemsPerPage: number) {
    itemsPerPage.value = newItemsPerPage;
    currentPage.value = 1; // Reset to first page when changing items per page
}

function isOpenYearAccordion(year: number) {
    return !!yearAccordions.value.filter((item) => year === item).length;
}

function setClosedYearAccordion(year: number) {
    yearAccordions.value = yearAccordions.value.filter((item) => year !== item);

    storeYearAccordions(yearAccordions.value);
}

function setOpenYearAccordion(year: number) {
    yearAccordions.value.push(year);

    storeYearAccordions(yearAccordions.value);
}

function dateIsFuture(date: DateTime | null) {
    if (!date) {
        return false;
    }

    return date > DateTime.now();
}

const lastCallDate = computed(() => {
    return getLastCallDate();
});

function exportCsv() {
    let csv = 'Date,Amount,Payee Name,Payee ID,Category Group,Category,Parent Payee Name,Parent Payee ID\n';

    tableTransactions.value.forEach((row) => {
        csv += '"';
        csv += row?.date?.toLocaleString() ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row.amount ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row.payee?.name ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row.payee?.id ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row.category?.category_group?.name ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row.category?.name ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row.parent_transaction?.payee?.name ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row.parent_transaction?.payee?.id ?? '';
        csv += '"';
        csv += '\n';
    });

    const anchor = document.createElement('a');
    anchor.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    anchor.target = '_blank';
    anchor.download = `transactions.csv`;
    anchor.click();
}

const consented = computed(() => props.cookieConsent);

function refresh() {
    window.location.reload();
}
</script>

<template>
    <Head title="Home">
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    </Head>

    <div v-if="consented">
        <div v-if="supportsStorageOnBrowser" class="space-y-8">
            <!-- Header Section -->
            <div class="space-y-4 text-center">
                <h1 class="text-4xl font-bold tracking-tight">Financial Forecast</h1>
                <p class="text-muted-foreground mx-auto max-w-3xl text-xl">
                    Analyze your future income and expenses based on your YNAB scheduled and repeating transactions.
                </p>
            </div>

            <!-- Controls Section -->
            <Card>
                <CardHeader>
                    <CardTitle>Controls</CardTitle>
                    <CardDescription>Manage your YNAB connection and data</CardDescription>
                </CardHeader>
                <CardContent class="space-y-6">
                    <!-- Plan Management -->
                    <div class="grid gap-6 md:grid-cols-2">
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold">Plan Management</h3>
                            <div class="flex flex-wrap gap-3">
                                <Button @click="getListOfPlans(true)" :loading="gettingListOfPlans" class="flex-1 md:flex-none">
                                    <svg v-if="!gettingListOfPlans" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                        />
                                    </svg>
                                    {{ gettingListOfPlans ? 'Loading Plans...' : 'Get List Of Plans' }}
                                </Button>
                                <Button variant="destructive" @click="clearAllDataAndReload" class="flex-1 md:flex-none">
                                    <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    Clear All Data
                                </Button>
                            </div>

                            <div v-if="lastCallDate" class="text-muted-foreground text-sm">
                                <Badge variant="secondary">Last Call: {{ lastCallDate?.toLocaleString(DateTime.DATETIME_SHORT) }}</Badge>
                            </div>
                        </div>

                        <!-- Plan Selection -->
                        <div v-if="Object.keys(listOfPlans).length" class="space-y-4">
                            <h3 class="text-lg font-semibold">Plan Selection</h3>
                            <div class="space-y-3">
                                <div class="space-y-2">
                                    <label class="text-sm font-medium">Select Plan</label>
                                    <select
                                        v-model="selectedPlanKey"
                                        class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option :value="id" :key="id" v-for="(name, id) in listOfPlans">
                                            {{ name }}
                                        </option>
                                    </select>
                                </div>
                                <Button @click="getDataForPlan(true)" :loading="gettingDataForPlan" class="w-full">
                                    <svg v-if="!gettingDataForPlan" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    {{ gettingDataForPlan ? 'Loading Data...' : 'Get Data For Plan' }}
                                </Button>
                            </div>

                            <div v-if="gettingDataForPlan" class="flex items-center space-x-2 text-sm text-amber-600">
                                <LoadingSpinner size="sm" />
                                <span>Getting data... DO NOT REFRESH OR CLOSE THE TAB</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Filters Section -->
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>Customize your transaction view</CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium">Flow Type</label>
                            <select
                                v-model="flowType"
                                class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="all">All</option>
                                <option value="outflow">Outflow</option>
                                <option value="inflow">Inflow</option>
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Start Date</label>
                            <Input type="date" v-model="startDate" />
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">End Date</label>
                            <Input type="date" v-model="endDate" />
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Include Transfers</label>
                            <div class="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="includeTransfers"
                                    v-model="includeTransfers"
                                    class="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                                />
                                <label for="includeTransfers" class="text-muted-foreground text-sm">Show transfers</label>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Summary Cards -->
            <div class="grid gap-6 md:grid-cols-2">
                <!-- Total Summary -->
                <Card>
                    <CardHeader>
                        <CardTitle>Total Summary</CardTitle>
                        <CardDescription>Overview of your transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div v-if="tableTransactions.length" class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-muted-foreground text-sm">Number of Transactions</span>
                                <Badge variant="outline">{{ tableTransactions.length }}</Badge>
                            </div>

                            <div v-if="flowTypeIsAll" class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <span class="text-muted-foreground text-sm">Total Revenue</span>
                                    <span class="font-semibold text-green-600">${{ filteredTotalRevenue.toLocaleString() }}</span>
                                </div>
                                <div class="flex items-center justify-between">
                                    <span class="text-muted-foreground text-sm">Total Expenses</span>
                                    <span class="font-semibold text-red-600">${{ filteredTotalExpenses.toLocaleString() }}</span>
                                </div>
                                <div class="flex items-center justify-between border-t pt-2">
                                    <span class="text-sm font-medium">Net Amount</span>
                                    <span :class="['font-semibold', filteredNetAmount >= 0 ? 'text-green-600' : 'text-red-600']">
                                        ${{ filteredNetAmount.toLocaleString() }}
                                    </span>
                                </div>
                            </div>
                            <div v-else class="flex items-center justify-between">
                                <span class="text-muted-foreground text-sm">Total Amount</span>
                                <span class="font-semibold">${{ filteredTotalAmount.toLocaleString() }}</span>
                            </div>
                        </div>
                        <div v-else class="py-8 text-center">
                            <div class="text-muted-foreground">No transactions found</div>
                        </div>
                    </CardContent>
                </Card>

                <!-- Year/Month Summary -->
                <Card>
                    <CardHeader>
                        <CardTitle>Year/Month Breakdown</CardTitle>
                        <CardDescription>Detailed breakdown by time period</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div v-if="tableTransactions.length" class="space-y-4">
                            <div v-for="year in yearMonthAggregates" :key="year.year" class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-2">
                                        <span class="font-medium">{{ year.year }}</span>
                                        <span v-if="year.months.length === 0" class="text-muted-foreground text-sm">- {{ year.initialMonth }}</span>
                                        <Badge v-if="year.current" variant="secondary">Current</Badge>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <span
                                            v-if="flowTypeIsAll"
                                            :class="['text-sm font-medium', year.net >= 0 ? 'text-green-600' : 'text-red-600']"
                                        >
                                            ${{ year.net.toLocaleString() }}
                                        </span>
                                        <span v-else class="text-sm font-medium"> ${{ year.amount.toLocaleString() }} </span>
                                        <button
                                            class="hover:bg-accent rounded p-1"
                                            @click="
                                                isOpenYearAccordion(year.year) ? setClosedYearAccordion(year.year) : setOpenYearAccordion(year.year)
                                            "
                                        >
                                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path
                                                    v-if="isOpenYearAccordion(year.year)"
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                                                />
                                                <path
                                                    v-else
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="2"
                                                    d="m4.5 15.75 7.5-7.5 7.5 7.5"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div v-if="isOpenYearAccordion(year.year)" class="ml-4 space-y-1">
                                    <div v-for="month in year.months" :key="month.name" class="flex items-center justify-between text-sm">
                                        <div class="flex items-center space-x-2">
                                            <span>{{ month.name }}</span>
                                            <Badge v-if="month.current" variant="outline" class="text-xs">Current </Badge>
                                        </div>
                                        <span v-if="flowTypeIsAll" :class="['font-medium', month.net >= 0 ? 'text-green-600' : 'text-red-600']">
                                            ${{ month.net.toLocaleString() }}
                                        </span>
                                        <span v-else class="font-medium"> ${{ month.amount.toLocaleString() }} </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="py-8 text-center">
                            <div class="text-muted-foreground">No transactions found</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Transactions Section -->
            <Card>
                <CardHeader>
                    <div class="flex items-center justify-between">
                        <div>
                            <CardTitle>Transactions</CardTitle>
                            <CardDescription>Detailed view of your scheduled transactions</CardDescription>
                        </div>
                        <Button @click="exportCsv" variant="outline">
                            <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div v-if="tableTransactions.length" class="space-y-4">
                        <!-- Desktop Table -->
                        <div class="hidden overflow-x-auto md:block">
                            <table class="w-full">
                                <thead>
                                    <tr class="border-b">
                                        <th class="p-3 text-left font-medium">Date</th>
                                        <th class="p-3 text-left font-medium">Payee</th>
                                        <th class="p-3 text-left font-medium">Category</th>
                                        <th class="p-3 text-right font-medium">Amount</th>
                                        <th class="p-3 text-left font-medium">Parent Payee</th>
                                        <th class="p-3 text-center font-medium">Recurring</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="transaction in paginatedTransactions" :key="transaction.id" class="hover:bg-muted/50 border-b">
                                        <td class="p-3">
                                            <span :class="{ 'font-medium text-amber-600': dateIsFuture(transaction.date) }">
                                                {{ transformDateToLocaleString(transaction.date) ?? 'N/A' }}
                                            </span>
                                        </td>
                                        <td class="p-3">
                                            <a
                                                v-if="transaction?.payee && transaction?.id"
                                                class="text-primary font-medium hover:underline"
                                                :href="route('payee', { payee: transaction.payee?.id })"
                                            >
                                                {{ transaction.payee?.name }}
                                            </a>
                                            <span v-else class="text-muted-foreground">N/A</span>
                                        </td>
                                        <td class="p-3">
                                            <span class="text-muted-foreground">{{ transaction.category?.name ?? 'N/A' }}</span>
                                        </td>
                                        <td class="p-3 text-right">
                                            <span :class="['font-medium', transaction.amount < 0 ? 'text-red-600' : 'text-green-600']">
                                                ${{ flowTypeIsAll ? transaction.amount : transaction.absolute_amount }}
                                            </span>
                                        </td>
                                        <td class="p-3">
                                            <span class="text-muted-foreground">{{ transaction.parent_transaction?.payee?.name ?? 'N/A' }}</span>
                                        </td>
                                        <td class="p-3 text-center">
                                            <Badge :variant="transaction.payee?.repeating_transaction ? 'default' : 'secondary'">
                                                {{ transaction.payee?.repeating_transaction ? 'Yes' : 'No' }}
                                            </Badge>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Mobile Cards -->
                        <div class="space-y-3 md:hidden">
                            <div v-for="transaction in paginatedTransactions" :key="transaction.id" class="space-y-3 rounded-lg border p-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-2">
                                        <span :class="{ 'font-medium text-amber-600': dateIsFuture(transaction.date) }">
                                            {{ transformDateToLocaleString(transaction.date) ?? 'N/A' }}
                                        </span>
                                        <Badge :variant="transaction.payee?.repeating_transaction ? 'default' : 'secondary'" class="text-xs">
                                            {{ transaction.payee?.repeating_transaction ? 'Recurring' : 'One-time' }}
                                        </Badge>
                                    </div>
                                    <span :class="['font-semibold', transaction.amount < 0 ? 'text-red-600' : 'text-green-600']">
                                        ${{ flowTypeIsAll ? transaction.amount : transaction.absolute_amount }}
                                    </span>
                                </div>

                                <div class="space-y-1">
                                    <div class="flex items-center justify-between">
                                        <span class="text-muted-foreground text-sm">Payee</span>
                                        <a
                                            v-if="transaction?.payee && transaction?.id"
                                            class="text-primary text-sm font-medium hover:underline"
                                            :href="route('payee', { payee: transaction.payee?.id })"
                                        >
                                            {{ transaction.payee?.name }}
                                        </a>
                                        <span v-else class="text-muted-foreground text-sm">N/A</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-muted-foreground text-sm">Category</span>
                                        <span class="text-sm">{{ transaction.category?.name ?? 'N/A' }}</span>
                                    </div>
                                    <div v-if="transaction.parent_transaction?.payee?.name" class="flex items-center justify-between">
                                        <span class="text-muted-foreground text-sm">Parent Payee</span>
                                        <span class="text-sm">{{ transaction.parent_transaction?.payee?.name }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Pagination -->
                        <div class="border-t pt-4">
                            <Pagination
                                :current-page="currentPage"
                                :total-pages="totalPages"
                                :total-items="tableTransactions.length"
                                :items-per-page="itemsPerPage"
                                :on-page-change="handlePageChange"
                                :on-items-per-page-change="handleItemsPerPageChange"
                            />
                        </div>
                    </div>
                    <div v-else class="py-12 text-center">
                        <div class="text-muted-foreground">No transactions found</div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div v-else class="py-12 text-center">
            <div class="text-muted-foreground">This browser does not support the current storage scheme. Please switch to a browser that does.</div>
        </div>
    </div>
    <div v-else class="py-12 text-center">
        <div class="text-muted-foreground">Must consent to the above cookie policy to use the app.</div>
        <Button @click="refresh" variant="outline" class="mt-4">Refresh the page</Button>
    </div>
</template>
