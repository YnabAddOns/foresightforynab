<script setup lang="ts">
interface Props {
    class?: string;
}

const props = defineProps<Props>();
</script>

<template>
    <p :class="['text-sm text-muted-foreground', props.class]">
        <slot />
    </p>
</template>