<script setup lang="ts">
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal.vue';
import Button from '@/components/ui/Button.vue';
import { usePrivacyPolicy } from '@/composables/usePrivacyPolicy';
import { DateTime } from 'luxon';
import { computed } from 'vue';

const props = defineProps({
    currentVersion: {
        type: String,
        required: true,
    },
    changeDate: {
        type: String,
        required: true,
    },
    changeDescription: {
        type: String,
        required: true,
    },
});

const { showModal, shouldShowBanner, acknowledgeChanges, openModal, closeModal, handleModalAcknowledge } = usePrivacyPolicy(props.currentVersion);

const changeDateFormatted = computed(() => {
    return DateTime.fromISO(props.changeDate).toLocaleString(DateTime.DATE_MED);
});
</script>

<template>
    <div v-if="shouldShowBanner" class="bg-background top-16 right-0 left-0 z-40 border-b shadow-lg">
        <!-- Privacy Policy Update Banner -->
        <div class="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div class="flex flex-col items-center space-y-4 sm:flex-row sm:justify-between sm:space-y-0">
                <!-- Content -->
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                            <svg class="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p class="text-muted-foreground text-sm">
                            <strong class="text-foreground">Privacy Policy Updated:</strong>
                            Our privacy policy was updated on {{ changeDateFormatted }}.
                        </p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex space-x-2">
                    <Button @click="openModal" size="sm">View Details</Button>
                </div>
            </div>
        </div>
    </div>

    <!-- Privacy Policy Modal -->
    <PrivacyPolicyModal
        :is-open="showModal"
        :current-version="currentVersion"
        :change-date="changeDate"
        :change-description="changeDescription"
        @close="closeModal"
        @acknowledge="handleModalAcknowledge"
    />
</template>
