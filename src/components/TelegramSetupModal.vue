<script setup>
import {useToast} from "@/composables/useToast";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  connectToken: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "close"]);

const {success: showSuccess} = useToast();

// Copy token to clipboard
const copyToken = async () => {
  if (!props.connectToken) return;

  try {
    await navigator.clipboard.writeText(`/connect ${props.connectToken}`);
    showSuccess("Xabar nusxalani. Telegram guruhga jo'nating");
  } catch (error) {
    console.error("Failed to copy token:", error);
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
          >Guruh yaratildi, lekin qo'shimcha sozlash talab qilinadi</span
        >
      </VCardTitle>

      <VDivider />

      <VCardText class="pt-4">
        <!-- Info Alert -->
        <VAlert type="warning" variant="tonal" class="mb-4">
          <div class="text-body-1">
            Guruh yaratildi, lekin hali to'liq foydalanish uchun tayyor emas.
            <br />
            O'quvchilar qo'shilishi uchun avval bu guruhni telegram guruhga
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
                Telegramda ham bu guruh uchun alohida guruh yarating
              </VListItemTitle>
            </VListItem>
            <VListItem class="px-0">
              <template #prepend>
                <VAvatar size="24" color="primary" variant="tonal" class="me-3">
                  <span class="text-caption font-weight-bold">2</span>
                </VAvatar>
              </template>
              <VListItemTitle class="text-body-2 text-wrap">
                Botingizni telegram guruhga qo'shing va admin huquqini bering
              </VListItemTitle>
            </VListItem>
            <VListItem class="px-0">
              <template #prepend>
                <VAvatar size="24" color="primary" variant="tonal" class="me-3">
                  <span class="text-caption font-weight-bold">3</span>
                </VAvatar>
              </template>
              <VListItemTitle class="text-body-2 text-wrap">
                Telegram guruhga quyidagi xabarni jo'nating:

                <VChip
                  variant="outlined"
                  color="info"
                  class="px-2 py-1 cursor-pointer"
                  append-icon="tabler-copy"
                  size="sm"
                  @click="copyToken"
                >
                  /connect {{ connectToken }}
                </VChip>
              </VListItemTitle>
            </VListItem>
          </VList>
        </div>
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
