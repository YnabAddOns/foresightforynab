<script setup lang="ts">
import CookieConsent from '@/components/CookieConsent.vue';
import PrivacyPolicyBanner from '@/components/PrivacyPolicyBanner.vue';
import { getPlanFromBudgetsData, getSelectedPlanKey } from '@/composables/useStorage';
import { Link } from '@inertiajs/vue3';
import { computed, ref } from 'vue';

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    cookieConsent: Boolean,
    ynabReferralLink: String,
    supportEmail: String,
    privacyPolicyVersion: {
        type: String,
        default: '',
    },
    privacyPolicyChangeDate: {
        type: String,
        default: '',
    },
    privacyPolicyChangeDescription: {
        type: String,
        default: '',
    },
    roadmapUrl: {
        type: String,
        default: '',
    },
});

const selectedPlanKey = computed(() => {
    return getSelectedPlanKey();
});

const selectedPlanName = computed(() => {
    return getPlanFromBudgetsData(selectedPlanKey.value)?.budget?.name ?? null;
});

// Mobile menu state
const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false;
};
</script>

<template>
    <CookieConsent :cookie-consent="cookieConsent" />
    <PrivacyPolicyBanner
        :current-version="privacyPolicyVersion"
        :change-date="privacyPolicyChangeDate"
        :change-description="privacyPolicyChangeDescription"
    />
    <div class="bg-background min-h-screen" :class="{ 'pb-20': !cookieConsent }">
        <!-- Header -->
        <header class="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex h-16 items-center justify-between">
                    <!-- Logo -->
                    <div class="flex items-center space-x-4">
                        <Link :href="route('home')" class="flex items-center space-x-2" @click="closeMobileMenu">
                            <div class="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                                <span class="text-primary-foreground text-sm font-bold">F</span>
                            </div>
                            <span class="text-foreground text-xl font-bold">{{ props.name }}</span>
                        </Link>
                    </div>

                    <!-- Desktop Navigation -->
                    <nav class="hidden items-center space-x-6 md:flex">
                        <Link :href="route('home')" class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                            Home
                        </Link>
                        <Link
                            v-if="selectedPlanName"
                            :href="route('repeating')"
                            class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                        >
                            Repeating ({{ selectedPlanName }})
                        </Link>
                        <Link :href="route('about')" class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                            About
                        </Link>
                        <Link :href="route('privacy')" class="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
                            Privacy
                        </Link>
                    </nav>

                    <!-- Mobile menu button -->
                    <button
                        @click="toggleMobileMenu"
                        class="text-muted-foreground hover:text-foreground hover:bg-accent rounded-md p-2 transition-colors md:hidden"
                        :aria-expanded="isMobileMenuOpen"
                        aria-label="Toggle mobile menu"
                    >
                        <svg
                            class="h-6 w-6 transition-transform duration-200"
                            :class="{ 'rotate-90': isMobileMenuOpen }"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                v-if="!isMobileMenuOpen"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Mobile Navigation Menu -->
                <div v-show="isMobileMenuOpen" class="md:hidden">
                    <div class="border-border space-y-2 border-t py-4">
                        <Link
                            :href="route('home')"
                            class="text-muted-foreground hover:text-foreground hover:bg-accent block rounded-md px-2 py-2 text-sm font-medium transition-colors"
                            @click="closeMobileMenu"
                        >
                            Home
                        </Link>
                        <Link
                            v-if="selectedPlanName"
                            :href="route('repeating')"
                            class="text-muted-foreground hover:text-foreground hover:bg-accent block rounded-md px-2 py-2 text-sm font-medium transition-colors"
                            @click="closeMobileMenu"
                        >
                            Repeating ({{ selectedPlanName }})
                        </Link>
                        <Link
                            :href="route('about')"
                            class="text-muted-foreground hover:text-foreground hover:bg-accent block rounded-md px-2 py-2 text-sm font-medium transition-colors"
                            @click="closeMobileMenu"
                        >
                            About
                        </Link>
                        <Link
                            :href="route('privacy')"
                            class="text-muted-foreground hover:text-foreground hover:bg-accent block rounded-md px-2 py-2 text-sm font-medium transition-colors"
                            @click="closeMobileMenu"
                        >
                            Privacy
                        </Link>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
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
                            <a target="_blank" class="text-primary font-medium hover:underline" href="https://github.com/YnabAddOns"> YNAB Add-Ons </a
                            >. All rights reserved.
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
