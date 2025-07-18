import { clearAllData, storeEndDate, storeFlowType, storePlan, storeSelectedPlanKey, storeStartDate } from '@/composables/useStorage';
import { TransactionFactory } from '@/factories/factory';
import { mount } from '@vue/test-utils';
import { DateTime } from 'luxon';
import * as fs from 'node:fs';
import Welcome from '../pages/Welcome.vue';

vi.mock('@inertiajs/vue3', () => ({
    Head: () => {},
}));

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
    vi.clearAllMocks();
});

const singlePlanResponseContent = JSON.parse(fs.readFileSync(`${__dirname}/Fixtures/single-budget-response-content.json`, 'utf8'));

afterEach(() => {
    clearAllData();
});

const ynabAuthorizationUrl: string =
    'https://app.ynab.com/oauth/authorize?client_id=client-id&redirect_uri=https%3A%2F%2Fhow-much-for-ynab.test&response_type=token';

function mountComponent(): any | { vm: { ynabApi: any } } {
    return mount(Welcome, {
        props: {
            ynabAuthorizationUrl,
        },
    });
}

describe('props', () => {
    test('ynabAccessToken', () => {
        expect(mountComponent().props().ynabAccessToken).toBeNull();
    });
});

describe('data', () => {
    describe('ynabApi', () => {
        test('ynabAccessToken is falsy', () => {
            expect(mountComponent().vm.ynabApi).toBeNull();
        });

        test('ynabAccessToken is truthy', () => {
            const vm: any = mount(Welcome, {
                props: {
                    ynabAccessToken: 'test',
                    ynabAuthorizationUrl,
                },
            }).vm;

            expect(vm.ynabApi).not.toBeNull();
        });
    });
});

