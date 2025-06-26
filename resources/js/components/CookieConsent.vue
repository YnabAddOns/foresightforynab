<script setup lang="ts">
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
    <section v-if="notConsented" class="dark:bg-dark bg-white pt-20 pb-12 lg:pt-[120px] lg:pb-[90px]">
        <div class="container mx-auto">
            <div
                class="bg-gray-2 dark:bg-dark-2 xs:px-10 border-stroke dark:border-dark-3 flex flex-wrap items-center justify-between rounded-lg border px-6 py-8 md:px-8 lg:px-10"
            >
                <div class="w-full md:w-7/12 lg:w-2/3">
                    <div class="mb-6 md:mb-0">
                        <p class="text-body-color dark:text-dark-6 text-base">
                            We use cookies and local storage to ensure the site functions. Clicking "Accept" means you agree to the current data
                            storage standards as outlined in the
                            <a class="text-blue-500 hover:underline" :href="route('privacy')">Privacy Policy</a>.
                        </p>
                    </div>
                </div>
                <div class="w-full md:w-5/12 lg:w-1/3">
                    <div class="flex items-center space-x-3 md:justify-end">
                        <button
                            class="bg-primary hover:bg-blue-dark inline-flex cursor-pointer items-center justify-center rounded-md px-7 py-3 text-center text-base font-medium text-white"
                            @click="accept"
                        >
                            Accept
                        </button>
                        <button
                            class="text-body-color dark:text-dark-6 shadow-1 hover:bg-primary dark:bg-dark inline-flex cursor-pointer items-center justify-center rounded-md bg-white px-7 py-3 text-center text-base font-medium hover:text-white dark:shadow-none"
                            @click="close"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
