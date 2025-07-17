<script setup lang="ts">
import CookieConsent from '@/components/CookieConsent.vue';
import { getPlanFromBudgetsData, getSelectedPlanKey } from '@/composables/useStorage';
import { Link } from '@inertiajs/vue3';
import { computed } from 'vue';

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    cookieConsent: Boolean,
    ynabReferralLink: String,
    supportEmail: String,
});

const selectedPlanKey = computed(() => {
    return getSelectedPlanKey();
});

const selectedPlanName = computed(() => {
    return getPlanFromBudgetsData(selectedPlanKey.value)?.budget?.name ?? null;
});
</script>

<template>
    <CookieConsent :cookie-consent="cookieConsent" />
    <div class="bg-background min-h-screen" :class="{ 'pb-20': !cookieConsent }">
        <!-- Header -->
        <header
            class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex h-16 items-center justify-between">
                    <!-- Logo -->
                    <div class="flex items-center space-x-4">
                        <Link :href="route('home')" class="flex items-center space-x-2">
                        <div class="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                            <span class="text-primary-foreground text-sm font-bold">F</span>
                        </div>
                        <span class="text-foreground text-xl font-bold">{{ props.name }}</span>
                        </Link>
                    </div>

                    <!-- Navigation -->
                    <nav class="hidden items-center space-x-6 md:flex">
                        <Link :href="route('home')"
                            class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                        Home
                        </Link>
                        <Link v-if="selectedPlanName" :href="route('repeating')"
                            class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                        Repeating ({{ selectedPlanName }})
                        </Link>
                        <Link :href="route('about')"
                            class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                        About
                        </Link>
                        <Link :href="route('privacy')"
                            class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                        Privacy
                        </Link>
                    </nav>

                    <!-- Mobile menu button -->
                    <button
                        class="text-muted-foreground hover:text-foreground hover:bg-accent rounded-md p-2 md:hidden">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <!-- Alpha Notice -->
            <div class="bg-muted/50 mb-8 rounded-lg border p-4">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="flex-1">
                        <p class="text-muted-foreground text-sm">
                            This product is in <span class="text-foreground font-semibold">early alpha</span> and is
                            currently managed by a solo
                            developer.
                            <span v-if="supportEmail">Please be patient and send any and all feedback (feature requests,
                                bugs, etc.) to
                                <a class="text-primary font-medium hover:underline" :href="`mailto:${supportEmail}`"> {{
                                    supportEmail }} </a>.</span>
                            View the roadmap
                            <a class="text-primary font-medium hover:underline" target="_blank"
                                href="https://github.com/orgs/YnabAddOns/projects/1">
                                here </a>.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Page Content -->
            <div class="flex w-full items-center justify-center">
                <div class="w-full max-w-5xl">
                    <slot />
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="bg-muted/50 border-t">
            <div class="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div class="flex flex-col items-center space-y-4 md:flex-row md:justify-between md:space-y-0">
                    <div class="text-center md:text-left">
                        <p class="text-muted-foreground text-sm">
                            Copyright &copy; {{ new Date().getFullYear() }}
                            <a target="_blank" class="text-primary font-medium hover:underline"
                                href="https://github.com/YnabAddOns"> YNAB Add-Ons </a>. All rights reserved.
                        </p>
                    </div>

                    <!-- YNAB Badge -->
                    <div class="flex items-center space-x-4">
                        <a :href="ynabReferralLink" target="_blank" class="transition-opacity hover:opacity-80">
                            <img src="https://api.ynab.com/papi/works_with_ynab.svg" alt="Works With YNAB" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>
