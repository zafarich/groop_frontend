<script setup>
import {usePhoneMask} from "@/composables/usePhoneMask";
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";

definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();
const route = useRoute();
const {getFullPhoneNumber, phoneRule} = usePhoneMask();
const {success: showSuccess} = useToast();

const teacherId = computed(() => route.params.id);

const form = ref({
  firstName: "",
  lastName: "",
  phoneNumber: "",
  specialty: "",
  bio: "",
  isActive: true,
});

const botLink = ref("");
const loading = ref(false);
const fetchLoading = ref(false);
const errorMessage = ref("");

// Form validation rules
const rules = {
  phone: phoneRule,
};

// Fetch teacher data
const fetchTeacher = async () => {
  fetchLoading.value = true;
  try {
    const response = await $api(`/v1/teachers/${teacherId.value}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      const teacher = response.data;

      // Extract phone number without country code (998)
      const phoneNumber = teacher.user?.phoneNumber || "";
      const phoneWithoutCode = phoneNumber.startsWith("998")
        ? phoneNumber.substring(3)
        : phoneNumber;

      form.value = {
        firstName: teacher.user?.firstName || "",
        lastName: teacher.user?.lastName || "",
        phoneNumber: phoneWithoutCode,
        specialty: teacher.specialty || "",
        bio: teacher.bio || "",
        isActive: teacher.isActive !== undefined ? teacher.isActive : true,
      };
    }
  } catch (error) {
    errorMessage.value =
      error.data?.message ||
      error.message ||
      "O'qituvchi ma'lumotlarini yuklashda xatolik";
  } finally {
    fetchLoading.value = false;
  }
};

// Fetch bot link
const fetchBotLink = async () => {
  try {
    const response = await $api(`/v1/teachers/${teacherId.value}/bot-link`, {
      method: "GET",
    });

    if (response.success && response.data) {
      botLink.value = response.data.botLink;
    }
  } catch (error) {
    console.error("Error fetching bot link:", error);
  }
};

// Copy bot link to clipboard
const copyBotLink = async () => {
  try {
    await navigator.clipboard.writeText(botLink.value);
    showSuccess("Havola nusxalandi!");
  } catch (error) {
    errorMessage.value = "Havolani nusxalashda xatolik";
  }
};

// Submit function
const onSubmit = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const body = {};

    // Only include fields that have values
    if (form.value.firstName?.trim()) {
      body.firstName = form.value.firstName.trim();
    }
    if (form.value.lastName?.trim()) {
      body.lastName = form.value.lastName.trim();
    }
    if (form.value.phoneNumber?.trim()) {
      const fullPhone = getFullPhoneNumber(form.value.phoneNumber);
      if (fullPhone.length === 12) {
        body.phoneNumber = fullPhone;
      }
    }
    if (form.value.specialty?.trim()) {
      body.specialty = form.value.specialty.trim();
    }
    if (form.value.bio?.trim()) {
      body.bio = form.value.bio.trim();
    }
    body.isActive = form.value.isActive;

    const response = await $api(`/v1/teachers/${teacherId.value}`, {
      method: "PATCH",
      body,
    });

    if (response.success) {
      showSuccess("O'qituvchi ma'lumotlari muvaffaqiyatli yangilandi!");

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push("/teachers");
      }, 1500);
    } else {
      errorMessage.value = response.message || "Xatolik yuz berdi";
    }
  } catch (error) {
    errorMessage.value =
      error.data?.message ||
      error.message ||
      "O'qituvchi ma'lumotlarini yangilashda xatolik yuz berdi";
  } finally {
    loading.value = false;
  }
};

// Cancel and go back
const onCancel = () => {
  router.go(-1);
};

// Load teacher data on mount
onMounted(() => {
  fetchTeacher();
  fetchBotLink();
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon icon="tabler-edit" class="me-2" />
          <span>O'qituvchi ma'lumotlarini tahrirlash</span>
        </VCardTitle>

        <VDivider />

        <!-- Loading state -->
        <VCardText v-if="fetchLoading" class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
          <div class="text-body-1 mt-4">Yuklanmoqda...</div>
        </VCardText>

        <template v-else>
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

          <!-- Bot Link Section -->
          <VCardText v-if="botLink">
            <VAlert type="info" variant="tonal" class="mb-0">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-subtitle-2 mb-1">Telegram Bot Havolasi</div>
                  <div class="text-caption">
                    Bu havolani o'qituvchiga yuboring. Sizning telegram
                    botingizdan o'qituvchi to'liq foydalanishi uchun muhim
                  </div>
                </div>
              </div>
              <div class="d-flex align-center gap-2 mt-3">
                <AppTextField
                  :model-value="botLink"
                  readonly
                  density="compact"
                  variant="outlined"
                  hide-details
                />
                <VBtn
                  prepend-icon="tabler-copy"
                  color="primary"
                  @click="copyBotLink"
                  size="small"
                  variant="tonal"
                >
                  Nusxa olish
                </VBtn>
              </div>
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
                    label="Telefon raqami"
                    placeholder="90 123 45 67"
                    :rules="[rules.phone]"
                  >
                    <template #prepend-inner>
                      <span class="text-body-1 text-high-emphasis me-1"
                        >+998</span
                      >
                    </template>
                  </AppTextField>
                </VCol>

                <!-- Specialty -->
                <VCol cols="6">
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

                <!-- Is Active -->
                <VCol cols="12">
                  <VSwitch
                    v-model="form.isActive"
                    label="Status"
                    color="primary"
                    :true-value="true"
                    :false-value="false"
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
        </template>
      </VCard>
    </VCol>
  </VRow>
</template>
