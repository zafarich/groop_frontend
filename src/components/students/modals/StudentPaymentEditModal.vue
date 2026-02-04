<script setup>
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";
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

const form = ref({
  amount: 0,
  amountDisplay: "",
});

// Initialize form when payment changes
watch(
  () => props.payment,
  (newPayment) => {
    if (newPayment) {
      const amount = parseFloat(newPayment.amount);
      form.value = {
        amount: amount,
        amountDisplay: prettyMoney(amount),
      };
    }
  },
  {immediate: true}
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
  emit("submit", {amount: form.value.amount});
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
    <VCard title="To'lovni tahrirlash">
      <VCardText>
        <VAlert
          color="warning"
          variant="tonal"
          icon="tabler-alert-circle"
          class="mb-4"
          density="compact"
        >
          Summani o'zgartirish o'quvchi balansiga ta'sir qiladi.
        </VAlert>
        <AppTextField
          v-model="form.amountDisplay"
          label="Summa"
          @input="formatAmount($event.target.value)"
        />
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
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
