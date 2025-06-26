<script setup lang="ts">
import CookieConsent from '@/components/CookieConsent.vue';
import { getPlan, getSelectedPlanKey } from '@/composables/useStorage';
import { Link } from '@inertiajs/vue3';
import { computed } from 'vue';

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
});

const selectedPlanName = computed(() => {
    return getPlan(getSelectedPlanKey())?.budget?.name;
});
</script>

<template>
    <CookieConsent />
    <div
        class="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a] dark:text-gray-300 dark:[color-scheme:dark]"
    >
        <header class="mb-6 w-full text-sm not-has-[nav]:hidden lg:max-w-4xl">
            <nav class="flex items-center justify-between gap-4">
                <h1 class="text-3xl font-bold">
                    <Link :href="route('home')">{{ props.name }}</Link>
                </h1>
                <div class="flex gap-x-4">
                    <Link class="hover:underline" :href="route('home')">Home</Link>
                    <Link class="hover:underline" :href="route('repeating')">Repeating (Budget: {{ selectedPlanName }})</Link>
                    <Link class="hover:underline" :href="route('about')">About</Link>
                    <Link class="hover:underline" :href="route('privacy')">Privacy</Link>
                </div>
            </nav>
        </header>
        <p class="w-80 text-center italic">
            This product is in <b>early alpha</b> and is currently managed by a solo developer with a full-time job doing something else. Please be
            patient and send any and all feedback (feature requests, bugs, etc.) to
            <a class="text-blue-500 hover:underline" href="mailto:feedback@foresightforynab.com">feedback@foresightforynab.com</a>. View the roadmap
            <a class="text-blue-500 hover:underline" target="_blank" href="https://github.com/orgs/YNAB-Add-Ons/projects/1/views/1">here</a>.
        </p>
        <div class="mt-4 justify-items-center">
            <a href="https://ynab.com" target="_blank">
                <img src="https://api.ynab.com/papi/works_with_ynab.svg" alt="Works With YNAB" />
            </a>
        </div>
        <div class="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
            <main class="ml-4 w-full flex-col-reverse overflow-hidden rounded-lg lg:max-w-5xl lg:flex-row">
                <slot />
            </main>
        </div>
        <div class="hidden h-14.5 lg:block"></div>
    </div>
    <footer class="p-4">
        <div class="text-center">
            Copyright &copy; {{ new Date().getFullYear() }}
            <a target="_blank" class="text-blue-500 hover:underline" href="https://github.com/YNAB-Add-Ons">YNAB Add-Ons</a>. All rights reserved.
            <div class="mt-5">
                <p>We are not affiliated, associated, or in any way officially connected with YNAB or any of its subsidiaries or affiliates.</p>
                <p>
                    The official YNAB website can be found at
                    <a class="text-blue-500 hover:underline" target="_blank" href="https://www.ynab.com">https://www.ynab.com</a>.
                </p>
                <p>
                    The names YNAB and You Need A Budget, as well as related names, tradenames, marks, trademarks, emblems, and images are registered
                    trademarks of YNAB.
                </p>
            </div>
        </div>
    </footer>
</template>
