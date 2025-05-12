<script setup lang="ts">
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

    <div v-if="supportsStorageOnBrowser" class="flex flex-col gap-y-5">
        <div class="space-y-4">
            <div>
                Create or edit repeating transactions on
                <a class="text-blue-500 hover:underline" :href="`https://app.ynab.com/${selectedPlanKey}/accounts`">YNAB</a>.
            </div>
            <div>
                <b>IMPORTANT</b>:
                <ul class="list-disc pl-5">
                    <li>Make sure to use a <b>unique payee name</b> for your repeating transactions.</li>
                    <li>
                        For instance, if you:
                        <ul class="list-disc pl-10">
                            <li>Gave a one-time payment to YouTube for something like a film rental, and</li>
                            <li>Also have YouTube Premium</li>
                        </ul>
                    </li>
                    <li>
                        You should name the recurring YouTube payment something like "YouTube Premium" to differentiate it from the other YouTube
                        payment.
                    </li>
                </ul>
            </div>
            <div class="flex space-x-2">
                <div>
                    <label for="sort" class="mb-2 block text-sm font-medium text-gray-900 dark:text-white">Sort By</label>
                    <select
                        v-model="selectedSort"
                        id="sort"
                        class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    >
                        <option :value="key" :key="key" v-for="(name, key) in sortOptions">{{ name }}</option>
                    </select>
                </div>
                <div class="self-end">
                    <label for="sort_order" class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"></label>
                    <select
                        v-model="sortOrder"
                        id="sort"
                        class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
            </div>
            <div class="ml-2">
                <label class="inline-flex cursor-pointer items-center">
                    <input v-model="showRelativeDates" type="checkbox" value="" class="peer sr-only" />
                    <span
                        class="peer relative h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-checked:bg-blue-600 dark:peer-focus:ring-blue-800"
                    ></span>
                    <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Show Relative Dates Since Last Payment</span>
                </label>
            </div>
            <div class="ml-4">
                <div class="text-end">
                    <button
                        @click="exportCsv"
                        type="button"
                        class="me-2 mb-2 cursor-pointer rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    >
                        Export
                    </button>
                </div>
                <table v-if="repeatingTransactions.length" class="hidden sm:table md:w-full">
                    <thead class="sticky top-0 table-header-group bg-white dark:bg-black">
                        <tr class="table-row">
                            <th class="table-cell text-center">Next Date</th>
                            <th class="table-cell text-center">Payee</th>
                            <th class="table-cell text-center">Category</th>
                            <th class="table-cell text-center">Amount</th>
                            <th class="table-cell text-center">Frequency</th>
                            <th class="table-cell text-center">Subtransactions</th>
                            <th class="table-cell text-center">Monthly Amount</th>
                            <th class="table-cell text-center">Yearly Amount</th>
                            <th class="table-cell text-center">Date Since Last Payment</th>
                            <th class="table-cell text-center">Days Till Next Payment</th>
                        </tr>
                    </thead>
                    <tbody class="table-row-group">
                        <tr class="table-row" :key="transaction.id" v-for="transaction in repeatingTransactions">
                            <td class="table-cell text-center">
                                {{ transformDateToLocaleString(transaction.date) ?? 'N/A' }}
                            </td>
                            <td class="table-cell text-center">
                                <a
                                    v-if="transaction?.payee && transaction?.payee?.id"
                                    class="cursor-pointer text-blue-500 hover:underline"
                                    :href="
                                        route('payee', {
                                            payee: transaction.payee.id,
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
                                :class="{ 'text-red-500': transaction.real_amount < 0, 'text-green-500': transaction.real_amount > 0 }"
                            >
                                {{ transaction.real_absolute_amount }}
                            </td>
                            <td class="table-cell text-center">{{ transaction.frequency }}</td>
                            <td class="table-cell text-center">{{ transaction.subtransactions.length }}</td>
                            <td
                                class="table-cell text-center"
                                :class="{ 'text-red-500': transaction.real_amount < 0, 'text-green-500': transaction.real_amount > 0 }"
                            >
                                {{ transaction.monthly_amount.toLocaleString() }}
                            </td>
                            <td
                                class="table-cell text-center"
                                :class="{ 'text-red-500': transaction.real_amount < 0, 'text-green-500': transaction.real_amount > 0 }"
                            >
                                {{ transaction.yearly_amount.toLocaleString() }}
                            </td>
                            <td class="table-cell text-center">
                                {{
                                    showRelativeDates
                                        ? transaction.date_since_last_payment?.toRelative()
                                        : transformDateToLocaleString(transaction.date_since_last_payment)
                                }}
                            </td>
                            <td class="table-cell text-center">{{ transaction.days_till_next_payment }}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="text-gray-500" v-else>No repeating transactions found.</div>
            </div>
        </div>
    </div>
    <div v-else>This browser does not support the current storage scheme. Please switch to a browser that does.</div>
</template>
