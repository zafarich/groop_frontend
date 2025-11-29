<script setup>
import {usePhoneMask} from "@/composables/usePhoneMask";
import {$api} from "@/utils/api";

definePage({
  meta: {
    layout: "blank",
    public: true,
  },
});

const {getFullPhoneNumber, phoneRule, createPhoneInputHandler} = usePhoneMask();
const router = useRouter();

const phoneNumber = ref("");
const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

// Form validation rules
const rules = {
  required: (value) => !!value || "To'lidirsh shart",
  phone: phoneRule,
};

// Send reset link function
const onSubmit = async () => {
  // Telefon validatsiyasi
  const fullPhone = getFullPhoneNumber(phoneNumber.value);
  console.log(fullPhone);
  if (fullPhone.length !== 12) {
    errorMessage.value = "Telefon raqami 9 ta raqamdan iborat bo'lishi kerak";

    return;
  }

  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const response = await $api("/v1/auth/forgot-password", {
      method: "POST",
      body: {phoneNumber: fullPhone},
    });
    console.log("response", response);
    if (response.success && response.data) {
      successMessage.value =
        response.data.message ||
        "Parolni tiklash kodi telefon raqamingizga yuborildi";

      // Redirect to verify code page
      router.push({
        path: "/verify-code",
        query: {
          phoneNumber: response.data.phoneNumber,
          type: "forgot-password",
        },
      });
    }
  } catch (error) {
    errorMessage.value =
      error.data?.message ||
      error.message ||
      "Xatolik yuz berdi. Qaytadan urinib ko'ring.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <VRow no-gutters class="auth-wrapper bg-surface">
    <VCol cols="12" class="auth-card-v2 d-flex align-center justify-center">
      <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-6">
        <VCardText>
          <h4 class="text-h4 mb-1">Parolni unutdingizmi?</h4>
          <p class="mb-0">
            Telefon raqamingizni kiriting va biz sizga parolni tiklash kodini
            yuboramiz
          </p>
        </VCardText>

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
              <!-- Phone Number -->
              <VCol cols="12">
                <AppTextField
                  v-model="phoneNumber"
                  v-mask="'## ### ## ##'"
                  label="Telefon raqami"
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

              <!-- Submit button -->
              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  :loading="loading"
                  :disabled="loading"
                >
                  Tiklash kodini yuborish
                </VBtn>
              </VCol>

              <VCol cols="12">
                <RouterLink
                  class="d-flex align-center justify-center"
                  to="/login"
                >
                  <VIcon
                    icon="tabler-chevron-left"
                    size="20"
                    class="me-1 flip-in-rtl"
                  />
                  <span class="text-body-1">Kirish sahifasiga qaytish</span>
                </RouterLink>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
