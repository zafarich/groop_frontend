<script setup>
import AppTextarea from "@/@core/components/app-form-elements/AppTextarea.vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  enrollment: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const form = ref({
  reason: "",
});

// Reset form when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      form.value.reason = "";
    }
  }
);

const handleSubmit = () => {
  emit("submit", form.value.reason);
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
  >
    <VCard v-if="enrollment">
      <VCardTitle class="text-h5 pt-4 px-6">
        <VIcon icon="tabler-user-x" class="me-2" color="error" />
        Guruhdan chetlatish
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-1">
            <strong>O'quvchi:</strong> {{ enrollment.student?.firstName }} {{ enrollment.student?.lastName }}
          </div>
          <div class="text-body-2 mt-1">
            <strong>Guruh:</strong> {{ enrollment.group?.name }}
          </div>
        </VAlert>

        <VAlert type="warning" variant="tonal" class="mb-4">
          <div class="text-body-2">
            <VIcon icon="tabler-alert-triangle" size="18" class="me-1" />
            Diqqat! Bu amal qaytarib bo'lmaydi. O'quvchi guruhdan butunlay chiqariladi.
          </div>
        </VAlert>

        <AppTextarea
          v-model="form.reason"
          label="Sabab (ixtiyoriy)"
          placeholder="Chetlatish sababini kiriting..."
          rows="3"
        />
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="close"
          :disabled="loading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="error"
          variant="elevated"
          @click="handleSubmit"
          :loading="loading"
          :disabled="loading"
        >
          <VIcon icon="tabler-user-x" class="me-1" />
          Chetlatish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
