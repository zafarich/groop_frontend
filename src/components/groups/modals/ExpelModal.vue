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
  isChannel: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "expel"]);

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

// Get student status config
const getStudentStatusConfig = (status) => {
  switch (status) {
    case "LEAD":
      return {color: "info", text: "Lead"};
    case "TRIAL":
      return {color: "warning", text: "Sinov darsidagi"};
    case "PENDING_JOIN":
      return {color: "info", text: "Guruhga ulanish kutilmoqda"};
    case "ACTIVE":
      return {color: "success", text: "Faol"};
    case "FROZEN":
      return {color: "warning", text: "Muzlatilgan"};
    case "EXPELLED":
      return {color: "error", text: "Chiqarilgan"};
    case "COMPLETED":
      return {color: "primary", text: "Tugatgan"};
    case "DROPPED":
      return {color: "secondary", text: "Tashlab ketgan"};
    case "LEFT_GROUP":
      return {color: "error", text: "Guruhdan chiqqan"};
    default:
      return {color: "default", text: status};
  }
};

const handleExpel = () => {
  emit("expel", form.value.reason);
};

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
    <VCard v-if="enrollment">
      <VCardTitle class="text-h5 pt-4 px-6">
        <VIcon icon="tabler-user-x" class="me-2" color="error" />
        {{ isChannel ? 'Kanaldan chetlatish' : 'Guruhdan chetlatish' }}
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Student Info -->
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-1">
            <strong>{{ isChannel ? 'Obunachi:' : "O'quvchi:" }}</strong>
            {{ enrollment.student?.firstName }}
            {{ enrollment.student?.lastName }}
          </div>
          <div class="text-body-2 mt-1">
            <strong>Status:</strong>
            <VChip
              :color="getStudentStatusConfig(enrollment.status).color"
              size="small"
              variant="tonal"
              class="ms-2"
            >
              {{ getStudentStatusConfig(enrollment.status).text }}
            </VChip>
          </div>
        </VAlert>

        <!-- Warning -->
        <VAlert type="warning" variant="tonal" class="mb-4">
          <div class="text-body-2">
            <VIcon icon="tabler-alert-triangle" size="18" class="me-1" />
            Diqqat! Bu amal qaytarib bo'lmaydi. {{ isChannel ? 'Obunachi kanaldan butunlay chiqariladi va Telegram kanalidan ban qilinadi.' : "O'quvchi guruhdan butunlay chiqariladi va Telegram guruhidan ban qilinadi." }}
          </div>
        </VAlert>

        <!-- Reason Input -->
        <AppTextarea
          v-model="form.reason"
          label="Sabab (ixtiyoriy)"
          placeholder="Masalan: 3 oy to'lov qilmadingiz"
          rows="3"
          hint="Sabab o'quvchiga Telegram orqali yuboriladi"
          persistent-hint
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
          @click="handleExpel"
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
