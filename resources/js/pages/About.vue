<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Layout from '../layouts/AppLayout.vue';
import Card from '@/components/ui/Card.vue';
import CardHeader from '@/components/ui/CardHeader.vue';
import CardContent from '@/components/ui/CardContent.vue';
import CardTitle from '@/components/ui/CardTitle.vue';
import CardDescription from '@/components/ui/CardDescription.vue';

defineOptions({ layout: Layout });

const props = defineProps({
    name: {
        type: String,
        required: true,
    },
});
</script>

<template>

    <Head title="About" />

    <div class="space-y-8">
        <!-- Hero Section -->
        <div class="text-center space-y-4">
            <h1 class="text-4xl font-bold tracking-tight">About {{ props.name }}</h1>
            <p class="text-xl text-muted-foreground max-w-3xl mx-auto">
                A powerful tool to help you understand the future of your finances through YNAB integration.
            </p>
        </div>

        <!-- Main Content -->
        <div class="grid gap-8 md:grid-cols-2">
            <!-- About Me Card -->
            <Card>
                <CardHeader>
                    <CardTitle>About Me</CardTitle>
                    <CardDescription>Meet the developer behind {{ props.name }}</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <p class="text-muted-foreground">
                        Hi, I'm <a target="_blank" class="text-primary hover:underline font-medium"
                            href="https://github.com/danielh-official">Daniel Haven</a>.
                    </p>
                    <p class="text-muted-foreground">
                        As an avid YNAB user, I noticed some missing features and decided to use YNAB's API to build
                        them for myself.
                    </p>
                    <p class="text-muted-foreground">
                        {{ props.name }}'s primary purpose is to show you the future of your income and expenses based
                        on your scheduled and repeating transactions.
                    </p>
                </CardContent>
            </Card>

            <!-- Features Card -->
            <Card>
                <CardHeader>
                    <CardTitle>Features</CardTitle>
                    <CardDescription>What {{ props.name }} can do for you</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                    <ul class="space-y-2">
                        <li class="flex items-start space-x-2">
                            <svg class="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor"
                                viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clip-rule="evenodd" />
                            </svg>
                            <span class="text-muted-foreground">Future income and expense forecasting</span>
                        </li>
                        <li class="flex items-start space-x-2">
                            <svg class="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor"
                                viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clip-rule="evenodd" />
                            </svg>
                            <span class="text-muted-foreground">Historical transaction analysis</span>
                        </li>
                        <li class="flex items-start space-x-2">
                            <svg class="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor"
                                viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clip-rule="evenodd" />
                            </svg>
                            <span class="text-muted-foreground">Repeating transaction management</span>
                        </li>
                        <li class="flex items-start space-x-2">
                            <svg class="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor"
                                viewBox="0 0 20 20">
                                <path fill-rule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clip-rule="evenodd" />
                            </svg>
                            <span class="text-muted-foreground">CSV export functionality</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>

        <!-- Other Projects -->
        <Card>
            <CardHeader>
                <CardTitle>Other Projects</CardTitle>
                <CardDescription>More tools to help with your YNAB workflow</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
                <p class="text-muted-foreground">
                    I've also worked on
                    <a target="_blank" class="text-primary hover:underline font-medium"
                        href="https://repeatingexportforynab.com/">
                        Repeating Export (For YNAB)
                    </a>.
                    Having a clear understanding of my repeating income and expenses is important for me, as it gives me
                    better control over my fiscal destiny.
                </p>
                <p class="text-muted-foreground">
                    I hope that these tools give you a better level of control as well.
                </p>
            </CardContent>
        </Card>

        <!-- YNAB Integration Links -->
        <Card>
            <CardHeader>
                <CardTitle>YNAB Integration Resources</CardTitle>
                <CardDescription>Discover more apps that work with YNAB</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
                <p class="text-muted-foreground">For viewing all apps that integrate with YNAB, see:</p>
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <h4 class="font-medium">Official YNAB API Documentation</h4>
                        <a href="https://api.ynab.com/#works-with-ynab-official" target="_blank"
                            class="text-primary hover:underline font-medium inline-flex items-center space-x-1">
                            <span>View Documentation</span>
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                    <div class="space-y-2">
                        <h4 class="font-medium">Curated Integration List</h4>
                        <a href="https://danielhaven-personal.notion.site/Integrates-With-YNAB-21e225ca9695803793d3c6081509fd20?pvs=143"
                            target="_blank"
                            class="text-primary hover:underline font-medium inline-flex items-center space-x-1">
                            <span>Browse Integrations</span>
                            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                        <p class="text-xs text-muted-foreground">With filtering and sorting options</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
