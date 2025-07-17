<script setup lang="ts">
import { computed, ref } from 'vue';
import Button from '@/components/ui/Button.vue';

const props = defineProps({
    cookieConsent: Boolean,
});

const consented = ref(props.cookieConsent ?? false);

const notConsented = computed(() => !consented.value);

function accept() {
    consented.value = true;
    window.location.href = route('home', { cookie_consent: true });
}

function close() {
    consented.value = true;
}
</script>

<template>
    <div v-if="notConsented" class="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-background/80 backdrop-blur-sm" @click="close"></div>

        <!-- Cookie Banner -->
        <div class="relative w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <div class="flex items-start space-x-4">
                <!-- Icon -->
                <div class="flex-shrink-0">
                    <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg class="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                </div>

                <!-- Content -->
                <div class="flex-1 space-y-3">
                    <h3 class="text-lg font-semibold">Cookie Consent</h3>
                    <p class="text-sm text-muted-foreground">
                        We use cookies and local storage to ensure the site functions. Clicking "Accept" means you agree
                        to the current data
                        storage standards as outlined in the
                        <a class="text-primary hover:underline font-medium" :href="route('privacy')">Privacy Policy</a>.
                    </p>

                    <!-- Actions -->
                    <div class="flex space-x-2 pt-2">
                        <Button @click="accept" class="flex-1">
                            Accept
                        </Button>
                        <Button variant="outline" @click="close" class="flex-1">
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
