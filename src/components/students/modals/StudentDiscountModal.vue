<script setup>
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";
import AppTextarea from "@/@core/components/app-form-elements/AppTextarea.vue";
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";
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
  customMonthlyPrice: 0,
  customMonthlyPriceDisplay: "",
  discountStartDate: "",
  discountEndDate: "",
  discountReason: "",
});

// Initialize form when modal opens
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.enrollment) {
      form.value = {
        customMonthlyPrice: props.enrollment.customMonthlyPrice || 0,
        customMonthlyPriceDisplay: props.enrollment.customMonthlyPrice
          ? prettyMoney(props.enrollment.customMonthlyPrice)
          : "",
        discountStartDate: "",
        discountEndDate: "",
        discountReason: props.enrollment.discountReason || "",
      };
    }
  }
);

const formatPrice = (value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    form.value.customMonthlyPrice = 0;
    form.value.customMonthlyPriceDisplay = "";
  } else {
    form.value.customMonthlyPrice = number;
    form.value.customMonthlyPriceDisplay = prettyMoney(number);
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
    max-width="600"
  >
    <VCard v-if="enrollment">
      <VCardTitle class="text-h5 pt-4 px-6">
        Chegirma belgilash
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
          v-model="form.customMonthlyPriceDisplay"
          label="Maxsus oylik narx"
          placeholder="0"
          @input="formatPrice($event.target.value)"
        >
          <template #append-inner>so'm</template>
        </AppTextField>

        <VRow class="mt-2">
          <VCol cols="12" md="6">
            <AppDateTimePicker
              v-model="form.discountStartDate"
              label="Chegirma boshlanish sanasi"
              placeholder="Sanani tanlang"
              :config="{dateFormat: 'd.m.Y'}"
            />
          </VCol>
          <VCol cols="12" md="6">
            <AppDateTimePicker
              v-model="form.discountEndDate"
              label="Chegirma tugash sanasi"
              placeholder="Sanani tanlang"
              :config="{dateFormat: 'd.m.Y'}"
            />
          </VCol>
        </VRow>

        <AppTextarea
          v-model="form.discountReason"
          label="Chegirma sababi"
          placeholder="Chegirma sababini kiriting..."
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
          color="primary"
          variant="elevated"
          @click="handleSubmit"
          :loading="loading"
          :disabled="loading"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
