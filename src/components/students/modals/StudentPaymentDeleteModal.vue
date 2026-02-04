<script setup>
import {prettyMoney} from "@/utils/utils";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  payment: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "submit"]);

const handleSubmit = () => {
  emit("submit");
};

const close = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="400"
  >
    <VCard title="To'lovni o'chirish">
      <VCardText>
        <VAlert
          color="error"
          variant="tonal"
          icon="tabler-alert-triangle"
          class="mb-4"
        >
          Diqqat! To'lov o'chirilganda o'quvchi balansidan ushbu summa ayirib tashlanadi (qarz paydo bo'lishi mumkin).
        </VAlert>
        <p>Haqiqatan ham ushbu to'lovni o'chirmoqchimisiz?</p>
        <div class="d-flex align-center justify-space-between mt-2 pa-3 bg-grey-100 rounded">
          <span class="text-body-2">Summa:</span>
          <span class="font-weight-bold">{{ prettyMoney(payment?.amount) }} UZS</span>
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="close">Bekor qilish</VBtn>
        <VBtn
          color="error"
          variant="elevated"
          :loading="loading"
          @click="handleSubmit"
        >
          O'chirish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
