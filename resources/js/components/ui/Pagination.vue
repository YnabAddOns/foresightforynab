<script setup lang="ts">
import { computed } from 'vue';
import Button from './Button.vue';

interface Props {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
}

const props = defineProps<Props>();

const pageNumbers = computed(() => {
    const pages = [];
    const maxVisiblePages = 5;

    if (props.totalPages <= maxVisiblePages) {
        for (let i = 1; i <= props.totalPages; i++) {
            pages.push(i);
        }
    } else {
        if (props.currentPage <= 3) {
            for (let i = 1; i <= 4; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(props.totalPages);
        } else if (props.currentPage >= props.totalPages - 2) {
            pages.push(1);
            pages.push('...');
            for (let i = props.totalPages - 3; i <= props.totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            pages.push('...');
            for (let i = props.currentPage - 1; i <= props.currentPage + 1; i++) {
                pages.push(i);
            }
            pages.push('...');
            pages.push(props.totalPages);
        }
    }

    return pages;
});

const startItem = computed(() => (props.currentPage - 1) * props.itemsPerPage + 1);
const endItem = computed(() => Math.min(props.currentPage * props.itemsPerPage, props.totalItems));

const itemsPerPageOptions = [5, 10, 20, 50, 100];
</script>

<template>
    <div class="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <!-- Items per page selector -->
        <div class="flex items-center space-x-2">
            <span class="text-sm text-muted-foreground">Show</span>
            <select :value="itemsPerPage" @change="onItemsPerPageChange(Number($event.target.value))"
                class="h-8 w-16 rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
                    {{ option }}
                </option>
            </select>
            <span class="text-sm text-muted-foreground">entries</span>
        </div>

        <!-- Page info -->
        <div class="text-sm text-muted-foreground">
            Showing {{ startItem }} to {{ endItem }} of {{ totalItems }} entries
        </div>

        <!-- Pagination controls -->
        <div class="flex items-center space-x-2">
            <Button variant="outline" size="sm" :disabled="currentPage === 1" @click="onPageChange(currentPage - 1)">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
            </Button>

            <div class="flex items-center space-x-1">
                <Button v-for="page in pageNumbers" :key="page" :variant="page === currentPage ? 'default' : 'outline'"
                    size="sm" :disabled="page === '...'" @click="page !== '...' && onPageChange(Number(page))"
                    class="min-w-[2rem]">
                    {{ page }}
                </Button>
            </div>

            <Button variant="outline" size="sm" :disabled="currentPage === totalPages"
                @click="onPageChange(currentPage + 1)">
                Next
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            </Button>
        </div>
    </div>
</template>