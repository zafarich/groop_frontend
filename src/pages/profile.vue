<script setup>
import {useToast} from "@/composables/useToast";
import {useAuthStore} from "@/stores/auth";
import {$api} from "@/utils/api";

definePage({
  meta: {
    layout: "default",
  },
});

const authStore = useAuthStore();
const {success: showSuccess, error: showError} = useToast();

// Profile form
const profileForm = ref({
  firstName: "",
  lastName: "",
});

const profileLoading = ref(false);
const profileError = ref("");

// Password form
const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const refPasswordForm = ref();

const passwordLoading = ref(false);
const passwordError = ref("");
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// User data from store
const userData = computed(() => authStore.currentUser);

// Role mapping
const roleMap = {
  ADMIN: "Administrator",
  TEACHER: "O'qituvchi",
  STUDENT: "O'quvchi",
  USER: "Foydalanuvchi",
};

const userRoleLabel = computed(() => {
  const role = userData.value?.userType || "USER";
  return roleMap[role] || role;
});

// Initialize profile form with user data
const initializeProfile = () => {
  if (userData.value) {
    profileForm.value.firstName = userData.value.firstName || "";
    profileForm.value.lastName = userData.value.lastName || "";
  }
};

// Watch for user data changes
watch(
  userData,
  (newData) => {
    if (newData) {
      initializeProfile();
    }
  },
  {immediate: true},
);

// Validation rules
const passwordRules = {
  required: (value) => !!value || "Bu maydon to'ldirilishi shart",
  minLength: (value) =>
    value?.length >= 6 || "Kamida 6 ta belgi bo'lishi kerak",
  match: (value) =>
    value === passwordForm.value.newPassword || "Parollar mos kelmadi",
};

// Update profile
const updateProfile = async () => {
  profileLoading.value = true;
  profileError.value = "";

  try {
    const response = await $api("/v1/users/profile", {
      method: "PATCH",
      body: {
        firstName: profileForm.value.firstName?.trim(),
        lastName: profileForm.value.lastName?.trim(),
      },
    });

    if (response) {
      // Update the auth store with new user data
      await authStore.fetchUser();
      showSuccess("Profil muvaffaqiyatli yangilandi!");
    }
  } catch (error) {
    profileError.value =
      error.data?.message ||
      error.message ||
      "Profilni yangilashda xatolik yuz berdi";
    showError(profileError.value);
  } finally {
    profileLoading.value = false;
  }
};

// Change password
const changePassword = async () => {
  // Validate passwords match
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = "Parollar mos kelmadi";
    showError(passwordError.value);
    return;
  }

  passwordLoading.value = true;
  passwordError.value = "";

  try {
    const response = await $api("/v1/users/change-password", {
      method: "POST",
      body: {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword,
      },
    });

    if (response) {
      showSuccess("Parol muvaffaqiyatli o'zgartirildi!");
      // Reset password form
      passwordForm.value = {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      };
      nextTick(() => {
        refPasswordForm.value?.resetValidation();
      });
    }
  } catch (error) {
    passwordError.value =
      error.data?.message ||
      error.message ||
      "Parolni o'zgartirishda xatolik yuz berdi";
    showError(passwordError.value);
  } finally {
    passwordLoading.value = false;
  }
};

