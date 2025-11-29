<script setup>
import {usePhoneMask} from "@/composables/usePhoneMask";
import {$api} from "@/utils/api";

definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();
const {getFullPhoneNumber, phoneRule} = usePhoneMask();

const form = ref({
  firstName: "",
  lastName: "",
  phoneNumber: "",
  telegramUserId: "",
  specialty: "",
  bio: "",
});

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Form validation rules
const rules = {
  required: (value) => !!value || "To'ldirish shart",
  phone: phoneRule,
  telegramUserId: (value) => {
    if (!value) return "To'ldirish shart";
    const num = parseInt(value);
    return (!isNaN(num) && num > 0) || "Telegram User ID raqam bo'lishi kerak";
  },
};

// Submit function
const onSubmit = async () => {
  // Validate phone number
  const fullPhone = getFullPhoneNumber(form.value.phoneNumber);
  if (fullPhone.length !== 12) {
    errorMessage.value = "Telefon raqami 9 ta raqamdan iborat bo'lishi kerak";
    return;
  }

  // Validate Telegram User ID
  const telegramUserId = parseInt(form.value.telegramUserId);
  if (isNaN(telegramUserId) || telegramUserId <= 0) {
    errorMessage.value = "Telegram User ID to'g'ri formatda emas";
    return;
  }

  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const response = await $api("/v1/teachers", {
      method: "POST",
      body: {
        firstName: form.value.firstName || undefined,
        lastName: form.value.lastName || undefined,
        phoneNumber: fullPhone,
        telegramUserId: telegramUserId,
        specialty: form.value.specialty || undefined,
        bio: form.value.bio || undefined,
      },
    });

    if (response.success) {
      successMessage.value = "O'qituvchi muvaffaqiyatli qo'shildi!";

      // Reset form
      form.value = {
        firstName: "",
        lastName: "",
        phoneNumber: "",
        telegramUserId: "",
        specialty: "",
        bio: "",
      };

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } else {
      errorMessage.value = response.message || "Xatolik yuz berdi";
    }
  } catch (error) {
    errorMessage.value =
      error.data?.message ||
      error.message ||
      "O'qituvchi qo'shishda xatolik yuz berdi";
  } finally {
    loading.value = false;
  }
};

// Cancel and go back
const onCancel = () => {
  router.go(-1);
};
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon icon="tabler-user-plus" class="me-2" />
          <span>Yangi o'qituvchi qo'shish</span>
        </VCardTitle>

        <VDivider />

        <!-- Success alert -->
        <VCardText v-if="successMessage">
          <VAlert
            type="success"
            variant="tonal"
            closable
            @click:close="successMessage = ''"
          >
            {{ successMessage }}
          </VAlert>
        </VCardText>

        <!-- Error alert -->
        <VCardText v-if="errorMessage">
          <VAlert
            type="error"
            variant="tonal"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </VAlert>
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="onSubmit">
            <VRow>
              <!-- First Name -->
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.firstName"
                  label="Ism"
                  placeholder="Ism"
                  :rules="[rules.required]"
                />
              </VCol>

              <!-- Last Name -->
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.lastName"
                  label="Familiya"
                  placeholder="Familiya"
                />
              </VCol>

              <!-- Phone Number -->
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.phoneNumber"
                  v-mask="'## ### ## ##'"
                  label="Telefon raqami *"
                  placeholder="90 123 45 67"
                  :rules="[rules.required, rules.phone]"
                >
                  <template #prepend-inner>
                    <span class="text-body-1 text-high-emphasis me-1"
                      >+998</span
                    >
                  </template>
                </AppTextField>
              </VCol>

              <!-- Telegram User ID -->
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.telegramUserId"
                  label="Telegram User ID *"
                  placeholder="123456789"
                  type="number"
                  :rules="[rules.telegramUserId]"
                />
              </VCol>

              <!-- Specialty -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.specialty"
                  label="Mutaxassislik"
                  placeholder="Matematika, Fizika, va h.k."
                />
              </VCol>

              <!-- Bio -->
              <VCol cols="12">
                <AppTextarea
                  v-model="form.bio"
                  label="Qisqacha ma'lumot"
                  placeholder="O'qituvchi haqida qisqacha ma'lumot..."
                  rows="4"
                />
              </VCol>

              <!-- Action Buttons -->
              <VCol cols="12" class="d-flex gap-4">
                <VBtn type="submit" :loading="loading" :disabled="loading">
                  Saqlash
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="outlined"
                  @click="onCancel"
                  :disabled="loading"
                >
                  Bekor qilish
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
