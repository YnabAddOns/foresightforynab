<script setup lang="ts">
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';
import CardContent from '@/components/ui/CardContent.vue';
import CardDescription from '@/components/ui/CardDescription.vue';
import CardHeader from '@/components/ui/CardHeader.vue';
import CardTitle from '@/components/ui/CardTitle.vue';
import { computed } from 'vue';

const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true,
    },
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

const emit = defineEmits(['close', 'acknowledge']);

const formattedDate = computed(() => {
    return new Date(props.changeDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
});

function handleClose() {
    emit('close');
}

function handleAcknowledge() {
    emit('acknowledge');
    handleClose();
}

function handleViewFullPolicy() {
    window.location.href = route('privacy');
}
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="bg-background/80 absolute inset-0 backdrop-blur-sm" @click="handleClose"></div>

        <!-- Modal -->
        <div class="relative mx-4 w-full max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle class="flex items-center space-x-2">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                            <svg class="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                        <span>Privacy Policy Updated</span>
                    </CardTitle>
                    <CardDescription> Version {{ currentVersion }} - {{ formattedDate }} </CardDescription>
                </CardHeader>

                <CardContent class="space-y-6">
                    <!-- Change Description -->
                    <div>
                        <h3 class="text-foreground mb-2 text-lg font-semibold">What Changed</h3>
                        <p class="text-muted-foreground">{{ changeDescription }}</p>
                    </div>

                    <!-- Important Notice -->
                    <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div class="flex items-start space-x-3">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fill-rule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clip-rule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div>
                                <p class="text-sm text-amber-800">
                                    <strong>Important:</strong> By continuing to use this application, you acknowledge that you have read and
                                    understood the updated privacy policy.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <!-- Actions -->
                <div class="bg-muted/50 border-t px-6 py-4">
                    <div class="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2">
                        <Button variant="outline" @click="handleClose">Close</Button>
                        <Button @click="handleViewFullPolicy">View Full Policy</Button>
                        <Button @click="handleAcknowledge" variant="default">Acknowledge & Continue</Button>
                    </div>
                </div>
            </Card>
        </div>
    </div>
</template>
