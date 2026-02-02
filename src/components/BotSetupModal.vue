<script setup>
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  isEditMode: {
    type: Boolean,
    default: false,
  },
  initialUsername: {
    type: String,
    default: "",
  },
  botId: {
    type: [Number, String],
    default: null,
  },
  botConfigured: {
    type: Boolean,
    default: false,
  },
  userTelegramConnected: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "botConfigured", "refresh"]);

const {success: showSuccess, error: showError} = useToast();

const form = ref({
  botUsername: "",
  botToken: "",
});

const checkingConnection = ref(false);

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.isEditMode) {
      form.value.botUsername = props.initialUsername;
      form.value.botToken = "";
    } else if (val && !props.isEditMode) {
      form.value.botUsername = "";
      form.value.botToken = "";
    }
  }
);

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
  botToken: (value) => {
    if (props.isEditMode) return true; // Optional in edit mode
    return !!value || "To'ldirish shart";
  },
};

// Submit function
const onSubmit = async () => {
  loading.value = true;
  errorMessage.value = "";

  const botUsername = normalizeUsername(form.value.botUsername);

  try {
    const body = {
      botUsername: botUsername.trim(),
    };

    if (form.value.botToken.trim()) {
      body.botToken = form.value.botToken.trim();
    }

    const url = props.isEditMode
      ? `/v1/center-bots/${props.botId}`
      : "/v1/center-bots";
    const method = props.isEditMode ? "PATCH" : "POST";

    const response = await $api(url, {
      method,
      body,
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

// Check if user has connected Telegram
const checkTelegramConnection = async () => {
  checkingConnection.value = true;
  try {
    await emit("refresh");
  } finally {
    checkingConnection.value = false;
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
  <VDialog
    :model-value="modelValue"
    max-width="600"
    :persistent="!isEditMode"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex align-center">
        <VIcon icon="tabler-brand-telegram" class="me-2" color="primary" />
        <span>Telegram bot sozlash</span>
      </VCardTitle>

      <VDivider />

      <!-- Step 1: Bot Configuration -->
      <template v-if="!botConfigured">
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
                  :rules="[rules.botToken]"
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
            v-if="isEditMode"
            color="secondary"
            variant="outlined"
            @click="emit('update:modelValue', false)"
            :disabled="loading"
          >
            Bekor qilish
          </VBtn>
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
      </template>

      <!-- Step 2: Connect Telegram Account -->
      <template v-else-if="botConfigured && !userTelegramConnected">
        <VCardText>
          <VAlert type="success" variant="tonal" class="mb-4">
            <div class="text-body-2">
              <VIcon icon="tabler-check" class="me-1" />
              Bot muvaffaqiyatli sozlandi!
            </div>
          </VAlert>

          <VAlert type="warning" variant="tonal" class="mb-4">
            <div class="text-body-2">
              <strong>Keyingi qadam:</strong> Tizimdan to'liq foydalanish uchun
              o'z Telegram akkauntingizni ulashingiz kerak.
            </div>
          </VAlert>

          <div class="text-body-1 mb-4">
            <p class="mb-2">Quyidagi qadamlarni bajaring:</p>
            <ol class="ms-4">
              <li class="mb-1">
                Yaratilgan botga
                <strong>@{{ initialUsername }}</strong> ga kiring
              </li>
              <li class="mb-1">
                <strong>/start</strong> buyrug'ini yuboring
              </li>
              <li>Telefon raqamingizni tasdiqlang</li>
            </ol>
          </div>

          <VAlert type="info" variant="tonal" class="mb-4">
            <div class="text-body-2">
              <VIcon icon="tabler-info-circle" class="me-1" />
              Bu qadam admin sifatida tizimga kirish va bot orqali xabarlar
              olish uchun zarur.
            </div>
          </VAlert>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            color="primary"
            variant="elevated"
            :loading="checkingConnection"
            :disabled="checkingConnection"
            @click="checkTelegramConnection"
            prepend-icon="tabler-refresh"
          >
            Tekshirish
          </VBtn>
        </VCardActions>
      </template>
    </VCard>
  </VDialog>
</template>
