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
const {getFullPhoneNumber, phoneRule} = usePhoneMask();
const {success: showSuccess} = useToast();

const form = ref({
  firstName: "",
  lastName: "",
  phoneNumber: "",
  specialty: "",
  bio: "",
});

const loading = ref(false);
const errorMessage = ref("");
const botLink = ref("");
const showBotLinkModal = ref(false);
const createdTeacherId = ref(null);

// Form validation rules
const rules = {
  required: (value) => !!value || "To'ldirish shart",
  phone: phoneRule,
};

// Fetch bot link
const fetchBotLink = async (teacherId) => {
  try {
    const response = await $api(`/v1/teachers/${teacherId}/bot-link`, {
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

// Close modal and redirect
const closeBotLinkModal = () => {
  showBotLinkModal.value = false;
  router.push("/teachers");
};

// Submit function
const onSubmit = async () => {
  // Validate phone number
  const fullPhone = getFullPhoneNumber(form.value.phoneNumber);
  if (fullPhone.length !== 12) {
    errorMessage.value = "Telefon raqami 9 ta raqamdan iborat bo'lishi kerak";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await $api("/v1/teachers", {
      method: "POST",
      body: {
        firstName: form.value.firstName || undefined,
        lastName: form.value.lastName || undefined,
        phoneNumber: fullPhone,
        specialty: form.value.specialty || undefined,
        bio: form.value.bio || undefined,
      },
    });

    if (response.success) {
      showSuccess("O'qituvchi muvaffaqiyatli qo'shildi!");
      createdTeacherId.value = response.data.id;

      // Fetch bot link and show modal
      await fetchBotLink(response.data.id);
      showBotLinkModal.value = true;

      // Reset form
      form.value = {
        firstName: "",
        lastName: "",
        phoneNumber: "",
        specialty: "",
        bio: "",
      };
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

  <!-- Bot Link Modal -->
  <VDialog v-model="showBotLinkModal" max-width="600" persistent>
    <VCard>
      <VCardTitle class="d-flex align-center">
        <VIcon icon="tabler-brand-telegram" class="me-2" color="primary" />
        <span>Telegram Bot Havolasi</span>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VAlert type="info" variant="tonal" class="mb-4">
          Bu havolani o'qituvchiga yuboring. Sizning telegram botingizdan
          o'qituvchi to'liq foydalanishi uchun muhim
        </VAlert>

        <div class="d-flex align-end gap-2">
          <AppTextField
            :model-value="botLink"
            readonly
            label="Bot havolasi"
            variant="outlined"
          />
          <VBtn prepend-icon="tabler-copy" color="primary" @click="copyBotLink">
            Nusxa olish
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <VCardActions>
        <VSpacer />
        <VBtn color="primary" @click="closeBotLinkModal"> Yopish </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
