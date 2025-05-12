<script setup lang="ts">
import { ScheduledTransaction } from '@/composables/useInterface';
import { checkForStorageCompatibility, getPlan, getSelectedPlanKey, PlanWithServerKnowledge } from '@/composables/useStorage';
import { Head } from '@inertiajs/vue3';
import { DateTime } from 'luxon';
import { computed, ComputedRef, onMounted, ref } from 'vue';
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
    payee: {
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

const repeatingTransactions = computed(() => {
    return (
        specifiedPlan.value?.budget?.scheduled_transactions?.filter((transaction: ynab.ScheduledTransactionSummary) => {
            return transaction.frequency !== 'never' && !transaction?.deleted;
        }) ?? []
    );
});

const payees: ComputedRef<Payee[]> = computed(() => {
    return (specifiedPlan.value?.budget?.payees
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
        }) ?? []) as Payee[];
});

const selectedPayee = computed(() => {
    return payees.value.find((payee) => payee.id === props.payee);
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
}

function isScheduledTransaction(obj: any): obj is ScheduledTransaction {
    return 'frequency' in obj;
}

const tableTransactions: ComputedRef<TableTransaction[]> = computed(() => {
    const result: Array<TableTransaction> = [];

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
                return !transaction?.deleted && transaction.payee_id === props.payee;
            }) ?? []
        );
    };

    const mergedHistoricalAndFuture =
        [...getFilteredHistorical()].sort((a, b) => {
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
                    category: category ? category : (transaction.category as Category),
                    amount: subtransaction.real_amount,
                    absolute_amount: subtransaction.real_absolute_amount,
                    frequency: isScheduledTransaction(transaction) ? transaction.frequency : null,
                    parent_transaction: transaction,
                    payee: payee ? payee : (transaction.payee as Payee),
                });
            });
        } else {
            result.push({
                id: transaction.id,
                date: transaction.date,
                category: (transaction?.category as Category) ?? null,
                amount: transaction.real_amount,
                absolute_amount: transaction.real_absolute_amount,
                frequency: isScheduledTransaction(transaction) ? transaction.frequency : null,
                parent_transaction: null,
                payee: transaction?.payee ?? null,
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

function dateIsFuture(date: DateTime | null) {
    if (!date) {
        return false;
    }

    return date > DateTime.now();
}

function transformDateToLocaleString(date: DateTime | null) {
    return date?.toLocaleString(DateTime.DATE_MED) ?? null;
}
</script>

<template>
    <Head title="Repeating">
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    </Head>

    <div v-if="supportsStorageOnBrowser" class="flex flex-col gap-y-5">
        <h1 class="text-3xl">{{ selectedPayee?.name }}</h1>
        <div v-if="selectedPayee?.repeating_transaction">
            <h2 class="text-2xl">Repeating</h2>
            <ul class="list-disc pl-5">
                <li><b>Frequency</b>: {{ selectedPayee?.repeating_transaction.frequency }}</li>
                <li>
                    <b>Next Date</b>:
                    {{ transformDateToLocaleString(DateTime.fromISO(selectedPayee?.repeating_transaction.date_next)) }}
                </li>
            </ul>
        </div>
        <h2>History of Transactions</h2>
        <div class="ml-4 max-h-96 overflow-y-auto">
            <table v-if="tableTransactions.length" class="hidden sm:table md:w-full">
                <thead class="sticky top-0 table-header-group bg-white dark:bg-black">
                    <tr class="table-row">
                        <th class="table-cell text-center">Payee</th>
                        <th class="table-cell text-center">Date</th>
                        <th class="table-cell text-center">Category</th>
                        <th class="table-cell text-center">Amount</th>
                    </tr>
                </thead>
                <tbody class="table-row-group">
                    <tr class="table-row" :key="transaction.id" v-for="transaction in tableTransactions">
                        <td class="table-cell text-center">{{ transaction.payee?.name ?? 'N/A' }}</td>
                        <td class="table-cell text-center" :class="{ 'text-yellow-600': dateIsFuture(transaction.date) }">
                            {{ transformDateToLocaleString(transaction.date) ?? 'N/A' }}
                        </td>
                        <td class="table-cell text-center">{{ transaction.category?.name ?? 'N/A' }}</td>
                        <td
                            class="table-cell text-center"
                            :class="{ 'text-red-500': transaction.amount < 0, 'text-green-500': transaction.amount > 0 }"
                        >
                            {{ transaction.amount }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <div v-else>This browser does not support the current storage scheme. Please switch to a browser that does.</div>
</template>
