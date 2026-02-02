<script setup>
import {useToast} from "@/composables/useToast";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  botUsername: {
    type: String,
    default: "",
  },
  telegramResourceType: {
    type: String,
    default: "PRIVATE_GROUP",
  },
});

const emit = defineEmits(["update:modelValue", "close"]);

const {success: showSuccess} = useToast();

// Computed label for resource type
const resourceTypeLabel = computed(() => {
  return props.telegramResourceType === "PRIVATE_CHANNEL"
    ? "kanalingizga"
    : "guruhingizga";
});

// Copy bot username to clipboard
const copyBotUsername = async () => {
  if (!props.botUsername) return;

  try {
    await navigator.clipboard.writeText(`@${props.botUsername}`);
    showSuccess("Bot nomi nusxalandi!");
  } catch (error) {
    console.error("Failed to copy bot username:", error);
  }
};

// Handle close button click
const handleClose = () => {
  emit("update:modelValue", false);
  emit("close");
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="650"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex align-center py-4">
        <VIcon
          icon="tabler-brand-telegram"
          class="me-2"
          color="warning"
          size="28"
        />
        <span class="text-h6"
          >Guruh yaratildi! Endi Telegram {{ resourceTypeLabel }} ulang</span
        >
      </VCardTitle>

      <VDivider />

      <VCardText class="pt-4">
        <!-- Info Alert -->
        <VAlert type="warning" variant="tonal" class="mb-4">
          <div class="text-body-1">
            Guruh yaratildi, lekin hali to'liq foydalanish uchun tayyor emas.
            <br />
            O'quvchilar qo'shilishi uchun avval bu guruhni Telegram
            {{ resourceTypeLabel }}
            ulash kerak.
          </div>
        </VAlert>

        <!-- Setup Steps -->
        <div>
          <h4 class="text-subtitle-1 font-weight-medium mb-3">
            Quyidagi qadamlarni bajaring:
          </h4>
          <VList density="compact" class="bg-transparent">
            <VListItem class="px-0">
              <template #prepend>
                <VAvatar size="24" color="primary" variant="tonal" class="me-3">
                  <span class="text-caption font-weight-bold">1</span>
                </VAvatar>
              </template>
              <VListItemTitle class="text-body-2 text-wrap">
                <template v-if="telegramResourceType === 'PRIVATE_CHANNEL'">
                  Telegramda yopiq kanal yarating (yoki mavjud kanaldan
                  foydalaning)
                </template>
                <template v-else>
                  Telegramda yopiq guruh yarating (yoki mavjud guruhdan
                  foydalaning)
                </template>
              </VListItemTitle>
            </VListItem>
            <VListItem class="px-0">
              <template #prepend>
                <VAvatar size="24" color="primary" variant="tonal" class="me-3">
                  <span class="text-caption font-weight-bold">2</span>
                </VAvatar>
              </template>
              <VListItemTitle class="text-body-2 text-wrap">
                Botingizni {{ resourceTypeLabel }} qo'shing:
                <VChip
                  v-if="botUsername"
                  variant="outlined"
                  color="info"
                  class="px-2 py-1 cursor-pointer ml-2"
                  append-icon="tabler-copy"
                  size="sm"
                  @click="copyBotUsername"
                >
                  @{{ botUsername }}
                </VChip>
              </VListItemTitle>
            </VListItem>
            <VListItem class="px-0">
              <template #prepend>
                <VAvatar size="24" color="primary" variant="tonal" class="me-3">
                  <span class="text-caption font-weight-bold">3</span>
                </VAvatar>
              </template>
              <VListItemTitle class="text-body-2 text-wrap">
                Botga <strong>administrator</strong> huquqini bering
              </VListItemTitle>
            </VListItem>
            <VListItem class="px-0">
              <template #prepend>
                <VAvatar size="24" color="success" variant="tonal" class="me-3">
                  <VIcon icon="tabler-check" size="14" />
                </VAvatar>
              </template>
              <VListItemTitle class="text-body-2 text-wrap">
                Bot admin bo'lgandan keyin sizga shaxsiy xabar orqali guruhni
                tanlash tugmasi keladi
              </VListItemTitle>
            </VListItem>
          </VList>
        </div>

        <!-- Success Note -->
        <VAlert type="success" variant="tonal" class="mt-4">
          <div class="text-body-2">
            <strong>Muhim:</strong> Bot admin bo'lganidan keyin sizga Telegramda
            xabar keladi. Shu xabardagi tugmani bosib, qaysi guruhni ulash
            kerakligini tanlaysiz.
          </div>
        </VAlert>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn color="primary" variant="elevated" @click="handleClose">
          <VIcon icon="tabler-check" class="me-1" />
          Tushunarli
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
