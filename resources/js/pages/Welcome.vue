<script setup lang="ts">
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
import { Head } from '@inertiajs/vue3';
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
});

const ynabApi = ref(props.ynabAccessToken ? new ynab.API(props.ynabAccessToken) : null);

onMounted(() => {
    const params = new URLSearchParams(window.location.hash.substring(1));

    const access_token = params.get('access_token');

    if (access_token) {
        ynabApi.value = new ynab.API(access_token);

        window.location.href = route('home', { access_token });
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

        for (let j = 0; j < 12; j++) {
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

function isOpenYearAccordion(year: number) {
    return !!yearAccordions.value.filter((item) => year === item).length;
}

function setClosedYearAccordion(year: number) {
    yearAccordions.value = yearAccordions.value.filter((item) => year !== item);

    storeYearAccordions(yearAccordions.value);
}

function isClosedYearAccordion(year: number) {
    return !yearAccordions.value.filter((item) => year === item).length;
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
</script>

<template>
    <Head title="Home">
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    </Head>

    <div v-if="supportsStorageOnBrowser" class="flex flex-col gap-y-5">
        <div>
            <h2 class="text-2xl font-bold">Controls</h2>
        </div>

        <div id="get-list-of-plans" class="flex flex-col gap-y-5">
            <div class="flex gap-5">
                <div>
                    <div>
                        <button
                            class="me-2 mb-2 cursor-pointer rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            @click="getListOfPlans(true)"
                        >
                            Get List Of Plans
                        </button>
                    </div>

                    <div>
                        <div v-if="gettingListOfPlans">Getting list of plans...</div>
                    </div>
                </div>
                <div>
                    <button
                        class="me-2 mb-2 cursor-pointer rounded-lg bg-red-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800 focus:ring-4 focus:ring-red-300 focus:outline-none dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
                        @click="clearAllDataAndReload"
                    >
                        Clear All Data
                    </button>
                </div>
            </div>
        </div>

        <div class="space-x-5 sm:flex">
            <div id="plan-selection" class="ml-4 flex flex-col gap-y-5 sm:flex-1" v-if="Object.keys(listOfPlans).length">
                <div>
                    <h3 class="text-xl font-bold">Plan Selection</h3>
                </div>

                <div class="flex gap-5">
                    <div class="flex space-x-5">
                        <label class="block text-sm font-medium text-gray-900 dark:text-white">Select Plan</label>
                        <select
                            v-model="selectedPlanKey"
                            class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                        >
                            <option :value="id" :key="id" v-for="(name, id) in listOfPlans">
                                {{ name }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <button
                            class="me-2 mb-2 cursor-pointer rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                            @click="getDataForPlan(true)"
                        >
                            Get Data For Plan
                        </button>
                    </div>
                </div>

                <div v-if="lastCallDate"><b>Last Call</b>: {{ lastCallDate?.toLocaleString(DateTime.DATETIME_SHORT) }}</div>

                <div>
                    <div v-if="gettingDataForPlan">Getting data... DO NOT REFRESH OR CLOSE THE TAB</div>
                </div>
            </div>

            <div id="filters" class="ml-4 flex flex-col gap-y-5 sm:flex-1">
                <div>
                    <h3 class="text-xl font-bold">Filters</h3>
                </div>

                <div class="flex gap-4">
                    <div class="flex gap-2">
                        <label for="flowType">Flow Type</label>
                        <select name="flowType" id="flowType" v-model="flowType">
                            <option value="all">All</option>
                            <option value="outflow">Outflow</option>
                            <option value="inflow">Inflow</option>
                        </select>
                    </div>
                </div>
                <div class="gap-2 md:flex">
                    <div class="flex gap-2">
                        <label for="start">Start</label>
                        <input type="date" id="start" name="start" v-model="startDate" />
                    </div>
                    <div class="flex gap-2">
                        <label for="end">End</label>
                        <input type="date" id="end" name="end" v-model="endDate" />
                    </div>
                </div>
                <div class="flex gap-2">
                    <label for="start">Include Transfers</label>
                    <input type="checkbox" id="includeTransfers" name="includeTransfers" v-model="includeTransfers" />
                </div>
            </div>
        </div>

        <div class="flex space-x-5">
            <div id="total" class="flex-1">
                <div>
                    <h2 class="text-2xl font-bold">Total</h2>
                </div>

                <div class="ml-4 flex flex-col gap-y-5">
                    <ul v-if="tableTransactions.length">
                        <li>
                            <b>Number of Transactions</b>: {{ tableTransactions.length }}
                            transactions
                        </li>
                        <li v-if="flowTypeIsAll">
                            <b>Total Amount</b>: {{ filteredTotalRevenue.toLocaleString() }} - {{ filteredTotalExpenses.toLocaleString() }} =
                            {{ filteredNetAmount.toLocaleString() }}
                        </li>
                        <li v-else><b>Total Amount</b>: {{ filteredTotalAmount.toLocaleString() }}</li>
                    </ul>

                    <div class="text-gray-500" v-if="!tableTransactions.length">No transactions found.</div>
                </div>
            </div>

            <div id="year-month" class="sm:flex-1">
                <div>
                    <h2 class="text-2xl font-bold">Year/Month</h2>
                </div>

                <div class="ml-4">
                    <div v-if="tableTransactions.length">
                        <div class="ml-4" :key="year.year" v-for="year in yearMonthAggregates">
                            <div class="flex flex-row space-x-2">
                                <div>
                                    <b
                                        >{{ year.year }} <span v-if="year.months.length === 0"> - {{ year.initialMonth }}</span></b
                                    >:
                                </div>
                                <div>
                                    <span
                                        v-if="flowTypeIsAll"
                                        :class="{ 'bg-red-100 dark:text-gray-500': year.net < 0, 'bg-green-100 dark:text-gray-500': year.net > 0 }"
                                        >{{ year.revenue.toLocaleString() }} - {{ year.expense.toLocaleString() }} =
                                        {{ year.net.toLocaleString() }}</span
                                    >
                                    <span v-else>{{ year.amount.toLocaleString() }}</span>
                                    <span v-if="year.current">&nbsp;(Current Year)</span>
                                </div>
                                <div>
                                    <button
                                        class="cursor-pointer"
                                        type="button"
                                        v-if="isOpenYearAccordion(year.year)"
                                        @click="setClosedYearAccordion(year.year)"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            stroke-width="1.5"
                                            stroke="currentColor"
                                            class="size-6"
                                        >
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>
                                    <button
                                        class="cursor-pointer"
                                        type="button"
                                        v-if="isClosedYearAccordion(year.year)"
                                        @click="setOpenYearAccordion(year.year)"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            stroke-width="1.5"
                                            stroke="currentColor"
                                            class="size-6"
                                        >
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div v-if="isOpenYearAccordion(year.year)">
                                <div :key="month" v-for="month in year.months" class="ml-4">
                                    <b>{{ month.name }}</b
                                    >:
                                    <span
                                        :class="{ 'bg-red-300 dark:text-gray-600': month.net < 0, 'bg-green-300 dark:text-gray-600': month.net > 0 }"
                                        v-if="flowTypeIsAll"
                                        >{{ month.revenue.toLocaleString() }} - {{ month.expense.toLocaleString() }} =
                                        {{ month.net.toLocaleString() }}</span
                                    >
                                    <span v-else>{{ month.amount.toLocaleString() }}</span>
                                    <span v-if="month.current">&nbsp;(Current Month)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="text-gray-500" v-if="!tableTransactions.length">No transactions found.</div>
                </div>
            </div>
        </div>

        <div>
            <h2 class="text-2xl font-bold">Transactions</h2>
        </div>

        <div class="text-end">
            <button
                @click="exportCsv"
                type="button"
                class="me-2 mb-2 cursor-pointer rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
                Export
            </button>
        </div>

        <div class="ml-4 max-h-96 overflow-y-auto" :key="tableTransactions.toLocaleString()">
            <table v-if="tableTransactions.length" class="hidden sm:table md:w-full">
                <thead class="sticky top-0 table-header-group bg-white dark:bg-black">
                    <tr class="table-row">
                        <th class="table-cell text-center">Date</th>
                        <th class="table-cell text-center">Payee</th>
                        <th class="table-cell text-center">Category</th>
                        <th class="table-cell text-center">Amount</th>
                        <th class="table-cell text-center">Parent Payee</th>
                        <th class="table-cell text-center">Payee Is Recurring</th>
                    </tr>
                </thead>
                <tbody class="table-row-group">
                    <tr class="table-row" :key="transaction.id" v-for="transaction in tableTransactions">
                        <td class="table-cell text-center" :class="{ 'text-yellow-600': dateIsFuture(transaction.date) }">
                            {{ transformDateToLocaleString(transaction.date) ?? 'N/A' }}
                        </td>
                        <td class="table-cell text-center">
                            <a
                                v-if="transaction?.payee && transaction?.id"
                                class="text-blue-500 hover:underline"
                                :href="
                                    route('payee', {
                                        payee: transaction.payee?.id,
                                    })
                                "
                            >
                                {{ transaction.payee?.name }}
                            </a>
                            <span v-else>N/A</span>
                        </td>
                        <td class="table-cell text-center">{{ transaction.category?.name ?? 'N/A' }}</td>
                        <td
                            class="table-cell text-center"
                            :class="{ 'text-red-500': transaction.amount < 0, 'text-green-500': transaction.amount > 0 }"
                        >
                            {{ flowTypeIsAll ? transaction.amount : transaction.absolute_amount }}
                        </td>
                        <td class="table-cell text-center">{{ transaction.parent_transaction?.payee?.name ?? 'N/A' }}</td>
                        <td class="table-cell text-center">{{ transaction.payee?.repeating_transaction ? 'Yes' : 'No' }}</td>
                    </tr>
                </tbody>
            </table>
            <div v-if="tableTransactions.length">
                <div class="my-4 sm:hidden" :key="transaction.id" v-for="transaction in tableTransactions">
                    <div class="w-full border-2 p-4">
                        <div class="flex">
                            <div class="flex-1 truncate">
                                <a
                                    v-if="transaction?.payee && transaction?.id"
                                    class="text-blue-500 hover:underline"
                                    :href="
                                        route('payee', {
                                            payee: transaction.payee?.id,
                                        })
                                    "
                                >
                                    {{ transaction.payee?.name }}
                                </a>
                                <span v-else>N/A</span>
                            </div>
                            <div
                                class="flex-1 text-end"
                                :class="{ 'text-red-500': transaction.amount < 0, 'text-green-500': transaction.amount > 0 }"
                            >
                                {{ transaction.amount }}
                            </div>
                        </div>
                        <div class="flex text-gray-500">
                            <div class="flex-1 truncate">{{ transaction.category?.name }}</div>
                            <div class="flex-1 text-end">{{ transformDateToLocaleString(transaction.date) ?? 'N/A' }}</div>
                        </div>
                        <div class="mt-4 flex flex-col text-end text-gray-500">
                            <div class="flex-1">
                                {{ transaction?.payee?.repeating_transaction?.frequency ?? 'No Frequency' }}
                            </div>
                            <div class="flex-1">{{ transaction?.parent_transaction?.payee?.name ?? 'No Parent' }}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="text-gray-500" v-if="!tableTransactions.length">No transactions found.</div>
        </div>
    </div>
    <div v-else>This browser does not support the current storage scheme. Please switch to a browser that does.</div>
</template>
