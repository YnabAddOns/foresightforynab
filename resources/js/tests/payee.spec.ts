import { clearAllData, storePlan, storeSelectedPlanKey } from '@/composables/useStorage';
import { mount } from '@vue/test-utils';
import Payee from '../pages/Payee.vue';

vi.mock('@inertiajs/vue3', () => ({
    Head: () => {},
}));

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
    vi.clearAllMocks();
});

afterEach(() => {
    clearAllData();
});

const ynabAuthorizationUrl = 'https://app.ynab.com/oauth/authorize?client_id=test&redirect_uri=test&response_type=token';

function mountComponent(payeeId: string) {
    return mount(Payee, {
        props: {
            payee: payeeId,
            ynabAuthorizationUrl,
        },
    }) as any;
}

describe('tableTransactions computed property', () => {
    describe('Payee only in transactions', () => {
        it('should show only relevant transactions when payee is directly associated', () => {
            const payeeId = 'payee-1';
            const categoryId = 'category-1';

            const testData = {
                budget: {
                    id: 'budget-1',
                    payees: [
                        { id: payeeId, name: 'Test Payee', deleted: false },
                        { id: 'payee-2', name: 'Other Payee', deleted: false },
                    ],
                    categories: [{ id: categoryId, name: 'Test Category', category_group_id: 'group-1', deleted: false }],
                    category_groups: [{ id: 'group-1', name: 'Test Group', deleted: false }],
                    transactions: [
                        {
                            id: 'transaction-1',
                            date: '2025-01-15',
                            amount: -50000, // -50.00
                            payee_id: payeeId,
                            category_id: categoryId,
                            deleted: false,
                        },
                        {
                            id: 'transaction-2',
                            date: '2025-01-16',
                            amount: -30000, // -30.00
                            payee_id: 'payee-2',
                            category_id: categoryId,
                            deleted: false,
                        },
                    ],
                    subtransactions: [],
                },
            };

            storePlan(testData, 'budget-1');
            storeSelectedPlanKey('budget-1');

            const component = mountComponent(payeeId);
            const tableTransactions = component.vm.tableTransactions;

            expect(tableTransactions).toHaveLength(1);
            expect(tableTransactions[0]).toMatchObject({
                id: 'transaction-1',
                amount: -50,
                payee: { id: payeeId, name: 'Test Payee' },
                category: { id: categoryId, name: 'Test Category' },
                is_parent: true,
                subtransactions: [],
            });
        });
    });

    describe('Payee only in subtransactions', () => {
        it('should show only relevant subtransactions when payee is only in subtransactions', () => {
            const payeeId = 'payee-1';
            const categoryId = 'category-1';

            const testData = {
                budget: {
                    id: 'budget-1',
                    payees: [
                        { id: payeeId, name: 'Test Payee', deleted: false },
                        { id: 'payee-2', name: 'Parent Payee', deleted: false },
                    ],
                    categories: [{ id: categoryId, name: 'Test Category', category_group_id: 'group-1', deleted: false }],
                    category_groups: [{ id: 'group-1', name: 'Test Group', deleted: false }],
                    transactions: [
                        {
                            id: 'transaction-1',
                            date: '2025-01-15',
                            amount: -100000, // -100.00 (total of subtransactions)
                            payee_id: 'payee-2', // Parent transaction has different payee
                            category_id: categoryId,
                            deleted: false,
                        },
                    ],
                    subtransactions: [
                        {
                            id: 'subtransaction-1',
                            transaction_id: 'transaction-1',
                            amount: -60000, // -60.00
                            payee_id: payeeId, // This subtransaction has our payee
                            category_id: categoryId,
                            deleted: false,
                        },
                        {
                            id: 'subtransaction-2',
                            transaction_id: 'transaction-1',
                            amount: -40000, // -40.00
                            payee_id: 'payee-2', // This subtransaction has different payee
                            category_id: categoryId,
                            deleted: false,
                        },
                    ],
                },
            };

            storePlan(testData, 'budget-1');
            storeSelectedPlanKey('budget-1');

            const component = mountComponent(payeeId);
            const tableTransactions = component.vm.tableTransactions;

            expect(tableTransactions).toHaveLength(1);
            expect(tableTransactions).toHaveLength(1);
            const transaction = tableTransactions[0];
            expect(transaction.id).toBe('transaction-1');
            expect(transaction.amount).toBe(-100);
            expect(transaction.payee?.id).toBe('payee-2');
            expect(transaction.payee?.name).toBe('Parent Payee');
            expect(transaction.category?.id).toBe(categoryId);
            expect(transaction.is_parent).toBe(true);
            expect(transaction.subtransactions).toHaveLength(1);

            const subtransaction = transaction.subtransactions![0];
            expect(subtransaction.id).toBe('subtransaction-1');
            expect(subtransaction.amount).toBe(-60);
            expect(subtransaction.payee?.id).toBe(payeeId);
            expect(subtransaction.payee?.name).toBe('Test Payee');
            expect(subtransaction.category?.id).toBe(categoryId);
        });
    });

    describe('Payee in both transactions and subtransactions', () => {
        it('should show both relevant transactions and subtransactions', () => {
            const payeeId = 'payee-1';
            const categoryId = 'category-1';

            const testData = {
                budget: {
                    id: 'budget-1',
                    payees: [
                        { id: payeeId, name: 'Test Payee', deleted: false },
                        { id: 'payee-2', name: 'Other Payee', deleted: false },
                    ],
                    categories: [{ id: categoryId, name: 'Test Category', category_group_id: 'group-1', deleted: false }],
                    category_groups: [{ id: 'group-1', name: 'Test Group', deleted: false }],
                    transactions: [
                        {
                            id: 'transaction-1',
                            date: '2025-01-15',
                            amount: -50000, // -50.00
                            payee_id: payeeId, // Direct transaction with our payee
                            category_id: categoryId,
                            deleted: false,
                        },
                        {
                            id: 'transaction-2',
                            date: '2025-01-16',
                            amount: -80000, // -80.00 (total of subtransactions)
                            payee_id: 'payee-2', // Parent transaction has different payee
                            category_id: categoryId,
                            deleted: false,
                        },
                    ],
                    subtransactions: [
                        {
                            id: 'subtransaction-1',
                            transaction_id: 'transaction-2',
                            amount: -60000, // -60.00
                            payee_id: payeeId, // This subtransaction has our payee
                            category_id: categoryId,
                            deleted: false,
                        },
                        {
                            id: 'subtransaction-2',
                            transaction_id: 'transaction-2',
                            amount: -20000, // -20.00
                            payee_id: 'payee-2', // This subtransaction has different payee
                            category_id: categoryId,
                            deleted: false,
                        },
                    ],
                },
            };

            storePlan(testData, 'budget-1');
            storeSelectedPlanKey('budget-1');

            const component = mountComponent(payeeId);
            const tableTransactions = component.vm.tableTransactions;

            expect(tableTransactions).toHaveLength(2);

            // Should include the direct transaction with subtransactions
            const directTransaction = tableTransactions.find((t: any) => t.id === 'transaction-1');
            expect(directTransaction?.id).toBe('transaction-1');
            expect(directTransaction?.amount).toBe(-50);
            expect(directTransaction?.payee?.id).toBe(payeeId);
            expect(directTransaction?.is_parent).toBe(true);
            expect(directTransaction?.subtransactions).toHaveLength(0);

            // Should include the transaction with relevant subtransaction
            const transactionWithSub = tableTransactions.find((t: any) => t.id === 'transaction-2');
            expect(transactionWithSub?.id).toBe('transaction-2');
            expect(transactionWithSub?.amount).toBe(-80);
            expect(transactionWithSub?.payee?.id).toBe('payee-2');
            expect(transactionWithSub?.is_parent).toBe(true);
            expect(transactionWithSub?.subtransactions).toHaveLength(1);

            const subtransaction = transactionWithSub?.subtransactions![0];
            expect(subtransaction?.id).toBe('subtransaction-1');
            expect(subtransaction?.amount).toBe(-60);
            expect(subtransaction?.payee?.id).toBe(payeeId);
        });
    });

    describe('Edge cases', () => {
        it('should handle deleted transactions and subtransactions', () => {
            const payeeId = 'payee-1';
            const categoryId = 'category-1';

            const testData = {
                budget: {
                    id: 'budget-1',
                    payees: [{ id: payeeId, name: 'Test Payee', deleted: false }],
                    categories: [{ id: categoryId, name: 'Test Category', category_group_id: 'group-1', deleted: false }],
                    category_groups: [{ id: 'group-1', name: 'Test Group', deleted: false }],
                    transactions: [
                        {
                            id: 'transaction-1',
                            date: '2025-01-15',
                            amount: -50000,
                            payee_id: payeeId,
                            category_id: categoryId,
                            deleted: true, // This transaction is deleted
                        },
                        {
                            id: 'transaction-2',
                            date: '2025-01-16',
                            amount: -30000,
                            payee_id: payeeId,
                            category_id: categoryId,
                            deleted: false,
                        },
                    ],
                    subtransactions: [
                        {
                            id: 'subtransaction-1',
                            transaction_id: 'transaction-2',
                            amount: -20000,
                            payee_id: payeeId,
                            category_id: categoryId,
                            deleted: true, // This subtransaction is deleted
                        },
                    ],
                },
            };

            storePlan(testData, 'budget-1');
            storeSelectedPlanKey('budget-1');

            const component = mountComponent(payeeId);
            const tableTransactions = component.vm.tableTransactions;

            expect(tableTransactions).toHaveLength(1);
            expect(tableTransactions[0].id).toBe('transaction-2');
        });

        it('should handle missing payee data gracefully', () => {
            const payeeId = 'payee-1';
            const categoryId = 'category-1';

            const testData = {
                budget: {
                    id: 'budget-1',
                    payees: [{ id: 'payee-2', name: 'Other Payee', deleted: false }],
                    categories: [{ id: categoryId, name: 'Test Category', category_group_id: 'group-1', deleted: false }],
                    category_groups: [{ id: 'group-1', name: 'Test Group', deleted: false }],
                    transactions: [
                        {
                            id: 'transaction-1',
                            date: '2025-01-15',
                            amount: -50000,
                            payee_id: payeeId, // Payee not in payees array
                            category_id: categoryId,
                            deleted: false,
                        },
                    ],
                    subtransactions: [],
                },
            };

            storePlan(testData, 'budget-1');
            storeSelectedPlanKey('budget-1');

            const component = mountComponent(payeeId);
            const tableTransactions = component.vm.tableTransactions;

            expect(tableTransactions).toHaveLength(1);
            expect(tableTransactions[0].payee).toBeNull();
        });

        it('should sort transactions by date (newest first)', () => {
            const payeeId = 'payee-1';
            const categoryId = 'category-1';

            const testData = {
                budget: {
                    id: 'budget-1',
                    payees: [{ id: payeeId, name: 'Test Payee', deleted: false }],
                    categories: [{ id: categoryId, name: 'Test Category', category_group_id: 'group-1', deleted: false }],
                    category_groups: [{ id: 'group-1', name: 'Test Group', deleted: false }],
                    transactions: [
                        {
                            id: 'transaction-1',
                            date: '2025-01-15',
                            amount: -50000,
                            payee_id: payeeId,
                            category_id: categoryId,
                            deleted: false,
                        },
                        {
                            id: 'transaction-2',
                            date: '2025-01-20',
                            amount: -30000,
                            payee_id: payeeId,
                            category_id: categoryId,
                            deleted: false,
                        },
                    ],
                    subtransactions: [],
                },
            };

            storePlan(testData, 'budget-1');
            storeSelectedPlanKey('budget-1');

            const component = mountComponent(payeeId);
            const tableTransactions = component.vm.tableTransactions;

            expect(tableTransactions).toHaveLength(2);
            expect(tableTransactions[0].id).toBe('transaction-2'); // Newer date first
            expect(tableTransactions[1].id).toBe('transaction-1'); // Older date second
        });
    });
});