describe('computed', () => {
    describe('categories', () => {
        test('missing', () => {
            expect(mountComponent().vm.categories).toStrictEqual([]);
        });

        test('exists', () => {
            const categories = singlePlanResponseContent.data.budget.categories;

            const plan = { budget: { categories, id: 'test' } };

            storePlan(plan, 'test');

            storeSelectedPlanKey('test');

            const component: any = mount(Welcome, {
                props: {
                    ynabAuthorizationUrl,
                },
            });

            categories[0].category_group = null;

            expect(component.vm.categories).toStrictEqual(categories);
        });
    });

    describe('payees', () => {
        test('missing', () => {
            expect(mountComponent().vm.payees).toStrictEqual([]);
        });

        test('exists', () => {
            const payees = singlePlanResponseContent.data.budget.payees;

            const plan = { budget: { payees, id: 'test' } };

            storePlan(plan, 'test');

            storeSelectedPlanKey('test');

            const component: any = mount(Welcome, {
                props: {
                    ynabAuthorizationUrl,
                },
            });

            expect(component.vm.payees).toStrictEqual([
                {
                    ...payees[0],
                    repeating_transaction: null,
                },
            ]);
        });
    });

    describe('filteredTotalAmount', () => {
        test('missing', () => {
            expect(mountComponent().vm.filteredTotalAmount).toBe(0);
        });

        test('exists', () => {
            const transactions = [
                {
                    date: '2025-05-09',
                    amount: -100000,
                    deleted: false,
                },
                {
                    date: '2025-05-10',
                    amount: -200000,
                    deleted: false,
                },
                {
                    date: '2025-05-11',
                    amount: -150000,
                    deleted: false,
                },
            ];

            const plan = { budget: { transactions, id: 'test' } };

            storePlan(plan, 'test');

            storeSelectedPlanKey('test');

            const component: any = mount(Welcome, {
                props: {
                    ynabAuthorizationUrl,
                },
            });

            component.vm.startDate = '2025-05-01';

            component.vm.endDate = '2025-05-31';

            component.vm.flowType = 'outflow';

            expect(component.vm.filteredTotalAmount).toBe(450);
        });
    });

    describe('yearMonthAggregates', () => {
        test('missing', () => {
            vi.setSystemTime('2025-05-09');

            storeStartDate('2025-05-01');
            storeEndDate('2025-05-31');

            const component: any = mount(Welcome, {
                props: {
                    ynabAuthorizationUrl,
                },
            });

            expect(component.vm.yearMonthAggregates).toStrictEqual([
                {
                    year: 2025,
                    initialMonth: 'May',
                    current: true,
                    months: [
                        {
                            name: 'May',
                            amount: 0,
                            revenue: 0,
                            expense: 0,
                            net: 0,
                            current: true,
                        },
                    ],
                    amount: 0,
                    revenue: 0,
                    expense: 0,
                    net: 0,
                },
            ]);
        });

        test.each([
            {
                flowType: 'all',
                expected: [
                    {
                        year: 2025,
                        initialMonth: 'May',
                        current: true,
                        months: [
                            {
                                name: 'May',
                                amount: 950,
                                revenue: 500,
                                expense: 450,
                                net: 50,
                                current: true,
                            },
                        ],
                        amount: 950,
                        revenue: 500,
                        expense: 450,
                        net: 50,
                    },
                ],
            },
            {
                flowType: 'inflow',
                expected: [
                    {
                        year: 2025,
                        initialMonth: 'May',
                        current: true,
                        months: [
                            {
                                name: 'May',
                                amount: 500,
                                revenue: 500,
                                expense: 0,
                                net: 500,
                                current: true,
                            },
                        ],
                        amount: 500,
                        revenue: 500,
                        expense: 0,
                        net: 500,
                    },
                ],
            },
            {
                flowType: 'outflow',
                expected: [
                    {
                        year: 2025,
                        initialMonth: 'May',
                        current: true,
                        months: [
                            {
                                name: 'May',
                                amount: 450,
                                revenue: 0,
                                expense: 450,
                                net: -450,
                                current: true,
                            },
                        ],
                        amount: 450,
                        revenue: 0,
                        expense: 450,
                        net: -450,
                    },
                ],
            },
        ])('exists: flowType', ({ flowType, expected }) => {
            vi.setSystemTime('2025-05-02');

            const transactions = [
                {
                    date: '2025-05-09',
                    amount: -100000,
                    deleted: false,
                },
                {
                    date: '2025-05-10',
                    amount: -200000,
                    deleted: false,
                },
                {
                    date: '2025-05-11',
                    amount: -150000,
                    deleted: false,
                },
                {
                    date: '2025-05-10',
                    amount: -150000,
                    deleted: true,
                },
                {
                    date: '2025-05-11',
                    amount: 700000,
                    deleted: true,
                },
                {
                    date: '2025-05-10',
                    amount: 500000,
                    deleted: false,
                },
            ];

            const plan = { budget: { transactions, id: 'test' } };

            storePlan(plan, 'test');

            storeSelectedPlanKey('test');

            const component: any = mount(Welcome, {
                props: {
                    ynabAuthorizationUrl,
                },
            });

            component.vm.startDate = '2025-05-01';

            component.vm.endDate = '2025-05-31';

            component.vm.flowType = flowType;

            expect(component.vm.yearMonthAggregates).toStrictEqual(expected);
        });

        test('up to end of year', () => {
            vi.setSystemTime('2025-06-02');

            const transactions = [];

            let date = DateTime.fromISO('2025-01-25');

            for (let i = 1; i <= 12; i++) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                transactions.push(
                    TransactionFactory.build({
                        date: date.toISO(),
                        amount: -100000,
                        deleted: false,
                    }),
                );

                date = date.plus({ months: 1 });
            }

            const plan = { budget: { transactions, id: 'test' } };

            storePlan(plan, 'test');

            storeSelectedPlanKey('test');

            storeStartDate('2025-01-01');

            storeEndDate('2025-12-31');

            storeFlowType('all');

            const component: any = mount(Welcome, {
                props: {
                    ynabAuthorizationUrl,
                },
            });

            expect(component.vm.yearMonthAggregates).toStrictEqual([
                {
                    year: 2025,
                    initialMonth: 'January',
                    months: [
                        {
                            name: 'January',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: false,
                        },
                        {
                            name: 'February',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: false,
                        },
                        {
                            name: 'March',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: false,
                        },
                        {
                            name: 'April',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: false,
                        },
                        {
                            name: 'May',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: false,
                        },
                        {
                            name: 'June',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: true,
                        },
                        {
                            name: 'July',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: false,
                        },
                        {
                            name: 'August',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: false,
                        },
                        {
                            name: 'September',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: false,
                        },
                        {
                            name: 'October',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: false,
                        },
                        {
                            name: 'November',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: false,
                        },
                        {
                            name: 'December',
                            amount: 100,
                            revenue: 0,
                            expense: 100,
                            net: -100,
                            current: false,
                        },
                    ],
                    amount: 1200,
                    revenue: 0,
                    expense: 1200,
                    net: -1200,
                    current: true,
                },
            ]);
        });
    });

    describe('tableTransactions', () => {
        test('missing', () => {
            expect(mountComponent().vm.tableTransactions).toStrictEqual([]);
        });

        test('exists', () => {
            const transactions = [
                {
                    date: '2025-05-09',
                    amount: -100000,
                    deleted: false,
                },
                {
                    date: '2025-05-10',
                    amount: -200000,
                    deleted: false,
                },
                {
                    date: '2025-05-11',
                    amount: -150000,
                    deleted: false,
                },
            ];

            const plan = { budget: { transactions, id: 'test' } };

            storePlan(plan, 'test');

            storeSelectedPlanKey('test');

            const component: any = mount(Welcome, {
                props: {
                    ynabAuthorizationUrl,
                },
            });

            component.vm.startDate = '2025-05-01';

            component.vm.endDate = '2025-05-31';

            const transactionOne = component.vm.tableTransactions[0];

            expect(transactionOne).toStrictEqual({
                absolute_amount: 150,
                amount: -150,
                category: null,
                date: DateTime.fromISO('2025-05-11'),
                flow_type: 'outflow',
                frequency: null,
                id: undefined,
                parent_transaction: null,
                payee: null,
            });

            const transactionTwo = component.vm.tableTransactions[1];

            expect(transactionTwo).toStrictEqual({
                absolute_amount: 200,
                amount: -200,
                category: null,
                date: DateTime.fromISO('2025-05-10'),
                flow_type: 'outflow',
                frequency: null,
                id: undefined,
                parent_transaction: null,
                payee: null,
            });

            const transactionThree = component.vm.tableTransactions[2];

            expect(transactionThree).toStrictEqual({
                absolute_amount: 100,
                amount: -100,
                category: null,
                date: DateTime.fromISO('2025-05-09'),
                flow_type: 'outflow',
                frequency: null,
                id: undefined,
                parent_transaction: null,
                payee: null,
            });
        });
    });
});
