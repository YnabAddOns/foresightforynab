<script setup lang="ts">
interface Props {
    class?: string;
}

const props = defineProps<Props>();
</script>

<template>
    <h3 :class="['text-2xl font-semibold leading-none tracking-tight', props.class]">
        <slot />
    </h3>
</template>