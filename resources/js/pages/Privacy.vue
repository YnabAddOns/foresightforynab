<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Layout from '../layouts/AppLayout.vue';

defineOptions({ layout: Layout });

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
});
</script>

<template>
    <Head title="Privacy" />

    <div class="flex flex-col gap-y-4">
        <h1 class="text-3xl font-bold">Privacy</h1>

        <p>"{{ props.name }}" does not store any of your data on the server or database.</p>

        <p>
            It uses "<a
                href="https://api.ynab.com/#oauth-applications"
                target="_blank"
                class="cursor-pointer rounded-sm border border-transparent leading-normal text-gray-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#EDEDEC]"
                >Implicit Grant Flow</a
            >" to grab the access token. The access token is stored in an encrypted cookie and expires in 2 hours (as per YNAB's token expiration
            policy).
        </p>

        <p>
            The data retrieved from YNAB is not stored in a database, but in your browser's
            <a
                href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage"
                target="_blank"
                class="cursor-pointer rounded-sm border border-transparent leading-normal text-gray-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#EDEDEC]"
                >local storage</a
            >, which is a functionality provided by most modern browsers. Your data will only exist in the browser you downloaded it to. For example,
            if you only get it in Firefox and then switch to Google Chrome, you will have to retrieve your data again in Chrome.
        </p>

        <p>Also, anonymized data is sent to Laravel Nightwatch for issue tracking.</p>

        <h2 class="text-xl font-bold">Statement of Affiliation</h2>

        <p>We are not affiliated, associated, or in any way officially connected with YNAB, or any of its subsidiaries or its affiliates.</p>

        <p>We are fans of YNAB and wanted to give you more insight into your future transactions, so we made this tool.</p>

        <p>
            The official YNAB website can be found at
            <a
                href="https://ynab.com"
                target="_blank"
                class="cursor-pointer rounded-sm border border-transparent leading-normal text-blue-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#EDEDEC]"
                >https://www.ynab.com</a
            >. The names YNAB and You Need A Budget as well as related names, marks, emblems and images are registered trademarks of YNAB.
        </p>
    </div>
</template>