describe('selectedPayee computed property', () => {
    it('should return the correct payee', () => {
        const payeeId = 'payee-1';

        const testData = {
            budget: {
                id: 'budget-1',
                payees: [
                    { id: payeeId, name: 'Test Payee', deleted: false },
                    { id: 'payee-2', name: 'Other Payee', deleted: false },
                ],
                categories: [],
                category_groups: [],
                transactions: [],
                subtransactions: [],
            },
        };

        storePlan(testData, 'budget-1');
        storeSelectedPlanKey('budget-1');

        const component = mountComponent(payeeId);
        const selectedPayee = component.vm.selectedPayee;

        expect(selectedPayee).toMatchObject({
            id: payeeId,
            name: 'Test Payee',
        });
    });

    it('should return undefined for non-existent payee', () => {
        const payeeId = 'non-existent-payee';

        const testData = {
            budget: {
                id: 'budget-1',
                payees: [{ id: 'payee-1', name: 'Test Payee', deleted: false }],
                categories: [],
                category_groups: [],
                transactions: [],
                subtransactions: [],
            },
        };

        storePlan(testData, 'budget-1');
        storeSelectedPlanKey('budget-1');

        const component = mountComponent(payeeId);
        const selectedPayee = component.vm.selectedPayee;

        expect(selectedPayee).toBeUndefined();
    });
});
