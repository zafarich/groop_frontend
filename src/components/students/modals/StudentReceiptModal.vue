<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  url: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const close = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
  >
    <VCard>
      <VCardText class="pa-0 position-relative">
        <VBtn
          icon
          variant="flat"
          color="secondary"
          size="small"
          class="position-absolute top-0 right-0 ma-2"
          style="z-index: 10"
          @click="close"
        >
          <VIcon icon="tabler-x" />
        </VBtn>
        <VImg :src="url" cover max-height="80vh" />
      </VCardText>
      <VCardActions class="justify-center">
        <VBtn
          color="primary"
          variant="text"
          :href="url"
          target="_blank"
          prepend-icon="tabler-download"
        >
          Rasmni yuklab olish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
