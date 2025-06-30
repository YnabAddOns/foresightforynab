import { faker } from '@faker-js/faker/locale/en';
import { Factory } from 'fishery';
import { DateTime } from 'luxon';
import * as ynab from 'ynab';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
export const TransactionFactory = Factory.define<ynab.TransactionDetail>(() => {
    return {
        id: faker.string.uuid(),
        date: DateTime.now().toISODate(),
        amount: faker.number.bigInt({ min: 1000 }),
        memo: null,
        cleared: 'cleared',
        approved: true,
        flag_color: null,
        flag_name: null,
        account_id: faker.string.uuid(),
        payee_id: faker.string.uuid(),
        category_id: faker.string.uuid(),
        transfer_account_id: null,
        transfer_transaction_id: null,
        matched_transaction_id: null,
        import_id: null,
        import_payee_name: null,
        import_payee_name_original: null,
        debt_transaction_type: null,
        deleted: false,
        account_name: faker.string.alphanumeric(),
        payee_name: faker.company.name(),
        category_name: faker.commerce.department(),
        subtransactions: [],
    };
});
