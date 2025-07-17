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
    <div v-if="notConsented" class="bg-background fixed right-0 bottom-0 left-0 z-50 border-t shadow-lg">
        <!-- Cookie Banner -->
        <div class="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div class="flex flex-col items-center space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
                <!-- Content -->
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                            <svg class="text-primary h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                    <div class="flex-1">
                        <p class="text-muted-foreground text-sm">
                            We use cookies and local storage to ensure the site functions. Continuing to use the site means you agree to the current
                            data storage standards as outlined in the
                            <a class="text-primary font-medium hover:underline" :href="route('privacy')">Privacy Policy</a>.
                        </p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex space-x-2">
                    <Button @click="accept" size="sm">Accept</Button>
                    <Button variant="outline" @click="close" size="sm">Close</Button>
                </div>
            </div>
        </div>
    </div>
</template>
