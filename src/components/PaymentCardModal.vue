<script setup>
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  cardData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "cardSaved"]);

const {success: showSuccess} = useToast();

const form = ref({
  cardNumber: "",
  cardHolder: "",
  bankName: "",
  cardType: "uzcard",
  description: "",
  isActive: true,
  isVisible: true,
  isPrimary: false,
});

const cardTypes = [
  {value: "uzcard", title: "Uzcard"},
  {value: "humo", title: "Humo"},
  {value: "visa", title: "Visa"},
  {value: "mastercard", title: "Mastercard"},
  {value: "other", title: "Boshqa"},
];

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.isEditMode && props.cardData) {
      form.value = {
        cardNumber: props.cardData.cardNumber || "",
        cardHolder: props.cardData.cardHolder || "",
        bankName: props.cardData.bankName || "",
        cardType: props.cardData.cardType || "uzcard",
        description: props.cardData.description || "",
        isActive: props.cardData.isActive ?? true,
        isVisible: props.cardData.isVisible ?? true,
        isPrimary: props.cardData.isPrimary ?? false,
      };
    } else if (val && !props.isEditMode) {
      form.value = {
        cardNumber: "",
        cardHolder: "",
        bankName: "",
        cardType: "uzcard",
        description: "",
        isActive: true,
        isVisible: true,
        isPrimary: false,
      };
    }
  }
);

const loading = ref(false);
const errorMessage = ref("");

// Form validation rules
const rules = {
  required: (value) => !!value || "To'ldirish shart",
  cardNumber: (value) => {
    if (!value) return "Karta raqami kiritish shart";
    const cleaned = value.replace(/\s/g, "");
    if (cleaned.length !== 16)
      return "Karta raqami 16 ta raqamdan iborat bo'lishi kerak";
    return true;
  },
};

// Format card number as user types
const formatCardNumber = (value) => {
  const cleaned = value.replace(/\s/g, "");
  const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
  return formatted;
};

watch(
  () => form.value.cardNumber,
  (newVal) => {
    if (newVal) {
      form.value.cardNumber = formatCardNumber(newVal);
    }
  }
);

// Submit function
const onSubmit = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const body = {
      cardNumber: form.value.cardNumber.replace(/\s/g, ""),
      cardHolder: form.value.cardHolder.trim(),
      bankName: form.value.bankName.trim() || undefined,
      cardType: form.value.cardType,
      description: form.value.description.trim() || undefined,
      isActive: form.value.isActive,
      isVisible: form.value.isVisible,
      isPrimary: form.value.isPrimary,
    };

    let response;
    if (props.isEditMode) {
      response = await $api(`/v1/payment-cards/${props.cardData.id}`, {
        method: "PATCH",
        body,
      });
    } else {
      response = await $api("/v1/payment-cards", {
        method: "POST",
        body,
      });
    }

    if (response.success) {
      showSuccess(
        props.isEditMode
          ? "Karta muvaffaqiyatli yangilandi!"
          : "Karta muvaffaqiyatli qo'shildi!"
      );
      emit("cardSaved");
      emit("update:modelValue", false);
    } else {
      errorMessage.value = response.message || "Xatolik yuz berdi";
    }
  } catch (error) {
    errorMessage.value =
      error.data?.message ||
      error.message ||
      "Karta saqlashda xatolik yuz berdi";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="600"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex align-center">
        <VIcon icon="tabler-credit-card" class="me-2" color="primary" />
        <span>{{
          isEditMode ? "Kartani tahrirlash" : "Yangi karta qo'shish"
        }}</span>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Error alert -->
        <VAlert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </VAlert>

        <VForm @submit.prevent="onSubmit">
          <VRow>
            <!-- Card Number -->
            <VCol cols="12">
              <AppTextField
                v-model="form.cardNumber"
                label="Karta raqami *"
                placeholder="8600 1234 5678 9012"
                :rules="[rules.required, rules.cardNumber]"
                maxlength="19"
              />
            </VCol>

            <!-- Card Holder -->
            <VCol cols="12">
              <AppTextField
                v-model="form.cardHolder"
                label="Karta egasi *"
                placeholder="Abdullayev Abdulla"
                :rules="[rules.required]"
              />
            </VCol>

            <!-- Bank Name -->
            <VCol cols="12" md="6">
              <AppTextField
                v-model="form.bankName"
                label="Bank nomi"
                placeholder="Uzcard"
              />
            </VCol>

            <!-- Card Type -->
            <VCol cols="12" md="6">
              <AppSelect
                v-model="form.cardType"
                label="Karta turi"
                :items="cardTypes"
              />
            </VCol>

            <!-- Description -->
            <VCol cols="12">
              <AppTextarea
                v-model="form.description"
                label="Izoh"
                placeholder="Asosiy karta"
                rows="3"
              />
            </VCol>

            <!-- Status Switches -->
            <VCol cols="12" md="4">
              <VSwitch v-model="form.isActive" label="Faol" color="primary" />
            </VCol>

            <VCol cols="12" md="4">
              <VSwitch
                v-model="form.isVisible"
                label="Ko'rinadi"
                color="primary"
              />
            </VCol>

            <VCol cols="12" md="4">
              <VSwitch
                v-model="form.isPrimary"
                label="Asosiy"
                color="primary"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="emit('update:modelValue', false)"
          :disabled="loading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          :loading="loading"
          :disabled="loading"
          @click="onSubmit"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
