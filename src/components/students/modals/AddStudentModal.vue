<script setup>
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import {prettyPhoneNumber} from "@/utils/utils";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue", "student-created"]);

const {success: showSuccess, error: showError} = useToast();

// Form state
const step = ref("telegram"); // "telegram", "form", "success"
const loading = ref(false);
const checkingTelegram = ref(false);

// Telegram check state
const telegramId = ref("");
const telegramCheckResult = ref(null);

// Form data
const form = ref({
  firstName: "",
  lastName: "",
  phoneNumber: "",
  phoneDisplay: "",
  username: "",
});

// Reset form when modal opens/closes
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      resetForm();
    }
  },
);

const resetForm = () => {
  step.value = "telegram";
  telegramId.value = "";
  telegramCheckResult.value = null;
  form.value = {
    firstName: "",
    lastName: "",
    phoneNumber: "",
    username: "",
  };
};

const closeModal = () => {
  emit("update:modelValue", false);
};

// Check Telegram ID
const checkTelegram = async () => {
  if (!telegramId.value.trim()) {
    showError("Telegram ID ni kiriting");
    return;
  }

  checkingTelegram.value = true;
  try {
    const response = await $api("/v1/students/check-telegram", {
      method: "POST",
      body: {
        telegramId: telegramId.value.trim(),
      },
    });

    // Handle wrapped response (response.data contains the actual data)
    const checkData = response.data || response;
    telegramCheckResult.value = checkData;

    if (checkData.existsInCurrentCenter) {
      // Student already exists in this center
      showError("Bu Telegram ID bilan o'quvchi allaqachon mavjud");
      return;
    }

    if (checkData.exists && checkData.telegramUser) {
      // Telegram user exists in other centers - pre-fill data
      const tu = checkData.telegramUser;
      form.value.firstName = tu.firstName || "";
      form.value.lastName = tu.lastName || "";
      form.value.username = tu.username || "";
      const phoneRaw = tu.phoneNumber
        ? formatPhoneForInput(tu.phoneNumber)
        : "";
      form.value.phoneNumber = phoneRaw;
      form.value.phoneDisplay = formatPhoneMask(phoneRaw);
    }

    // Move to form step
    step.value = "form";
  } catch (error) {
    console.error("Error checking telegram:", error);
    showError(error.data?.message || "Tekshirishda xatolik yuz berdi");
  } finally {
    checkingTelegram.value = false;
  }
};

// Format phone number for input (998901234567 -> 901234567)
const formatPhoneForInput = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("998") && cleaned.length === 12) {
    return cleaned.substring(3); // Remove 998 prefix for input
  }
  return cleaned;
};

// Format phone number with mask (901234567 -> 90 123 45 67)
const formatPhoneMask = (value) => {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "").substring(0, 9);
  const parts = [];
  if (cleaned.length > 0) parts.push(cleaned.substring(0, 2));
  if (cleaned.length > 2) parts.push(cleaned.substring(2, 5));
  if (cleaned.length > 5) parts.push(cleaned.substring(5, 7));
  if (cleaned.length > 7) parts.push(cleaned.substring(7, 9));
  return parts.join(" ");
};

// Format phone number for API (901234567 -> 998901234567)
const formatPhoneForApi = (phone) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 9) {
    return `998${cleaned}`;
  }
  return cleaned;
};

// Phone number input formatter with mask
const formatPhoneInput = (value) => {
  const numericValue = value.replace(/\D/g, "").substring(0, 9);
  form.value.phoneNumber = numericValue;
  form.value.phoneDisplay = formatPhoneMask(numericValue);
};

// Create student
const createStudent = async () => {
  // Validate form
  if (!form.value.firstName.trim()) {
    showError("Ismni kiriting");
    return;
  }
  if (!form.value.lastName.trim()) {
    showError("Familiyani kiriting");
    return;
  }
  if (form.value.phoneNumber.length !== 9) {
    showError("Telefon raqamni to'liq kiriting (9 raqam)");
    return;
  }

  loading.value = true;
  try {
    const response = await $api("/v1/students", {
      method: "POST",
      body: {
        telegramId: telegramId.value.trim(),
        firstName: form.value.firstName.trim(),
        lastName: form.value.lastName.trim(),
        phoneNumber: formatPhoneForApi(form.value.phoneNumber),
        username: form.value.username.trim() || undefined,
      },
    });

    if (response.success) {
      showSuccess(response.message || "O'quvchi muvaffaqiyatli yaratildi");
      emit("student-created");
      closeModal();
    }
  } catch (error) {
    console.error("Error creating student:", error);
    showError(error.data?.message || "Yaratishda xatolik yuz berdi");
  } finally {
    loading.value = false;
  }
};

