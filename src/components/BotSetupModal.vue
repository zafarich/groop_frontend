<script setup>
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "botConfigured"]);

const {success: showSuccess, error: showError} = useToast();

const form = ref({
  botUsername: "",
  botToken: "",
});

const loading = ref(false);
const errorMessage = ref("");

// Form validation rules
const rules = {
  required: (value) => !!value || "To'ldirish shart",
  botUsername: (value) => {
    if (!value) return "Bot username kiritish shart";
    if (!value.endsWith("_bot"))
      return "Bot username '_bot' bilan tugashi kerak";
    return true;
  },
};

// Submit function
const onSubmit = async () => {
  loading.value = true;
  errorMessage.value = "";

  const botUsername = normalizeUsername(form.value.botUsername);

  try {
    const response = await $api("/v1/center-bots", {
      method: "POST",
      body: {
        botUsername: form.value.botUsername.trim(),
        botToken: form.value.botToken.trim(),
      },
    });

    if (response.success) {
      showSuccess("Telegram bot muvaffaqiyatli sozlandi!");
      emit("botConfigured");

      // Reset form
      form.value = {
        botUsername: "",
        botToken: "",
      };
    } else {
      errorMessage.value = response.message || "Xatolik yuz berdi";
    }
  } catch (error) {
    errorMessage.value =
      error.data?.message || error.message || "Bot sozlashda xatolik yuz berdi";
  } finally {
    loading.value = false;
  }
};

function normalizeUsername(username) {
  if (username.startsWith("@")) return username.replace("@", "");
  if (username.startsWith("https://t.me/"))
    return username.replace("https://t.me/", "");
  return username;
}
</script>

<template>
  <VDialog :model-value="modelValue" max-width="600" persistent>
    <VCard>
      <VCardTitle class="d-flex align-center">
        <VIcon icon="tabler-brand-telegram" class="me-2" color="primary" />
        <span>Telegram bot sozlash</span>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-2">
            BotFather orqali bot yarating (
            <a
              href="https://t.me/botfather"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary"
            >
              @botfather
            </a>
            ). Keyin bot username va tokenni quyidagi formaga kiriting. Bu
            tizimning to'g'ri ishlashi uchun zarur!
          </div>
        </VAlert>

        <!-- Error alert -->
        <VAlert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </VAlert>

        <VForm @submit.prevent="onSubmit">
          <VRow>
            <!-- Bot Username -->
            <VCol cols="12">
              <AppTextField
                v-model="form.botUsername"
                label="Bot Username *"
                placeholder="mybot_bot"
                :rules="[rules.required, rules.botUsername]"
                hint="Bot username '_bot' bilan tugashi kerak"
                persistent-hint
              >
                <template #prepend-inner>
                  <span class="text-body-1 text-high-emphasis me-1">@</span>
                </template>
              </AppTextField>
            </VCol>

            <!-- Bot Token -->
            <VCol cols="12">
              <AppTextField
                v-model="form.botToken"
                label="Bot Token *"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                type="password"
                :rules="[rules.required]"
                hint="BotFather dan olingan token"
                persistent-hint
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="primary"
          variant="elevated"
          :loading="loading"
          :disabled="loading"
          @click="onSubmit"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
