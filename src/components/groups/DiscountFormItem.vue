<script setup>
import {prettyMoney} from "@/utils/utils";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  monthlyPrice: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["update:modelValue", "remove", "format-amount"]);

const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const remove = () => {
  emit("remove", props.index);
};

const onInput = (event) => {
  emit("format-amount", props.index, event.target.value);
};

const getDiscountExample = computed(() => {
  if (!props.monthlyPrice || !props.modelValue.months || !props.modelValue.discountAmount) return null;
  
  const totalOriginal = props.monthlyPrice * props.modelValue.months;
  const totalWithDiscount = totalOriginal - props.modelValue.discountAmount;
  
  return {
    monthlyPrice: prettyMoney(props.monthlyPrice),
    months: props.modelValue.months,
    totalOriginal: prettyMoney(totalOriginal),
    discountAmount: prettyMoney(props.modelValue.discountAmount),
    totalWithDiscount: prettyMoney(totalWithDiscount)
  };
});
</script>

<template>
  <VCard variant="outlined" class="pa-4">
    <VRow>
      <VCol cols="12" md="5">
        <AppTextField
          v-model.number="localValue.months"
          type="number"
          label="Oylar soni *"
          placeholder="3"
        />
      </VCol>
      <VCol cols="12" md="5">
        <AppTextField
          v-model="localValue.discountAmountDisplay"
          label="Chegirma miqdori (so'm) *"
          placeholder="100 000"
          @input="onInput"
        />
      </VCol>
      <VCol cols="12" md="2">
        <VBtn
          size="small"
          color="error"
          variant="text"
          class="mt-6"
          icon="tabler-trash"
          @click="remove"
        />
      </VCol>
      <VCol cols="12" v-if="getDiscountExample">
        <VAlert
          type="success"
          variant="tonal"
          density="compact"
          class="mt-2 text-body-2"
        >
          <strong>{{ modelValue.months }} oy uchun:</strong> 
          {{ getDiscountExample.monthlyPrice }} x {{ modelValue.months }} = 
          {{ getDiscountExample.totalOriginal }} - {{ getDiscountExample.discountAmount }} (chegirma) = 
          <strong>{{ getDiscountExample.totalWithDiscount }} so'm</strong>
        </VAlert>
      </VCol>
    </VRow>
  </VCard>
</template>
