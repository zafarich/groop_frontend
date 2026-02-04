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
  group: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const form = ref({
  customMonthlyPrice: 0,
  customMonthlyPriceDisplay: "",
  discountStartDate: "",
  discountEndDate: "",
  discountReason: "",
});

// Watch for enrollment changes to initialize form
watch(
  () => props.enrollment,
  (newEnrollment) => {
    if (newEnrollment) {
      const currentPrice = newEnrollment.customMonthlyPrice
        ? Number(newEnrollment.customMonthlyPrice)
        : Number(props.group?.monthlyPrice || 0);

      form.value = {
        customMonthlyPrice: currentPrice,
        customMonthlyPriceDisplay: prettyMoney(currentPrice),
        discountStartDate: newEnrollment.discountStartDate
          ? newEnrollment.discountStartDate.split("T")[0]
          : "",
        discountEndDate: newEnrollment.discountEndDate
          ? newEnrollment.discountEndDate.split("T")[0]
          : "",
        discountReason: newEnrollment.discountReason || "",
      };
    }
  },
  {immediate: true}
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

const discountAmount = computed(() => {
  if (!props.group) return 0;
  return (
    Number(props.group.monthlyPrice) - form.value.customMonthlyPrice
  );
});

const discountPercentage = computed(() => {
  if (!props.group) return 0;
  if (form.value.customMonthlyPrice === 0) return 100;
  const discount = discountAmount.value;
  return Math.round((discount / Number(props.group.monthlyPrice)) * 100);
});

const isFreeEnrollment = computed(() => {
  return form.value.customMonthlyPrice === 0;
});

const handleSave = () => {
  emit("save", {
    customMonthlyPrice: form.value.customMonthlyPrice,
    discountStartDate: form.value.discountStartDate || null,
    discountEndDate: form.value.discountEndDate || null,
    discountReason: form.value.discountReason || null,
  });
};

const close = () => {
  emit("update:modelValue", false);
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="700"
  >
    <VCard v-if="enrollment">
      <VCardTitle class="text-h5 pt-4 px-6"> Maxsus narx belgilash </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Student Info -->
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-1">
            <strong>O'quvchi:</strong>
            {{ enrollment.student?.firstName }}
            {{ enrollment.student?.lastName }}
          </div>
          <div class="text-body-2 mt-1">
            <strong>Guruh narxi:</strong>
            {{ prettyMoney(group?.monthlyPrice) }} so'm/oy
          </div>
        </VAlert>

        <VRow>
          <!-- Custom Monthly Price -->
          <VCol cols="12">
            <AppTextField
              v-model="form.customMonthlyPriceDisplay"
              label="Maxsus oylik narx *"
              placeholder="500 000"
              @input="formatPrice($event.target.value)"
            >
              <template #append-inner>
                <span class="text-body-2 text-medium-emphasis">so'm</span>
              </template>
            </AppTextField>

            <!-- Discount Info -->
            <VAlert
              v-if="discountAmount !== 0"
              :type="discountAmount > 0 ? 'success' : 'warning'"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              <div v-if="discountAmount > 0" class="text-body-2">
                ✅ Chegirma: {{ prettyMoney(discountAmount) }} so'm ({{
                  discountPercentage
                }}%)
              </div>
              <div v-else class="text-body-2">
                ⚠️ Qo'shimcha: {{ prettyMoney(Math.abs(discountAmount)) }} so'm
              </div>
            </VAlert>

            <!-- Free Badge -->
            <VAlert
              v-if="isFreeEnrollment"
              type="success"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              <div class="text-body-2 font-weight-medium">
                🎁 Bepul o'qitish
              </div>
            </VAlert>
          </VCol>

          <!-- Date Range -->
          <VCol cols="12" md="6">
            <AppDateTimePicker
              v-model="form.discountStartDate"
              placeholder="Boshlanish sanasini tanlang"
              :config="{dateFormat: 'd.m.Y'}"
              label="Boshlanish sanasi"
            >
              <template #append-inner>
                <VIcon icon="tabler-calendar" />
              </template>
            </AppDateTimePicker>
            <div class="text-caption text-medium-emphasis mt-1">
              Bo'sh qoldiring = hozirdan boshlanadi
            </div>
          </VCol>

          <VCol cols="12" md="6">
            <AppDateTimePicker
              v-model="form.discountEndDate"
              placeholder="Tugash sanasini tanlang"
              :config="{dateFormat: 'd.m.Y'}"
              label="Tugash sanasi"
            >
              <template #append-inner>
                <VIcon icon="tabler-calendar" />
              </template>
            </AppDateTimePicker>
            <div class="text-caption text-medium-emphasis mt-1">
              Bo'sh qoldiring = cheksiz
            </div>
          </VCol>

          <!-- Reason -->
          <VCol cols="12">
            <AppTextarea
              v-model="form.discountReason"
              label="Sabab"
              placeholder="Masalan: Ota-onasi o'qituvchi, Nafaqadagi oila a'zosi"
              rows="3"
            />
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
