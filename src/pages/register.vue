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
const {getFullPhoneNumber, phoneRule, createPhoneInputHandler} = usePhoneMask();

const form = ref({
  centerName: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  password: "",
  privacyPolicies: false,
});

const isPasswordVisible = ref(false);
const loading = ref(false);
const errorMessage = ref("");

// Input handler for phone mask
const onPhoneInput = createPhoneInputHandler(
  computed({
    get: () => form.value.phoneNumber,
    set: (val) => (form.value.phoneNumber = val),
  })
);

// Form validation rules
const rules = {
  required: (value) => !!value || "To'lidirsh shart",
  phone: phoneRule,
  minLength: (len) => (value) =>
    (value && value.length >= len) || `Kamida ${len} ta belgi bo'lishi kerak`,
};

// Register function
const onSubmit = async () => {
  if (!form.value.privacyPolicies) {
    errorMessage.value = "Iltimos, foydalanish shartlarini qabul qiling";

    return;
  }

  // Telefon validatsiyasi
  const fullPhone = getFullPhoneNumber(form.value.phoneNumber);
  if (fullPhone.length !== 12) {
    errorMessage.value = "Telefon raqami 9 ta raqamdan iborat bo'lishi kerak";

    return;
  }

  loading.value = true;
  errorMessage.value = "";

  const result = await authStore.registerCenter({
    centerName: form.value.centerName,
    firstName: form.value.firstName,
    lastName: form.value.lastName,
    phoneNumber: fullPhone,
    password: form.value.password,
  });

  loading.value = false;

  if (result.success) {
    // SMS kod sahifasiga yo'naltirish
    router.push({
      path: "/verify-code",
      query: {phoneNumber: result.data.phoneNumber},
    });
  } else {
    errorMessage.value = result.error;
  }
};
</script>

<template>
  <VRow no-gutters class="auth-wrapper bg-surface">
    <VCol cols="12" class="auth-card-v2 d-flex align-center justify-center">
      <VCard flat :max-width="500" class="mt-12 mt-sm-0 pa-6">
        <VCardText>
          <h4 class="text-h4 mb-1">O'quv markazini ro'yxatdan o'tkazish</h4>
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
              <!-- Center Name -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.centerName"
                  label="O'quv markaz nomi"
                  placeholder="O'quv markaz nomi"
                  :rules="[rules.required]"
                />
              </VCol>

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
                  :rules="[rules.required]"
                />
              </VCol>

              <!-- Phone Number -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.phoneNumber"
                  label="Telefon raqami"
                  placeholder="90 123 45 67"
                  :rules="[rules.required, rules.phone]"
                  v-mask="'## ### ## ##'"
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
                  :append-inner-icon="
                    isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'
                  "
                  :rules="[rules.required, rules.minLength(6)]"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <div class="d-flex align-center my-6">
                  <VCheckbox
                    id="privacy-policy"
                    v-model="form.privacyPolicies"
                    inline
                  >
                    <template #label>
                      <span class="me-1 text-body-1">
                        Men
                        <a href="javascript:void(0)" class="text-primary"
                          >maxfiylik siyosati va shartlari</a
                        >
                        ga roziman
                      </span>
                    </template>
                  </VCheckbox>
                </div>

                <VBtn
                  block
                  type="submit"
                  :loading="loading"
                  :disabled="loading"
                >
                  Ro'yxatdan o'tish
                </VBtn>
              </VCol>

              <!-- Login link -->
              <VCol cols="12" class="text-body-1 text-center">
                <span class="d-inline-block">
                  Allaqachon hisobingiz bormi?
                </span>
                <RouterLink
                  class="text-primary ms-1 d-inline-block text-body-1"
                  to="/login"
                >
                  Tizimga kirish
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
