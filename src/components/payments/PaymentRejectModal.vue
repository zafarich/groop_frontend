<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "confirm"]);

const rejectReason = ref("");

// Reset reason when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      rejectReason.value = "";
    }
  }
);

const handleConfirm = () => {
  emit("confirm", rejectReason.value.trim());
};

const close = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>To'lovni bekor qilish</span>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          :disabled="loading"
          @click="close"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <VAlert type="warning" variant="tonal" class="mb-4">
          <template #prepend>
            <VIcon icon="tabler-alert-triangle" />
          </template>
          To'lovni bekor qilish sababini kiriting. Bu sabab o'quvchiga
          ko'rsatiladi.
        </VAlert>

        <AppTextField
          v-model="rejectReason"
          label="Bekor qilish sababi"
          placeholder="Masalan: Chek summasi noto'g'ri"
          :rules="[(v) => !!v?.trim() || 'Sababni kiriting']"
          autofocus
        />
      </VCardText>

      <VDivider class="mb-4" />

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          :disabled="loading"
          @click="close"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="error"
          :loading="loading"
          :disabled="!rejectReason.trim()"
          @click="handleConfirm"
        >
          <VIcon icon="tabler-x" class="me-1" />
          Tasdiqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
