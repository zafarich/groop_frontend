<script setup>
import {usePhoneMask} from "@/composables/usePhoneMask";
import {useAuthStore} from "@/stores/auth";

definePage({
  meta: {
    layout: "blank",
    public: true,
  },
});

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const {getFullPhoneNumber, formatPhoneNumber} = usePhoneMask();

// Telefon raqamini query yoki store'dan olish
const phoneNumber = computed(() => {
  return route.query.phoneNumber || authStore.pendingPhoneNumber || "";
});

// Formatlangan telefon raqami
const formattedPhone = computed(() => {
  if (!phoneNumber.value) return "";
  const digits = phoneNumber.value.replace(/\D/g, "").slice(3); // 998 ni olib tashlash

  return formatPhoneNumber(digits);
});

// SMS kod (4 xonali)
const code = ref(["", "", "", ""]);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Kod input refs
const codeInputs = ref(Array(4).fill(null));

// Kod input'lariga fokus qilish
const focusInput = (index) => {
  nextTick(() => {
    const inputElement = codeInputs.value[index]?.$el?.querySelector("input");
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  });
};

// Kod kiritilganda keyingi input'ga o'tish
const handleCodeInput = (value, index) => {
  // Faqat raqamlarni qabul qilish
  const digit = value.replace(/\D/g, "").slice(-1);

  if (digit) {
    code.value[index] = digit;

    // Agar 4 ta raqam kiritilgan bo'lsa, avtomatik submit
    if (index === 3 && code.value.every((c) => c)) {
      nextTick(() => {
        onSubmit();
      });
    } else if (index < 3) {
      // Keyingi input'ga o'tish
      focusInput(index + 1);
    }
  } else {
    code.value[index] = "";
  }
};

// Backspace bosilganda oldingi input'ga o'tish
const handleKeyDown = (event, index) => {
  if (event.key === "Backspace") {
    if (!code.value[index] && index > 0) {
      // Agar hozirgi input bo'sh bo'lsa, oldingisiga o'tish va uni tozalash
      code.value[index - 1] = "";
      focusInput(index - 1);
    } else {
      // Agar hozirgi input'da raqam bo'lsa, uni tozalash
      code.value[index] = "";
    }
  } else if (event.key === "ArrowLeft" && index > 0) {
    focusInput(index - 1);
  } else if (event.key === "ArrowRight" && index < 3) {
    focusInput(index + 1);
  }
};

// Paste funksiyasi
const handlePaste = (event, index) => {
  event.preventDefault();
  const pastedData = event.clipboardData
    .getData("text")
    .replace(/\D/g, "")
    .slice(0, 4);

  for (let i = 0; i < 4; i++) {
    if (pastedData[i]) {
      code.value[i] = pastedData[i];
    }
  }

  // Agar 4 ta raqam bo'lsa, avtomatik submit
  if (pastedData.length === 4) {
    nextTick(() => {
      onSubmit();
    });
  } else {
    focusInput(Math.min(pastedData.length, 3));
  }
};

// Form validation rules
const rules = {
  required: (value) => !!value || "To'lidirsh shart",
};

// Kod tasdiqlash funksiyasi
const onSubmit = async () => {
  const fullCode = code.value.join("");

  if (fullCode.length !== 4) {
    errorMessage.value = "Iltimos, 4 xonali kodni kiriting";

    return;
  }

  if (!phoneNumber.value) {
    errorMessage.value = "Telefon raqami topilmadi";

    return;
  }

  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  const verificationType = route.query.type;
  let result;

  if (verificationType === "forgot-password") {
    result = await authStore.verifyForgotPassword(phoneNumber.value, fullCode);
  } else {
    // Default to register verification
    result = await authStore.verifyCenter(phoneNumber.value, fullCode);
  }

  loading.value = false;

  if (result.success) {
    successMessage.value = "Muvaffaqiyatli tasdiqlandi!";

    // Agar forgot-password bo'lsa, yangi parol o'rnatish sahifasiga o'tish kerak
    // Agar register bo'lsa, homega
    if (verificationType === "forgot-password") {
      router.push({
        path: "/reset-password",
        query: {
          phoneNumber: phoneNumber.value,
          code: fullCode,
        },
      });
    } else {
      router.push("/");
    }
  } else {
    errorMessage.value = result.error;
    // Xatolik bo'lsa kodlarni tozalash
    code.value = ["", "", "", ""];
    focusInput(0);
  }
};

// Qayta yuborish funksiyasi
// Qayta yuborish funksiyasi
const handleResend = async () => {
  if (!phoneNumber.value) {
    errorMessage.value = "Telefon raqami topilmadi";
    return;
  }

  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  const result = await authStore.resendForgotPassword(phoneNumber.value);

  loading.value = false;

  if (result.success) {
    successMessage.value = result.data.message || "Kod qayta yuborildi";
  } else {
    errorMessage.value = result.error;
  }
};

// Telefon raqami yo'q bo'lsa register sahifasiga qaytarish
onMounted(() => {
  if (!phoneNumber.value) {
    router.push("/register");
  } else {
    // Birinchi input'ga fokus
    nextTick(() => {
      focusInput(0);
    });
  }
});
</script>

<template>
  <VRow no-gutters class="auth-wrapper bg-surface">
    <VCol cols="12" class="auth-card-v2 d-flex align-center justify-center">
      <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-6">
        <VCardText>
          <h4 class="text-h4 mb-1">SMS kodni tasdiqlash</h4>
          <p class="mb-0">
            <span v-if="formattedPhone">
              Telefon raqamiga
              <strong>+998 {{ formattedPhone }}</strong> yuborilgan SMS kodni
              kiriting
            </span>
            <span v-else
              >Telefon raqamingizga yuborilgan SMS kodni kiriting</span
            >
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
              <!-- SMS Code Inputs -->
              <VCol cols="12">
                <div class="d-flex justify-center gap-4 mb-4">
                  <AppTextField
                    v-for="(digit, index) in code"
                    :key="index"
                    :ref="
                      (el) => {
                        if (el) codeInputs[index] = el;
                      }
                    "
                    :model-value="digit"
                    :autofocus="index === 0"
                    maxlength="1"
                    class="text-center code-input"
                    style="
                      font-size: 24px;
                      font-weight: bold;
                      inline-size: 50px;
                    "
                    @input="
                      (event) => handleCodeInput(event.target.value, index)
                    "
                    @keydown="(event) => handleKeyDown(event, index)"
                    @paste="(event) => handlePaste(event, index)"
                  />
                </div>
              </VCol>

              <!-- Submit button -->
              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  :loading="loading"
                  :disabled="loading"
                >
                  Tasdiqlash
                </VBtn>
              </VCol>

              <!-- Resend code link -->
              <VCol cols="12" class="text-center">
                <span class="text-body-2 text-disabled me-1">Kod kelmadi?</span>
                <a
                  href="javascript:void(0)"
                  class="text-primary text-body-2"
                  @click="handleResend"
                >
                  Qayta yuborish
                </a>
              </VCol>

              <!-- Back to register -->
              <VCol cols="12">
                <RouterLink
                  class="d-flex align-center justify-center"
                  to="/register"
                >
                  <VIcon
                    icon="tabler-chevron-left"
                    size="20"
                    class="me-1 flip-in-rtl"
                  />
                  <span class="text-body-1">Orqaga qaytish</span>
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

.code-input {
  input {
    font-size: 24px !important;
    font-weight: bold !important;
    letter-spacing: 2px;
    text-align: center !important;
  }
}
</style>