// Initialize on mount
onMounted(async () => {
  if (!userData.value) {
    try {
      await authStore.fetchUser();
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- Page Header -->
      <div class="d-flex align-center mb-6">
        <VIcon icon="tabler-user" size="32" class="me-3" />
        <div>
          <h2 class="text-h4">Profil</h2>
          <p class="text-body-2 text-disabled mb-0">
            Shaxsiy ma'lumotlarni boshqarish
          </p>
        </div>
      </div>

      <!-- Profile Information Card -->
      <VCard class="mb-6">
        <VCardTitle class="d-flex align-center">
          <VIcon icon="tabler-user-edit" class="me-2" />
          <span>Shaxsiy ma'lumotlar</span>
        </VCardTitle>

        <VDivider />

        <VCardText>
          <!-- Error alert -->
          <VAlert
            v-if="profileError"
            type="error"
            variant="tonal"
            closable
            class="mb-4"
            @click:close="profileError = ''"
          >
            {{ profileError }}
          </VAlert>

          <VForm @submit.prevent="updateProfile">
            <VRow>
              <!-- First Name -->
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="profileForm.firstName"
                  label="Ism"
                  placeholder="Ismingizni kiriting"
                />
              </VCol>

              <!-- Last Name -->
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="profileForm.lastName"
                  label="Familiya"
                  placeholder="Familiyangizni kiriting"
                />
              </VCol>

              <!-- Phone Number (Read Only) -->
              <VCol cols="12" md="6">
                <AppTextField
                  :model-value="userData?.phoneNumber || ''"
                  label="Telefon raqami"
                  readonly
                  disabled
                  hint="Telefon raqamini o'zgartirib bo'lmaydi (kirish uchun ishlatiladi)"
                  persistent-hint
                />
              </VCol>

              <!-- User Role (Read Only) -->
              <VCol cols="12" md="6">
                <AppTextField
                  :model-value="userRoleLabel"
                  label="Rol"
                  readonly
                  disabled
                />
              </VCol>

              <!-- Center Info (Read Only) -->
              <VCol cols="12">
                <AppTextField
                  :model-value="userData?.center?.name || ''"
                  label="O'quv markazi"
                  readonly
                  disabled
                />
              </VCol>

              <!-- Save Button -->
              <VCol cols="12">
                <VBtn
                  type="submit"
                  :loading="profileLoading"
                  :disabled="profileLoading"
                >
                  Saqlash
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>

      <!-- Change Password Card -->
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon icon="tabler-key" class="me-2" />
          <span>Parolni o'zgartirish</span>
        </VCardTitle>

        <VDivider />

        <VCardText>
          <!-- Error alert -->
          <VAlert
            v-if="passwordError"
            type="error"
            variant="tonal"
            closable
            class="mb-4"
            @click:close="passwordError = ''"
          >
            {{ passwordError }}
          </VAlert>

          <VForm ref="refPasswordForm" @submit.prevent="changePassword">
            <VRow>
              <!-- Current Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="passwordForm.currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  label="Joriy parol"
                  placeholder="Joriy parolingizni kiriting"
                  :rules="[passwordRules.required]"
                >
                  <template #append-inner>
                    <VIcon
                      :icon="
                        showCurrentPassword ? 'tabler-eye-off' : 'tabler-eye'
                      "
                      class="cursor-pointer"
                      @click="showCurrentPassword = !showCurrentPassword"
                    />
                  </template>
                </AppTextField>
              </VCol>

              <!-- New Password -->
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="passwordForm.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  label="Yangi parol"
                  placeholder="Yangi parolingizni kiriting"
                  :rules="[passwordRules.required, passwordRules.minLength]"
                  hint="Kamida 6 ta belgi bo'lishi kerak"
                  persistent-hint
                >
                  <template #append-inner>
                    <VIcon
                      :icon="showNewPassword ? 'tabler-eye-off' : 'tabler-eye'"
                      class="cursor-pointer"
                      @click="showNewPassword = !showNewPassword"
                    />
                  </template>
                </AppTextField>
              </VCol>

              <!-- Confirm Password -->
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="passwordForm.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  label="Parolni tasdiqlang"
                  placeholder="Yangi parolni qayta kiriting"
                  :rules="[passwordRules.required, passwordRules.match]"
                >
                  <template #append-inner>
                    <VIcon
                      :icon="
                        showConfirmPassword ? 'tabler-eye-off' : 'tabler-eye'
                      "
                      class="cursor-pointer"
                      @click="showConfirmPassword = !showConfirmPassword"
                    />
                  </template>
                </AppTextField>
              </VCol>

              <!-- Change Password Button -->
              <VCol cols="12">
                <VBtn
                  type="submit"
                  :loading="passwordLoading"
                  :disabled="passwordLoading"
                  color="primary"
                >
                  Parolni o'zgartirish
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
