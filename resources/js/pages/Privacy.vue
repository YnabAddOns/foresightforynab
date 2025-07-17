<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import CardContent from '@/components/ui/CardContent.vue';
import CardDescription from '@/components/ui/CardDescription.vue';
import CardHeader from '@/components/ui/CardHeader.vue';
import CardTitle from '@/components/ui/CardTitle.vue';
import { Head } from '@inertiajs/vue3';
import Layout from '../layouts/AppLayout.vue';

defineOptions({ layout: Layout });

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
});
</script>

<template>
    <Head title="Privacy" />

    <div class="space-y-8">
        <!-- Header Section -->
        <div class="space-y-4 text-center">
            <h1 class="text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <p class="text-muted-foreground mx-auto max-w-3xl text-xl">How {{ props.name }} handles your data and privacy</p>
        </div>

        <!-- Data Storage -->
        <Card>
            <CardHeader>
                <CardTitle>Data Storage</CardTitle>
                <CardDescription>How we handle your information</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                            <svg class="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p class="text-muted-foreground">
                            <strong class="text-foreground">{{ props.name }}</strong> does not store any of your data on the server or database.
                        </p>
                    </div>
                </div>

                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                            <svg class="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p class="text-muted-foreground">
                            It uses
                            <a href="https://api.ynab.com/#oauth-applications" target="_blank" class="text-primary font-medium hover:underline">
                                Implicit Grant Flow
                            </a>
                            to grab the access token. The access token is stored in an encrypted cookie and expires in 2 hours (as per YNAB's token
                            expiration policy).
                        </p>
                    </div>
                </div>

                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                            <svg class="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p class="text-muted-foreground">
                            The data retrieved from YNAB is stored in your browser's
                            <a
                                href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage"
                                target="_blank"
                                class="text-primary font-medium hover:underline"
                            >
                                local storage
                            </a>
                            , which is a functionality provided by most modern browsers. Your data will only exist in the browser you downloaded it
                            to.
                        </p>
                    </div>
                </div>

                <div class="flex items-start space-x-3">
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
                        <p class="text-muted-foreground">Also, anonymized data is sent to Laravel Nightwatch for issue tracking.</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Browser Compatibility -->
        <Card>
            <CardHeader>
                <CardTitle>Browser Compatibility</CardTitle>
                <CardDescription>Important information about data persistence</CardDescription>
            </CardHeader>
            <CardContent>
                <div class="bg-muted/50 rounded-lg p-4">
                    <p class="text-muted-foreground">
                        <strong class="text-foreground">Important:</strong> If you only get your data in Firefox and then switch to Google Chrome, you
                        will have to retrieve your data again in Chrome. Each browser maintains its own separate local storage.
                    </p>
                </div>
            </CardContent>
        </Card>

        <!-- Affiliation Statement -->
        <Card>
            <CardHeader>
                <CardTitle>Statement of Affiliation</CardTitle>
                <CardDescription>Our relationship with YNAB</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                            <svg class="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p class="text-muted-foreground">
                            We are <strong class="text-foreground">not affiliated, associated, or in any way officially connected</strong> with YNAB,
                            or any of its subsidiaries or its affiliates.
                        </p>
                    </div>
                </div>

                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                            <svg class="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fill-rule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p class="text-muted-foreground">
                            We are fans of YNAB and wanted to give you more insight into your future transactions, so we made this tool.
                        </p>
                    </div>
                </div>

                <div class="bg-muted/50 rounded-lg p-4">
                    <p class="text-muted-foreground">
                        The official YNAB website can be found at
                        <a href="https://ynab.com" target="_blank" class="text-primary font-medium hover:underline"> https://www.ynab.com </a>
                        . The names YNAB and You Need A Budget as well as related names, marks, emblems and images are registered trademarks of YNAB.
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
