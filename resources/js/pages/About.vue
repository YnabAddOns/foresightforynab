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
    <Head title="About" />

    <div class="flex flex-col gap-y-4">
        <h1 class="text-3xl font-bold">About</h1>

        <p>Hi, I'm <a target="_blank" class="text-blue-500 hover:underline" href="https://github.com/danielh-official">Daniel Haven</a>.</p>

        <p>As an avid YNAB user, I noticed some missing features and decided to use YNAB's API to build them for myself.</p>

        <p>
            {{ props.name }}'s primary purpose is to show you the future of your income and expenses based on your scheduled and repeating
            transactions.
        </p>

        <p>
            I've also added the ability to see your historical transactions as well as a table of your repeating transactions, both of which can be
            exported to CSV.
        </p>

        <p>
            Also, another project I worked on is
            <a target="_blank" class="text-blue-500 hover:underline" href="https://repeatingexportforynab.com/">Repeating Export (For YNAB)</a>.
            Having a clear understanding of my repeating income and expenses is important for me, as it gives me better control over my fiscal
            destiny.
        </p>

        <p>I hope that this tool gives you a better level of control as well.</p>

        <h2 class="text-2xl font-bold">Other Apps</h2>

        <p>For viewing all apps that integrate with YNAB, see:</p>
        <ul class="list-disc pl-5">
            <li>
                The YNAB API Docs:
                <a href="https://api.ynab.com/#works-with-ynab-official" target="_blank" class="text-blue-500 hover:underline">Link</a>
            </li>
            <li>
                Or My Notion Website, which has filtering and sorting options:
                <a
                    href="https://danielhaven-personal.notion.site/Integrates-With-YNAB-21e225ca9695803793d3c6081509fd20?pvs=143"
                    target="_blank"
                    class="text-blue-500 hover:underline"
                    >Link</a
                >
            </li>
        </ul>
    </div>
</template>
