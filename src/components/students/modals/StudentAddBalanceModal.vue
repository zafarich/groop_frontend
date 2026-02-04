<script setup>
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";
import AppTextarea from "@/@core/components/app-form-elements/AppTextarea.vue";
import {prettyMoney} from "@/utils/utils";

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
  amount: 0,
  amountDisplay: "",
  notes: "",
});

// Reset form when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      form.value = {
        amount: 0,
        amountDisplay: "",
        notes: "",
      };
    }
  }
);

const formatAmount = (value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    form.value.amount = 0;
    form.value.amountDisplay = "";
  } else {
    form.value.amount = number;
    form.value.amountDisplay = prettyMoney(number);
  }
};

const handleSubmit = () => {
  emit("submit", {...form.value});
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
        Balans to'ldirish
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

        <AppTextField
          v-model="form.amountDisplay"
          label="Summa"
          placeholder="0"
          @input="formatAmount($event.target.value)"
        >
          <template #append-inner>so'm</template>
        </AppTextField>

        <AppTextarea
          v-model="form.notes"
          label="Izoh"
          placeholder="To'lov haqida qo'shimcha ma'lumot..."
          rows="3"
          class="mt-4"
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
          color="success"
          variant="elevated"
          @click="handleSubmit"
          :loading="loading"
          :disabled="loading || form.amount <= 0"
        >
          To'ldirish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