// Go back to telegram step
const goBack = () => {
  step.value = "telegram";
  telegramCheckResult.value = null;
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="closeModal"
    max-width="600"
    persistent
  >
    <VCard>
      <!-- Header -->
      <VCardTitle class="pa-4 d-flex justify-space-between align-center">
        <div class="d-flex align-center">
          <VIcon icon="tabler-user-plus" color="primary" class="me-2" />
          <span class="text-h6">Yangi o'quvchi qo'shish</span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          density="compact"
          @click="closeModal"
        />
      </VCardTitle>

      <VDivider />

      <!-- Step 1: Telegram ID Input -->
      <VCardText v-if="step === 'telegram'" class="pa-4">
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-2">
            O'quvchining Telegram ID sini kiriting. Agar o'quvchi boshqa o'quv
            markazda ro'yxatdan o'tgan bo'lsa, uning ma'lumotlari avtomatik
            to'ldiriladi.
          </div>
        </VAlert>

        <!-- Already Exists Error -->
        <VAlert
          v-if="telegramCheckResult?.existsInCurrentCenter"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          <div class="text-body-2 font-weight-medium">
            Bu Telegram ID bilan o'quvchi allaqachon mavjud!
          </div>
          <div class="text-body-2 mt-1">
            {{ telegramCheckResult.existingStudentName }} 
            <span class="text-medium-emphasis">(ID: {{ telegramCheckResult.existingStudentId }})</span>
          </div>
        </VAlert>

        <VTextField
          v-model="telegramId"
          label="Telegram ID *"
          placeholder="123456789"
          hint="Telegram profilingizdagi ID raqam"
          persistent-hint
          :disabled="checkingTelegram"
          @keyup.enter="checkTelegram"
        >
          <template #prepend-inner>
            <VIcon icon="tabler-brand-telegram" />
          </template>
        </VTextField>

        <!-- Other Centers Info (if exists) -->
        <VAlert
          v-if="
            telegramCheckResult?.otherCenters &&
            telegramCheckResult.otherCenters.length > 0
          "
          type="warning"
          variant="tonal"
          class="mt-4"
        >
          <div class="text-body-2 font-weight-medium mb-1">
            Bu o'quvchi boshqa markazlarda ro'yxatdan o'tgan:
          </div>
          <VList density="compact" class="bg-transparent pa-0">
            <VListItem
              v-for="center in telegramCheckResult.otherCenters"
              :key="center.centerId"
              class="px-0"
            >
              <template #prepend>
                <VIcon icon="tabler-building" size="16" class="me-2" />
              </template>
              <VListItemTitle class="text-body-2">
                {{ center.centerName }}
                <span v-if="center.firstName || center.lastName" class="text-medium-emphasis">
                  ({{ center.firstName }} {{ center.lastName }})
                </span>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VAlert>
      </VCardText>

      <!-- Step 2: Form -->
      <VCardText v-else-if="step === 'form'" class="pa-4">
        <!-- Found Info Alert -->
        <VAlert
          v-if="telegramCheckResult?.exists"
          type="success"
          variant="tonal"
          class="mb-4"
        >
          <div class="text-body-2">
            Telegram foydalanuvchi topildi! Ma'lumotlar avtomatik to'ldirildi.
          </div>
        </VAlert>

        <VAlert v-else type="info" variant="tonal" class="mb-4">
          <div class="text-body-2">
            Yangi foydalanuvchi. Ma'lumotlarni kiriting.
          </div>
        </VAlert>

        <VRow>
          <!-- First Name -->
          <VCol cols="12" md="6">
            <VTextField
              v-model="form.firstName"
              label="Ism *"
              placeholder="Vali"
              :disabled="loading"
            />
          </VCol>

          <!-- Last Name -->
          <VCol cols="12" md="6">
            <VTextField
              v-model="form.lastName"
              label="Familiya *"
              placeholder="Aliyev"
              :disabled="loading"
            />
          </VCol>

          <!-- Phone Number -->
          <VCol cols="12">
            <VTextField
              v-model="form.phoneDisplay"
              label="Telefon raqam *"
              placeholder="90 123 45 67"
              :disabled="loading"
              @input="formatPhoneInput($event.target.value)"
              maxlength="12"
            >
              <template #prepend-inner>
                <span class="text-body-2 text-medium-emphasis">+998</span>
              </template>
            </VTextField>
            <div class="text-caption text-medium-emphasis mt-1">
              9 ta raqam kiriting (masalan: 90 123 45 67)
            </div>
          </VCol>

          <!-- Username (optional) -->
          <VCol cols="12">
            <VTextField
              v-model="form.username"
              label="Telegram username"
              placeholder="username"
              hint="Ixtiyoriy. @ belgisiz kiriting"
              persistent-hint
              :disabled="loading"
            >
              <template #prepend-inner>
                <span class="text-body-2 text-medium-emphasis">@</span>
              </template>
            </VTextField>
          </VCol>
        </VRow>
      </VCardText>

      <!-- Actions -->
      <VCardActions class="pa-4">
        <VBtn
          v-if="step === 'form'"
          variant="outlined"
          color="secondary"
          @click="goBack"
          :disabled="loading"
        >
          <VIcon icon="tabler-arrow-left" class="me-1" />
          Orqaga
        </VBtn>

        <VSpacer />

        <VBtn variant="outlined" color="secondary" @click="closeModal">
          Bekor qilish
        </VBtn>

        <VBtn
          v-if="step === 'telegram'"
          color="primary"
          variant="elevated"
          :loading="checkingTelegram"
          :disabled="!telegramId.trim() || checkingTelegram"
          @click="checkTelegram"
        >
          Tekshirish
          <VIcon icon="tabler-arrow-right" class="ms-1" />
        </VBtn>

        <VBtn
          v-else-if="step === 'form'"
          color="success"
          variant="elevated"
          :loading="loading"
          :disabled="
            loading ||
            !form.firstName.trim() ||
            !form.lastName.trim() ||
            form.phoneNumber.length !== 9
          "
          @click="createStudent"
        >
          <VIcon icon="tabler-check" class="me-1" />
          Yaratish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
