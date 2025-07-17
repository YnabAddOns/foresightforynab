<script setup lang="ts">
import Badge from '@/components/ui/Badge.vue';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import CardContent from '@/components/ui/CardContent.vue';
import CardDescription from '@/components/ui/CardDescription.vue';
import CardHeader from '@/components/ui/CardHeader.vue';
import CardTitle from '@/components/ui/CardTitle.vue';
import Pagination from '@/components/ui/Pagination.vue';
import { checkForStorageCompatibility, getPlan, getSelectedPlanKey, PlanWithServerKnowledge, repeating } from '@/composables/useStorage';
import { Head } from '@inertiajs/vue3';
import { DateTime } from 'luxon';
import { computed, ComputedRef, onMounted, ref, watch } from 'vue';
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
    planKey: {
        type: String,
        required: true,
    },
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

const selectedPlanKey = computed(() => {
    return getSelectedPlanKey();
});

const specifiedPlan: ComputedRef<PlanWithServerKnowledge> = computed(() => {
    return getPlan(selectedPlanKey.value);
});

const categories = computed(() => {
    return (
        specifiedPlan.value?.budget?.categories?.map((category: ynab.Category) => {
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

const payees = computed(() => {
    return specifiedPlan.value?.budget?.payees ?? [];
});

const subtransactions = computed(() => {
    return specifiedPlan.value?.budget?.subtransactions
        ?.filter((historicalTransaction: ynab.SubTransaction) => {
            return !historicalTransaction.deleted;
        })
        ?.map((historicalTransaction: ynab.SubTransaction) => {
            return {
                ...historicalTransaction,
                parent_transaction: specifiedPlan.value?.budget?.transactions?.find((transaction) => {
                    return transaction.id === historicalTransaction.transaction_id;
                }),
            };
        });
});

const repeatingTransactions = computed(() => {
    const scheduledSubtransactions =
        specifiedPlan.value?.budget?.scheduled_subtransactions
            ?.filter((subtransaction: ynab.ScheduledSubTransaction) => {
                return !subtransaction.deleted;
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
                return transaction.frequency !== 'never' && !transaction.deleted;
            })
            ?.map((transaction: ynab.ScheduledTransactionSummary) => {
                const realAmount = transaction.amount / 1000;

                const transactionHistory = specifiedPlan.value?.budget?.transactions?.filter((historicalTransaction: ynab.TransactionSummary) => {
                    return historicalTransaction.payee_id === transaction.payee_id;
                });

                const subtransactionHistory = subtransactions.value
                    ?.filter((historicalTransaction: ynab.SubTransaction) => {
                        return historicalTransaction.payee_id === transaction.payee_id;
                    })
                    ?.map((historicalTransaction) => {
                        return {
                            ...historicalTransaction,
                            date: historicalTransaction.parent_transaction?.date,
                        };
                    });

                const fullSortedTransactionHistory = [...(transactionHistory ?? []), ...(subtransactionHistory ?? [])].sort((a, b) => {
                    if (!(b?.date && a?.date)) {
                        return 1;
                    }

                    const end = DateTime.fromISO(b.date).toMillis();

                    const start = DateTime.fromISO(a.date).toMillis();

                    return end - start;
                });

                const dateSinceLastPayment = fullSortedTransactionHistory[0]?.date;

                const date_since_last_payment = dateSinceLastPayment ? DateTime.fromISO(dateSinceLastPayment) : null;

                const date = transaction?.date_next ? DateTime.fromISO(transaction.date_next) : null;

                const category =
                    categories.value.find((category: ynab.Category) => {
                        return category.id === transaction.category_id;
                    }) ?? null;

                const payee =
                    payees.value.find((payee: ynab.Payee) => {
                        return payee.id === transaction.payee_id;
                    }) ?? null;

                return {
                    ...transaction,
                    date,
                    real_amount: realAmount,
                    real_absolute_amount: Math.abs(realAmount),
                    flow_type: transaction.amount >= 0 ? 'inflow' : 'outflow',
                    is_transfer: !!transaction.transfer_account_id,
                    category,
                    category_name: category?.name,
                    payee,
                    payee_name: payee?.name,
                    subtransactions:
                        scheduledSubtransactions.filter((subtransaction: ynab.ScheduledSubTransaction) => {
                            return subtransaction.scheduled_transaction_id === transaction.id;
                        }) ?? [],
                    monthly_amount: Math.abs(translateAmountToMonthlyViaFrequency(realAmount, transaction.frequency)),
                    yearly_amount: Math.abs(translateAmountToYearlyViaFrequency(realAmount, transaction.frequency)),
                    date_since_last_payment,
                    days_till_next_payment: date?.diff(DateTime.local(), 'days').days.toFixed(0),
                    transaction_history: fullSortedTransactionHistory,
                };
            })
            ?.sort((a: any, b: any) => {
                const selectedSortOption:
                    | string
                    | 'payee_name'
                    | 'category_name'
                    | 'date'
                    | 'yearly_amount'
                    | 'date_since_last_payment'
                    | 'days_till_next_payment' = selectedSort.value;

                const selectedOrder = sortOrder.value;

                const optionB: any = b[selectedSortOption];

                const optionA: any = a[selectedSortOption];

                if (selectedSortOption === 'payee_name' || selectedSortOption === 'category_name') {
                    if (selectedOrder === 'desc') {
                        return optionA > optionB ? -1 : optionA < optionB ? 1 : 0;
                    }

                    return optionA < optionB ? -1 : optionA > optionB ? 1 : 0;
                }

                if (selectedSortOption === 'days_till_next_payment' || selectedSortOption === 'yearly_amount') {
                    if (selectedOrder === 'desc') {
                        return optionB - optionA;
                    }

                    return optionA - optionB;
                }

                if (selectedSortOption === 'date_since_last_payment' || selectedSortOption === 'date') {
                    if (selectedOrder === 'desc') {
                        return optionB?.toMillis() - optionA?.toMillis();
                    }

                    return optionA?.toMillis() - optionB?.toMillis();
                }

                return 1;
            }) ?? []
    );
});

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Computed pagination values
const paginatedTransactions = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return repeatingTransactions.value.slice(start, end);
});

const totalPages = computed(() => {
    return Math.ceil(repeatingTransactions.value.length / itemsPerPage.value);
});

// Pagination handlers
function handlePageChange(page: number) {
    currentPage.value = page;
}

function handleItemsPerPageChange(newItemsPerPage: number) {
    itemsPerPage.value = newItemsPerPage;
    currentPage.value = 1; // Reset to first page when changing items per page
}

function translateAmountToMonthlyViaFrequency(amount: number, frequency: ynab.ScheduledTransactionFrequency) {
    switch (frequency) {
        case 'never':
            throw new Error('Should never be "never".');
        case 'daily':
            return amount * 30.4375;
        case 'weekly':
            return amount * 4.348214;
        case 'everyOtherWeek':
            return amount * (4.348214 / 2);
        case 'twiceAMonth':
            return amount * 2;
        case 'every4Weeks':
            return amount * 0.348214;
        case 'monthly':
            return amount;
        case 'everyOtherMonth':
            return amount / 2;
        case 'every3Months':
            return amount / 3;
        case 'every4Months':
            return amount / 4;
        case 'twiceAYear':
            return amount / 6;
        case 'yearly':
            return amount / 12;
        case 'everyOtherYear':
            return amount / 24;
        default:
            throw new Error('Unknown frequency given: ' + frequency);
    }
}

function translateAmountToYearlyViaFrequency(amount: number, frequency: ynab.ScheduledTransactionFrequency) {
    switch (frequency) {
        case 'never':
            throw new Error('Should never be "never".');
        case 'daily':
            return amount * 365.2425;
        case 'weekly':
            return amount * 52.17857;
        case 'everyOtherWeek':
            return amount * 26;
        case 'twiceAMonth':
            return amount * 24;
        case 'every4Weeks':
            return amount * 0.17857;
        case 'monthly':
            return amount * 12;
        case 'everyOtherMonth':
            return amount * 6;
        case 'every3Months':
            return amount * 4;
        case 'every4Months':
            return amount * 3;
        case 'twiceAYear':
            return amount * 2;
        case 'yearly':
            return amount;
        case 'everyOtherYear':
            return amount / 2;
        default:
            throw new Error('Unknown frequency given: ' + frequency);
    }
}

function transformDateToLocaleString(date: DateTime | null) {
    return date?.toLocaleString(DateTime.DATE_MED) ?? null;
}

const sortOptions = computed(() => {
    return {
        date: 'Next Date',
        payee_name: 'Payee',
        category_name: 'Category',
        yearly_amount: 'Yearly Amount',
        date_since_last_payment: 'Date Since Last Payment',
        days_till_next_payment: 'Days Till Next Payment',
    };
});

const selectedSort = ref(repeating.getSelectedSort() ?? 'date_since_last_payment');

/* v8 ignore next 3 */
watch(selectedSort, (newValue) => {
    repeating.storeSelectedSort(newValue);
});

const sortOrder = ref(repeating.getSortOrder() ?? 'desc');

/* v8 ignore next 3 */
watch(sortOrder, (newValue) => {
    repeating.storeSortOrder(newValue);
});

const showRelativeDates = ref(repeating.getShowRelativeDates() ?? false);

/* v8 ignore next 3 */
watch(showRelativeDates, (newValue) => {
    repeating.storeShowRelativeDates(newValue);
});

function exportCsv() {
    let csv = 'Date,Amount,Payee Name,Payee ID,Category,Frequency,Monthly Amount,Yearly Amount,Date Since Last Payment\n';

    repeatingTransactions.value.forEach((row) => {
        csv += '"';
        csv += row?.date?.toLocaleString() ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row.real_amount ?? '';
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
        csv += row.category?.name ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row?.frequency ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row.monthly_amount.toFixed(2) ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row.yearly_amount.toFixed(2) ?? '';
        csv += '"';
        csv += ',';
        csv += '"';
        csv += row.date_since_last_payment?.toLocaleString() ?? '';
        csv += '"';
        csv += '\n';
    });

    const anchor = document.createElement('a');
    anchor.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    anchor.target = '_blank';
    anchor.download = `repeating.csv`;
    anchor.click();
}
</script>

<template>
    <Head title="Repeating">
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    </Head>
    <div v-if="selectedPlanKey">
        <div v-if="supportsStorageOnBrowser" class="space-y-8">
            <!-- Header Section -->
            <div class="space-y-4 text-center">
                <h1 class="text-4xl font-bold tracking-tight">Repeating Transactions</h1>
                <p class="text-muted-foreground mx-auto max-w-3xl text-xl">Manage and analyze your recurring income and expenses from YNAB</p>
            </div>

            <!-- Important Notice -->
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center space-x-2">
                        <svg class="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fill-rule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        <span>Important Information</span>
                    </CardTitle>
                    <CardDescription>Best practices for managing repeating transactions</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <div class="flex items-start space-x-3">
                        <div class="flex-shrink-0">
                            <div class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                                <svg class="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fill-rule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <p class="text-muted-foreground">
                                Create or edit repeating transactions on
                                <a
                                    class="text-primary font-medium hover:underline"
                                    :href="`https://app.ynab.com/${selectedPlanKey}/accounts`"
                                    target="_blank"
                                >
                                    YNAB </a
                                >.
                            </p>
                        </div>
                    </div>

                    <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                        <h4 class="mb-2 font-semibold text-amber-800 dark:text-amber-200">Unique Payee Names Required</h4>
                        <p class="mb-3 text-sm text-amber-700 dark:text-amber-300">
                            Make sure to use a <strong>unique payee name</strong> for your repeating transactions.
                        </p>
                        <div class="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                            <p><strong>Example:</strong> If you have both:</p>
                            <ul class="list-disc space-y-1 pl-5">
                                <li>A one-time payment to YouTube for a film rental</li>
                                <li>YouTube Premium subscription</li>
                            </ul>
                            <p>Name the recurring payment <strong>"YouTube Premium"</strong> to differentiate it from other YouTube payments.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Controls Section -->
            <Card>
                <CardHeader>
                    <CardTitle>Table Controls</CardTitle>
                    <CardDescription>Customize how your repeating transactions are displayed</CardDescription>
                </CardHeader>
                <CardContent>
                    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div class="space-y-2">
                            <label class="text-sm font-medium">Sort By</label>
                            <select
                                v-model="selectedSort"
                                class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option :value="key" :key="key" v-for="(name, key) in sortOptions">{{ name }}</option>
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Sort Order</label>
                            <select
                                v-model="sortOrder"
                                class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                            </select>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Date Display</label>
                            <div class="flex items-center space-x-2">
                                <input
                                    v-model="showRelativeDates"
                                    type="checkbox"
                                    id="relativeDates"
                                    class="text-primary focus:ring-primary h-4 w-4 rounded border-gray-300"
                                />
                                <label for="relativeDates" class="text-muted-foreground text-sm">Show relative dates</label>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <label class="text-sm font-medium">Actions</label>
                            <Button @click="exportCsv" variant="outline" class="w-full">
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
                    </div>
                </CardContent>
            </Card>

            <!-- Summary Stats -->
            <div class="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardContent class="p-6">
                        <div class="flex items-center space-x-2">
                            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                <svg class="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fill-rule="evenodd"
                                        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p class="text-muted-foreground text-sm">Total Transactions</p>
                                <p class="text-2xl font-bold">{{ repeatingTransactions.length }}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent class="p-6">
                        <div class="flex items-center space-x-2">
                            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                <svg class="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fill-rule="evenodd"
                                        d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 15.586 6H12z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p class="text-muted-foreground text-sm">Total Monthly</p>
                                <p class="text-2xl font-bold">
                                    ${{ repeatingTransactions.reduce((sum, t) => sum + t.monthly_amount, 0).toLocaleString() }}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent class="p-6">
                        <div class="flex items-center space-x-2">
                            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                                <svg class="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fill-rule="evenodd"
                                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p class="text-muted-foreground text-sm">Total Yearly</p>
                                <p class="text-2xl font-bold">
                                    ${{ repeatingTransactions.reduce((sum, t) => sum + t.yearly_amount, 0).toLocaleString() }}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <!-- Transactions Table -->
            <Card>
                <CardHeader>
                    <CardTitle>Repeating Transactions</CardTitle>
                    <CardDescription>Detailed view of your scheduled recurring transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div v-if="repeatingTransactions.length" class="space-y-4">
                        <!-- Desktop Table -->
                        <div class="hidden overflow-x-auto lg:block">
                            <table class="w-full">
                                <thead>
                                    <tr class="border-b">
                                        <th class="p-3 text-left font-medium">Next Date</th>
                                        <th class="p-3 text-left font-medium">Payee</th>
                                        <th class="p-3 text-left font-medium">Category</th>
                                        <th class="p-3 text-right font-medium">Amount</th>
                                        <th class="p-3 text-center font-medium">Frequency</th>
                                        <th class="p-3 text-center font-medium">Subtransactions</th>
                                        <th class="p-3 text-right font-medium">Monthly</th>
                                        <th class="p-3 text-right font-medium">Yearly</th>
                                        <th class="p-3 text-center font-medium">Last Payment</th>
                                        <th class="p-3 text-center font-medium">Days Until</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="transaction in paginatedTransactions" :key="transaction.id" class="hover:bg-muted/50 border-b">
                                        <td class="p-3">
                                            <span :class="{ 'font-medium text-amber-600': transaction.days_till_next_payment < 7 }">
                                                {{ transformDateToLocaleString(transaction.date) ?? 'N/A' }}
                                            </span>
                                        </td>
                                        <td class="p-3">
                                            <a
                                                v-if="transaction?.payee && transaction?.payee?.id"
                                                class="text-primary font-medium hover:underline"
                                                :href="route('payee', { payee: transaction.payee.id })"
                                            >
                                                {{ transaction.payee?.name }}
                                            </a>
                                            <span v-else class="text-muted-foreground">N/A</span>
                                        </td>
                                        <td class="p-3">
                                            <span class="text-muted-foreground">{{ transaction.category?.name ?? 'N/A' }}</span>
                                        </td>
                                        <td class="p-3 text-right">
                                            <span :class="['font-medium', transaction.real_amount < 0 ? 'text-red-600' : 'text-green-600']">
                                                ${{ transaction.real_absolute_amount }}
                                            </span>
                                        </td>
                                        <td class="p-3 text-center">
                                            <Badge variant="outline" class="text-xs">{{ transaction.frequency }}</Badge>
                                        </td>
                                        <td class="p-3 text-center">
                                            <Badge v-if="transaction.subtransactions.length > 0" variant="secondary" class="text-xs">
                                                {{ transaction.subtransactions.length }}
                                            </Badge>
                                            <span v-else class="text-muted-foreground">0</span>
                                        </td>
                                        <td class="p-3 text-right">
                                            <span :class="['font-medium', transaction.real_amount < 0 ? 'text-red-600' : 'text-green-600']">
                                                ${{ transaction.monthly_amount.toLocaleString() }}
                                            </span>
                                        </td>
                                        <td class="p-3 text-right">
                                            <span :class="['font-medium', transaction.real_amount < 0 ? 'text-red-600' : 'text-green-600']">
                                                ${{ transaction.yearly_amount.toLocaleString() }}
                                            </span>
                                        </td>
                                        <td class="p-3 text-center">
                                            <span class="text-muted-foreground text-sm">
                                                {{
                                                    showRelativeDates
                                                        ? transaction.date_since_last_payment?.toRelative()
                                                        : transformDateToLocaleString(transaction.date_since_last_payment)
                                                }}
                                            </span>
                                        </td>
                                        <td class="p-3 text-center">
                                            <Badge :variant="transaction.days_till_next_payment < 7 ? 'destructive' : 'secondary'" class="text-xs">
                                                {{ transaction.days_till_next_payment }} days
                                            </Badge>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Mobile Cards -->
                        <div class="space-y-3 lg:hidden">
                            <div v-for="transaction in paginatedTransactions" :key="transaction.id" class="space-y-3 rounded-lg border p-4">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-2">
                                        <span :class="{ 'font-medium text-amber-600': transaction.days_till_next_payment < 7 }">
                                            {{ transformDateToLocaleString(transaction.date) ?? 'N/A' }}
                                        </span>
                                        <Badge :variant="transaction.days_till_next_payment < 7 ? 'destructive' : 'secondary'" class="text-xs">
                                            {{ transaction.days_till_next_payment }} days
                                        </Badge>
                                    </div>
                                    <span :class="['font-semibold', transaction.real_amount < 0 ? 'text-red-600' : 'text-green-600']">
                                        ${{ transaction.real_absolute_amount }}
                                    </span>
                                </div>

                                <div class="space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-muted-foreground text-sm">Payee</span>
                                        <a
                                            v-if="transaction?.payee && transaction?.payee?.id"
                                            class="text-primary text-sm font-medium hover:underline"
                                            :href="route('payee', { payee: transaction.payee.id })"
                                        >
                                            {{ transaction.payee?.name }}
                                        </a>
                                        <span v-else class="text-muted-foreground text-sm">N/A</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-muted-foreground text-sm">Category</span>
                                        <span class="text-sm">{{ transaction.category?.name ?? 'N/A' }}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-muted-foreground text-sm">Frequency</span>
                                        <Badge variant="outline" class="text-xs">{{ transaction.frequency }}</Badge>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-muted-foreground text-sm">Monthly</span>
                                        <span :class="['text-sm font-medium', transaction.real_amount < 0 ? 'text-red-600' : 'text-green-600']">
                                            ${{ transaction.monthly_amount.toLocaleString() }}
                                        </span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-muted-foreground text-sm">Yearly</span>
                                        <span :class="['text-sm font-medium', transaction.real_amount < 0 ? 'text-red-600' : 'text-green-600']">
                                            ${{ transaction.yearly_amount.toLocaleString() }}
                                        </span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-muted-foreground text-sm">Last Payment</span>
                                        <span class="text-muted-foreground text-sm">
                                            {{
                                                showRelativeDates
                                                    ? transaction.date_since_last_payment?.toRelative()
                                                    : transformDateToLocaleString(transaction.date_since_last_payment)
                                            }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Pagination -->
                        <div class="border-t pt-4">
                            <Pagination
                                :current-page="currentPage"
                                :total-pages="totalPages"
                                :total-items="repeatingTransactions.length"
                                :items-per-page="itemsPerPage"
                                :on-page-change="handlePageChange"
                                :on-items-per-page-change="handleItemsPerPageChange"
                            />
                        </div>
                    </div>
                    <div v-else class="py-12 text-center">
                        <div class="text-muted-foreground">No repeating transactions found</div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div v-else class="py-12 text-center">
            <div class="text-muted-foreground">This browser does not support the current storage scheme. Please switch to a browser that does.</div>
        </div>
    </div>
    <div v-else>
        <div class="py-12 text-center">
            <div class="text-muted-foreground">No plan selected. Please select a plan to continue.</div>
        </div>
    </div>
</template>
