<script setup lang="ts">
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
                    <Link class="hover:underline" :href="route('privacy')">Privacy</Link>
                </div>
            </nav>
        </header>
        <p class="text-center italic underline">This product is in <b>early alpha</b>.</p>
        <div class="flex w-full items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
            <main class="ml-4 w-full flex-col-reverse overflow-hidden rounded-lg lg:max-w-5xl lg:flex-row">
                <slot />
            </main>
        </div>
        <div class="hidden h-14.5 lg:block"></div>
    </div>
</template>
