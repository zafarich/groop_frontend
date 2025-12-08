<script setup>
import BotSetupModal from "@/components/BotSetupModal.vue";
import {$api} from "@/utils/api";

definePage({
  meta: {
    layout: "default",
  },
});

const botInfo = ref(null);
const loading = ref(false);
const showEditModal = ref(false);

const fetchBotInfo = async () => {
  loading.value = true;
  try {
    const response = await $api("/v1/center-bots/my-bot", {
      method: "GET",
    });

    if (response.success && response.data) {
      botInfo.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching bot info:", error);
  } finally {
    loading.value = false;
  }
};

const onBotConfigured = () => {
  showEditModal.value = false;
  fetchBotInfo();
};

onMounted(() => {
  fetchBotInfo();
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Telegram bot sozlamalari">
        <VCardText>
          <div v-if="loading" class="d-flex justify-center py-4">
            <VProgressCircular indeterminate color="primary" />
          </div>

          <div v-else-if="botInfo">
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  :model-value="botInfo.botUsername"
                  label="Bot Username"
                  readonly
                  prepend-inner-icon="tabler-brand-telegram"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  model-value="************************"
                  label="Bot Token"
                  readonly
                  prepend-inner-icon="tabler-key"
                />
              </VCol>
              <VCol cols="12">
                <VBtn prepend-icon="tabler-edit" @click="showEditModal = true">
                  O'zgartirish
                </VBtn>
              </VCol>
            </VRow>
          </div>

          <VAlert v-else type="warning" variant="tonal">
            Bot sozlanmagan. Iltimos, sahifani yangilang yoki administratorga
            murojaat qiling.
          </VAlert>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <BotSetupModal
    v-if="botInfo"
    v-model="showEditModal"
    :is-edit-mode="true"
    :initial-username="botInfo.botUsername"
    :bot-id="botInfo.id"
    @bot-configured="onBotConfigured"
  />
</template>
