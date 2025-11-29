<script setup>
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

const form = ref({
  password: "",
  confirmPassword: "",
});

const isPasswordVisible = ref(false);
const isConfirmPasswordVisible = ref(false);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Query params
const phoneNumber = computed(() => route.query.phoneNumber);
const code = computed(() => route.query.code);

// Validation rules
const rules = {
  required: (value) => !!value || "To'lidirsh shart",
  minLength: (len) => (value) =>
    (value && value.length >= len) || `Kamida ${len} ta belgi bo'lishi kerak`,
  match: (value) => value === form.value.password || "Parollar mos kelmadi",
};

const onSubmit = async () => {
  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = "Parollar mos kelmadi";
    return;
  }

  if (!phoneNumber.value || !code.value) {
    errorMessage.value =
      "Ma'lumotlar yetarli emas (telefon raqam yoki kod yo'q)";
    return;
  }

  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  const result = await authStore.resetPassword({
    phoneNumber: phoneNumber.value,
    code: code.value,
    newPassword: form.value.password,
  });

  loading.value = false;

  if (result.success) {
    successMessage.value = "Parol muvaffaqiyatli o'zgartirildi!";
    router.push("/login");
  } else {
    errorMessage.value = result.error;
  }
};

onMounted(() => {
  if (!phoneNumber.value || !code.value) {
    // Agar kerakli ma'lumotlar bo'lmasa, login sahifasiga qaytarish
    router.push("/login");
  }
});
</script>

<template>
  <VRow no-gutters class="auth-wrapper bg-surface">
    <VCol cols="12" class="auth-card-v2 d-flex align-center justify-center">
      <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-6">
        <VCardText>
          <h4 class="text-h4 mb-1">Yangi parol o'rnatish</h4>
          <p class="mb-0">Hisobingiz uchun yangi parol kiriting</p>
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
              <!-- Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Yangi parol"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="
                    isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  :rules="[rules.required, rules.minLength(6)]"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <!-- Confirm Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.confirmPassword"
                  label="Parolni tasdiqlash"
                  placeholder="············"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="
                    isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  :rules="[rules.required, rules.match]"
                  @click:append-inner="
                    isConfirmPasswordVisible = !isConfirmPasswordVisible
                  "
                />
              </VCol>

              <!-- Submit button -->
              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  :loading="loading"
                  :disabled="loading"
                >
                  Parolni saqlash
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
