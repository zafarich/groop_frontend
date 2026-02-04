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

const emit = defineEmits(["update:modelValue", "save"]);

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

const newBalance = computed(() => {
  if (!props.enrollment) return 0;
  return Number(props.enrollment.balance) + form.value.amount;
});

const handleSave = () => {
  emit("save", {
    amount: form.value.amount,
    notes: form.value.notes,
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
    max-width="600"
  >
    <VCard v-if="enrollment">
      <VCardTitle class="text-h5 pt-4 px-6">
        <VIcon icon="tabler-cash" class="me-2" color="success" />
        To'lov qo'shish
      </VCardTitle>

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
            <strong class="mr-2">Hozirgi balans:</strong>
            <span
              :class="{
                'text-success': enrollment.balance > 0,
                'text-error': enrollment.balance < 0,
              }"
            >
              {{ prettyMoney(enrollment.balance) }} so'm
            </span>
          </div>
        </VAlert>

        <VRow>
          <!-- Amount Input -->
          <VCol cols="12">
            <AppTextField
              v-model="form.amountDisplay"
              label="To'lov summasi *"
              placeholder="50 000"
              @input="formatAmount($event.target.value)"
            >
              <template #append-inner>
                <span class="text-body-2 text-medium-emphasis">so'm</span>
              </template>
            </AppTextField>
          </VCol>

          <!-- Notes Input -->
          <VCol cols="12">
            <AppTextarea
              v-model="form.notes"
              label="Izoh"
              placeholder="Masalan: Telegram orqali qabul qilingan to'lov"
              rows="3"
            />
          </VCol>
        </VRow>

        <!-- Preview new balance -->
        <VAlert
          v-if="form.amount > 0"
          type="success"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          <div class="text-body-2">
            Yangi balans:
            {{ prettyMoney(newBalance) }}
            so'm
          </div>
        </VAlert>
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
          @click="handleSave"
          :loading="loading"
          :disabled="loading || form.amount <= 0"
        >
          <VIcon icon="tabler-check" class="me-1" />
          Qo'shish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
