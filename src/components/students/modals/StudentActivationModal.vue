<script setup>
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";

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
  preview: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "submit", "update:preview"]);

const form = ref({
  lessonStartDate: new Date().toISOString().split("T")[0],
});

// Reset form when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      form.value.lessonStartDate = new Date().toISOString().split("T")[0];
    }
  }
);

const handleDateChange = () => {
  emit("update:preview", form.value.lessonStartDate);
};

const handleSubmit = () => {
  emit("submit", form.value.lessonStartDate);
};

const close = () => {
  emit("update:modelValue", false);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU");
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
  >
    <VCard title="O'quvchini faollashtirish">
      <VCardText>
        <AppDateTimePicker
          v-model="form.lessonStartDate"
          label="Dars boshlash sanasi"
          :config="{dateFormat: 'Y-m-d'}"
          @update:model-value="handleDateChange"
          class="mb-4"
        />
        <div v-if="preview" class="bg-grey-100 pa-3 rounded">
          <div class="d-flex justify-space-between mb-1">
            <span>Darslar soni:</span>
            <span class="font-weight-bold">{{ preview.lessonsIncluded }} ta</span>
          </div>
          <div class="d-flex justify-space-between mb-1">
            <span>Hisoblangan summa:</span>
            <span class="font-weight-bold">{{ preview.proratedAmount }} UZS</span>
          </div>
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="close">Bekor qilish</VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          :loading="loading"
          @click="handleSubmit"
        >
          Faollashtirish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
