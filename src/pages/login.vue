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
const {getFullPhoneNumber, phoneRule} = usePhoneMask();

const form = ref({
  phoneNumber: "",
  password: "",
  remember: false,
});

const isPasswordVisible = ref(false);
const loading = ref(false);
const errorMessage = ref("");

onMounted(() => {});

// Form validation rules
const rules = {
  required: (value) => !!value || "To\'lidirsh shart",
  phone: phoneRule,
};

// Login function
const onSubmit = async () => {
  // Validatsiya
  const fullPhone = getFullPhoneNumber(form.value.phoneNumber);
  if (fullPhone.length !== 12) {
    errorMessage.value = "Telefon raqami 9 ta raqamdan iborat bo'lishi kerak";

    return;
  }

  loading.value = true;
  errorMessage.value = "";

  const result = await authStore.login({
    phoneNumber: fullPhone,
    password: form.value.password,
  });

  if (result.success) {
    // User ma'lumotlarini olish
    await authStore.fetchUser();

    loading.value = false;

    // Muvaffaqiyatli login
    const redirectPath = route.query.redirect || "/";

    router.push(redirectPath);
  } else {
    loading.value = false;
    errorMessage.value = result.error;
  }
};
</script>

<template>
  <VRow no-gutters class="auth-wrapper bg-surface">
    <VCol cols="12" class="auth-card-v2 d-flex align-center justify-center">
      <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-6">
        <VCardText>
          <h4 class="text-h4 mb-1">Kirish</h4>
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
                  v-model="form.phoneNumber"
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

              <!-- Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Parol"
                  placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="current-password"
                  :append-inner-icon="
                    isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  :rules="[rules.required]"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <div
                  class="d-flex align-center flex-wrap justify-space-between my-6"
                >
                  <VCheckbox v-model="form.remember" label="Meni eslab qol" />
                  <RouterLink class="text-primary" to="/forgot-password">
                    Parolni unutdingizmi?
                  </RouterLink>
                </div>

                <VBtn
                  block
                  type="submit"
                  :loading="loading"
                  :disabled="loading"
                >
                  Kirish
                </VBtn>
              </VCol>

              <!-- Create account link -->
              <VCol cols="12" class="text-body-1 text-center">
                <span class="d-inline-block"> Platformamizda yangimisiz? </span>
                <RouterLink
                  class="text-primary ms-1 d-inline-block text-body-1"
                  to="/register"
                >
                  Ro'yxatdan o'tish
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
