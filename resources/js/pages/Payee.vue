<script setup lang="ts">
import Badge from '@/components/ui/Badge.vue';
import Card from '@/components/ui/Card.vue';
import CardContent from '@/components/ui/CardContent.vue';
import CardDescription from '@/components/ui/CardDescription.vue';
import CardHeader from '@/components/ui/CardHeader.vue';
import CardTitle from '@/components/ui/CardTitle.vue';
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

    <Head title="Payee Details">
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
    </Head>

    <div v-if="supportsStorageOnBrowser" class="flex flex-col gap-6">
        <!-- Payee Header Card -->
        <Card>
            <CardHeader>
                <CardTitle class="text-3xl">{{ selectedPayee?.name }}</CardTitle>
                <CardDescription>Payee transaction details and history</CardDescription>
            </CardHeader>
        </Card>

        <!-- Repeating Transaction Card -->
        <Card v-if="selectedPayee?.repeating_transaction">
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <span>Repeating Transaction</span>
                    <Badge variant="default">Active</Badge>
                </CardTitle>
                <CardDescription>Details about the scheduled repeating transaction</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-foreground">Frequency</label>
                        <div class="flex items-center gap-2">
                            <Badge variant="secondary">{{ selectedPayee?.repeating_transaction.frequency }}</Badge>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-medium text-muted-foreground">Next Date</label>
                        <div class="flex items-center gap-2">
                            <Badge variant="outline">
                                {{ transformDateToLocaleString(DateTime.fromISO(selectedPayee?.repeating_transaction.date_next)) }}
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Transaction History Card -->
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center gap-2">
                    <span>Transaction History</span>
                    <Badge variant="outline">{{ tableTransactions.length }} transactions</Badge>
                </CardTitle>
                <CardDescription>Complete history of transactions for this payee</CardDescription>
            </CardHeader>
            <CardContent>
                <div class="max-h-96 overflow-y-auto">
                    <table v-if="tableTransactions.length" class="hidden sm:table w-full">
                        <thead class="sticky top-0 bg-background border-b">
                            <tr>
                                <th class="text-left p-3 font-medium text-muted-foreground">Payee</th>
                                <th class="text-left p-3 font-medium text-muted-foreground">Date</th>
                                <th class="text-left p-3 font-medium text-muted-foreground">Category</th>
                                <th class="text-right p-3 font-medium text-muted-foreground">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr 
                                v-for="transaction in tableTransactions" 
                                :key="transaction.id"
                                class="border-b border-border hover:bg-muted/50 transition-colors"
                            >
                                <td class="p-3">{{ transaction.payee?.name ?? 'N/A' }}</td>
                                <td class="p-3">
                                    <div class="flex items-center gap-2">
                                        <span>{{ transformDateToLocaleString(transaction.date) ?? 'N/A' }}</span>
                                        <Badge v-if="dateIsFuture(transaction.date)" variant="secondary" class="text-xs">
                                            Future
                                        </Badge>
                                    </div>
                                </td>
                                <td class="p-3">
                                    <Badge v-if="transaction.category" variant="outline" class="text-xs">
                                        {{ transaction.category.name }}
                                    </Badge>
                                    <span v-else class="text-muted-foreground">N/A</span>
                                </td>
                                <td class="p-3 text-right">
                                    <Badge 
                                        :variant="transaction.amount < 0 ? 'destructive' : 'default'"
                                        class="text-xs"
                                    >
                                        {{ transaction.amount.toFixed(2) }}
                                    </Badge>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Mobile Cards -->
                    <div v-if="tableTransactions.length" class="sm:hidden space-y-4">
                        <div 
                            v-for="transaction in tableTransactions" 
                            :key="transaction.id"
                            class="p-4 border rounded-lg space-y-2"
                        >
                            <div class="flex justify-between items-start">
                                <div class="space-y-1">
                                    <div class="font-medium">{{ transaction.payee?.name ?? 'N/A' }}</div>
                                    <div class="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>{{ transformDateToLocaleString(transaction.date) ?? 'N/A' }}</span>
                                        <Badge v-if="dateIsFuture(transaction.date)" variant="secondary" class="text-xs">
                                            Future
                                        </Badge>
                                    </div>
                                </div>
                                <Badge 
                                    :variant="transaction.amount < 0 ? 'destructive' : 'default'"
                                    class="text-xs"
                                >
                                    {{ transaction.amount.toFixed(2) }}
                                </Badge>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-sm text-muted-foreground">Category:</span>
                                <Badge v-if="transaction.category" variant="outline" class="text-xs">
                                    {{ transaction.category.name }}
                                </Badge>
                                <span v-else class="text-sm text-muted-foreground">N/A</span>
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-center py-8 text-muted-foreground">
                        No transactions found for this payee.
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>

    <!-- Browser Compatibility Message -->
    <Card v-else>
        <CardHeader>
            <CardTitle>Browser Compatibility Issue</CardTitle>
            <CardDescription>Your browser does not support the required storage features</CardDescription>
        </CardHeader>
        <CardContent>
            <p class="text-muted-foreground">
                This browser does not support the current storage scheme. Please switch to a browser that does.
            </p>
        </CardContent>
    </Card>
</template>
