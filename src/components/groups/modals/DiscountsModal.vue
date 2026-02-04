<script setup>
import {prettyMoney} from "@/utils/utils";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  discounts: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  monthlyPrice: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const form = ref([]);

// Initialize form when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      form.value = props.discounts.map((d) => ({
        months: d.months,
        discountAmount: Number(d.discountAmount),
        discountAmountDisplay: prettyMoney(Number(d.discountAmount)),
      }));
    }
  },
  {immediate: true}
);

const addDiscount = () => {
  form.value.push({
    months: null,
    discountAmount: null,
    discountAmountDisplay: "",
  });
};

const removeDiscount = (index) => {
  form.value.splice(index, 1);
};

const formatDiscountAmount = (index, value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    form.value[index].discountAmount = null;
    form.value[index].discountAmountDisplay = "";
  } else {
    form.value[index].discountAmount = number;
    form.value[index].discountAmountDisplay = prettyMoney(number);
  }
};

const getDiscountExample = (discount) => {
  if (!props.monthlyPrice || !discount.months || !discount.discountAmount) return null;
  
  const totalOriginal = props.monthlyPrice * discount.months;
  const totalWithDiscount = totalOriginal - discount.discountAmount;
  
  return {
    monthlyPrice: prettyMoney(props.monthlyPrice),
    months: discount.months,
    totalOriginal: prettyMoney(totalOriginal),
    discountAmount: prettyMoney(discount.discountAmount),
    totalWithDiscount: prettyMoney(totalWithDiscount)
  };
};

const handleSave = () => {
  const payload = form.value.map((d) => ({
    months: d.months,
    discountAmount: d.discountAmount,
  }));
  emit("save", payload);
};

const close = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
  >
    <VCard>
      <VCardTitle class="text-h5 pt-4 px-6">
        Chegirmalarni tahrirlash
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VAlert
          v-if="form.length > 0"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          1 oydan ko'p muddatga to'laganda chegirma bo'ladigan holatdagi
          chegirma turi. Nechta oy uchun to'lasa umumiy qancha chegirma
          bo'lishini kiriting
        </VAlert>

        <VRow>
          <VCol
            v-for="(discount, index) in form"
            :key="index"
            cols="12"
          >
            <VCard variant="outlined" class="pa-4">
              <VRow>
                <VCol cols="12" md="5">
                  <AppTextField
                    v-model.number="discount.months"
                    type="number"
                    label="Oylar soni *"
                    placeholder="3"
                  />
                </VCol>
                <VCol cols="12" md="5">
                  <AppTextField
                    v-model="discount.discountAmountDisplay"
                    label="Chegirma miqdori (so'm) *"
                    placeholder="100 000"
                    @input="formatDiscountAmount(index, $event.target.value)"
                  />
                </VCol>
                <VCol cols="12" md="2" class="d-flex align-center">
                  <VBtn
                    size="small"
                    color="error"
                    variant="text"
                    icon="tabler-trash"
                    @click="removeDiscount(index)"
                  />
                </VCol>
              </VRow>
              <VAlert
                v-if="getDiscountExample(discount)"
                type="success"
                variant="tonal"
                density="compact"
                class="mt-2 text-body-2"
              >
                <strong>{{ discount.months }} oy uchun:</strong> 
                {{ getDiscountExample(discount).monthlyPrice }} x {{ discount.months }} = 
                {{ getDiscountExample(discount).totalOriginal }} - {{ getDiscountExample(discount).discountAmount }} (chegirma) = 
                <strong>{{ getDiscountExample(discount).totalWithDiscount }} so'm</strong>
              </VAlert>
            </VCard>
          </VCol>

          <VCol cols="12">
            <VBtn
              color="primary"
              variant="outlined"
              prepend-icon="tabler-plus"
              @click="addDiscount"
            >
              Chegirma qo'shish
            </VBtn>
          </VCol>
        </VRow>
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
          color="primary"
          variant="elevated"
          @click="handleSave"
          :loading="loading"
          :disabled="loading"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
