<script setup>
import {prettyMoney} from "@/utils/utils";

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  rules: {
    type: Object,
    required: true,
  },
  paymentTypes: {
    type: Array,
    default: () => [],
  },
  trialPaymentTypes: {
    type: Array,
    default: () => [],
  },
  paymentTypeDescription: {
    type: String,
    default: "",
  },
  courseDurationMonths: {
    type: Number,
    default: 0,
  },
  totalMonthlyPayment: {
    type: Number,
    default: 0,
  },
  wholePeriodSavings: {
    type: Number,
    default: 0,
  },
  wholePeriodSavingsPercent: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits([
  "format-money",
  "format-trial",
  "format-whole-period",
]);

const isLessonBased = computed(() => props.form.paymentType === 'LESSON_BASED');
const isTrialPaid = computed(() => props.form.trialPaymentType === 'PAID');
const showPricingSummary = computed(() => props.courseDurationMonths > 0 && props.form.monthlyPrice);
const showWholePeriod = computed(() => props.form.wholePeriodPrice);
const showSavings = computed(() => props.wholePeriodSavings > 0);
</script>

<template>
  <VRow>
    <VCol cols="12">
      <h3 class="text-h5 mt-4">To'lov sozlamalari</h3>
    </VCol>

    <VCol cols="12" md="6">
      <AppSelect
        v-model="form.paymentType"
        :items="paymentTypes"
        label="To'lov turi *"
        :rules="[rules.required]"
      />
    </VCol>

    <VCol v-if="isLessonBased" cols="12" md="6">
      <AppTextField
        v-model.number="form.lessonsPerPaymentPeriod"
        type="number"
        label="To'lov davridagi darslar soni *"
        placeholder="12"
        :rules="[rules.requiredNumber, rules.positiveNumber]"
      />
    </VCol>

    <VCol cols="12" md="6">
      <AppSelect
        v-model="form.trialPaymentType"
        :items="trialPaymentTypes"
        label="Sinov darsi turi *"
        :rules="[rules.required]"
      />
    </VCol>

    <VCol v-if="isTrialPaid" cols="12" md="6">
      <AppTextField
        v-model="form.trialPriceDisplay"
        label="Sinov darsi narxi *"
        placeholder="50 000"
        :rules="[rules.required]"
        @input="$emit('format-trial', $event.target.value)"
      />
    </VCol>

    <VCol cols="12" md="6">
      <AppTextField
        v-model="form.monthlyPriceDisplay"
        :label="form.paymentType === 'ONE_TIME' ? 'Butun davr uchun narx' : 'Oylik to\'lov (so\'m) *'"
        placeholder="500 000"
        :rules="[rules.required]"
        @input="$emit('format-money', $event.target.value)"
      />
    </VCol>

    <VCol cols="12" v-if="paymentTypeDescription">
      <VAlert type="info" variant="tonal" density="compact" class="mb-0">
        {{ paymentTypeDescription }}
      </VAlert>
    </VCol>

    <!-- Pricing Summary -->
    <VCol cols="12" v-if="showPricingSummary">
      <VCard variant="tonal" color="info" class="pa-4">
        <div class="text-subtitle-1 font-weight-bold mb-3">
          Narxlar taqqoslash ({{ courseDurationMonths }} oy uchun)
        </div>
        <VRow>
          <VCol cols="12" md="4">
            <div class="text-caption text-medium-emphasis">Oyma-oy to'lash</div>
            <div class="text-body-1 font-weight-medium">
              {{ prettyMoney(totalMonthlyPayment) }} so'm
            </div>
            <div class="text-caption">
              ({{ prettyMoney(form.monthlyPrice) }} × {{ Math.ceil(courseDurationMonths) }} oy)
            </div>
          </VCol>
          <VCol cols="12" md="4" v-if="showWholePeriod">
            <div class="text-caption text-medium-emphasis">Butun davr uchun</div>
            <div class="text-body-1 font-weight-medium text-success">
              {{ prettyMoney(form.wholePeriodPrice) }} so'm
            </div>
            <div class="text-caption text-success" v-if="showSavings">
              {{ wholePeriodSavingsPercent }}% tejash
            </div>
          </VCol>
          <VCol cols="12" md="4" v-if="showSavings">
            <div class="text-caption text-medium-emphasis">Tejash</div>
            <div class="text-body-1 font-weight-medium text-success">
              {{ prettyMoney(wholePeriodSavings) }} so'm
            </div>
          </VCol>
        </VRow>
      </VCard>
    </VCol>

    <!-- Whole Period Price -->
    <VCol cols="12" md="6">
      <AppTextField
        v-model="form.wholePeriodPriceDisplay"
        label="Butun davr uchun narx (ixtiyoriy)"
        placeholder="1 500 000"
        @input="$emit('format-whole-period', $event.target.value)"
      >
        <template #append-inner>
          <span class="text-body-2 text-medium-emphasis">so'm</span>
        </template>
      </AppTextField>
    </VCol>
  </VRow>
</template>
