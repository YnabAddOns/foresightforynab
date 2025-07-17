<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import { computed, ref } from 'vue';

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
        <div class="bg-background/80 fixed inset-0 backdrop-blur-sm" @click="close"></div>

        <!-- Cookie Banner -->
        <div class="bg-card relative w-full max-w-md rounded-lg border p-6 shadow-lg">
            <div class="flex items-start space-x-4">
                <!-- Icon -->
                <div class="flex-shrink-0">
                    <div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                        <svg class="text-primary h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fill-rule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </div>
                </div>

                <!-- Content -->
                <div class="flex-1 space-y-3">
                    <h3 class="text-lg font-semibold">Cookie Consent</h3>
                    <p class="text-muted-foreground text-sm">
                        We use cookies and local storage to ensure the site functions. Clicking "Accept" means you agree to the current data storage
                        standards as outlined in the
                        <a class="text-primary font-medium hover:underline" :href="route('privacy')">Privacy Policy</a>.
                    </p>

                    <!-- Actions -->
                    <div class="flex space-x-2 pt-2">
                        <Button @click="accept" class="flex-1"> Accept </Button>
                        <Button variant="outline" @click="close" class="flex-1"> Close </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
