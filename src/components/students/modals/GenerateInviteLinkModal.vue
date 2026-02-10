<script setup>
import { ref, watch } from 'vue';
import { $api } from '@/utils/api';
import { useToast } from '@/composables/useToast';

const props = defineProps({
  modelValue: Boolean,
  student: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const { success: showSuccess, error: showError } = useToast();

// State
const loading = ref(false);
const availableGroups = ref([]);
const selectedGroupId = ref(null);
const generatedLink = ref(null);
const linkCopied = ref(false);

// Watch modal open
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && props.student) {
      await fetchAvailableGroups();
      resetState();
    }
  }
);

const resetState = () => {
  selectedGroupId.value = null;
  generatedLink.value = null;
  linkCopied.value = false;
};

// Fetch available groups for this student
const fetchAvailableGroups = async () => {
  loading.value = true;
  try {
    const res = await $api(`/v1/group-invites/available-groups/${props.student.id}`);
    console.log(res);
    if (res.success) {
      availableGroups.value = res.data || [];
    }
  } catch (err) {
    console.error('Error fetching available groups:', err);
    showError('Guruhlarni yuklashda xatolik');
  } finally {
    loading.value = false;
  }
};

// Generate invite link
const generateLink = async () => {
  if (!selectedGroupId.value) {
    showError('Iltimos, guruhni tanlang');
    return;
  }

  loading.value = true;
  try {
    const res = await $api('/v1/group-invites', {
      method: 'POST',
      body: {
        groupId: selectedGroupId.value,
        studentId: props.student.id,
      },
    });

    if (res.success) {
      generatedLink.value = res.data;
      showSuccess('Taklif havolasi muvaffaqiyatli yaratildi');
    }
  } catch (err) {
    console.error('Error generating invite link:', err);
    showError(err.data?.message || 'Havola yaratishda xatolik');
  } finally {
    loading.value = false;
  }
};

// Copy link to clipboard
const copyLink = async () => {
  if (!generatedLink.value?.botLink) return;

  try {
    await navigator.clipboard.writeText(generatedLink.value.botLink);
    linkCopied.value = true;
    showSuccess('Havola nusxalandi');
    setTimeout(() => {
      linkCopied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Error copying link:', err);
    showError('Havolani nusxalashda xatolik');
  }
};

// Close modal
const close = () => {
  emit('update:modelValue', false);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <VIcon icon="tabler-link" class="me-2" />
          <span>Telegram guruhga taklif</span>
        </div>
        <VBtn icon variant="text" @click="close">
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <!-- Student Info -->
        <div v-if="student" class="mb-4 pa-3 bg-grey-50 rounded">
          <div class="d-flex align-center">
            <VIcon icon="tabler-user" class="me-2" />
            <span class="font-weight-medium">
              {{ student.firstName }} {{ student.lastName }}
            </span>
          </div>
          <div v-if="student.phoneNumber" class="text-caption text-medium-emphasis mt-1">
            {{ student.phoneNumber }}
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading && !availableGroups.length" class="text-center py-4">
          <VProgressCircular indeterminate color="primary" size="32" />
          <div class="text-body-2 text-medium-emphasis mt-2">
            Guruhlar yuklanmoqda...
          </div>
        </div>

        <!-- No Available Groups -->
        <div
          v-else-if="!loading && availableGroups.length === 0"
          class="text-center py-4"
        >
          <VIcon icon="tabler-info-circle" size="48" color="info" />
          <div class="text-body-1 mt-2">
            Qo'shilishi mumkin bo'lgan guruhlar yo'q
          </div>
          <div class="text-body-2 text-medium-emphasis">
            O'quvchi barcha guruhlarga a'zo yoki mavjud guruhlar yo'q
          </div>
        </div>

        <!-- Group Selection -->
        <div v-else-if="!generatedLink" class="space-y-4">
          <div class="text-body-1 mb-3">
            Guruhni tanlang:
          </div>

          <VRadioGroup v-model="selectedGroupId">
            <VCard
              v-for="group in availableGroups"
              :key="group.id"
              variant="outlined"
              class="mb-2"
              :class="{ 'border-primary': selectedGroupId === group.id }"
            >
              <VCardItem>
                <template #prepend>
                  <VRadio :value="group.id" />
                </template>
                <VCardTitle class="text-body-1">
                  {{ group.name }}
                </VCardTitle>
                <VCardSubtitle v-if="group.description" class="text-caption">
                  {{ group.description }}
                </VCardSubtitle>
                <template #append>
                  <VChip size="small" color="primary" variant="tonal">
                    {{ group.monthlyPrice ? group.monthlyPrice.toLocaleString('uz-UZ') : 0 }} so'm/oy
                  </VChip>
                </template>
              </VCardItem>
            </VCard>
          </VRadioGroup>
        </div>

        <!-- Generated Link -->
        <div v-else class="space-y-4">
          <VAlert color="success" variant="tonal" class="mb-4">
            <VAlertTitle>Taklif havolasi yaratildi!</VAlertTitle>
            <div class="text-body-2 mt-1">
              Bu havolani o'quvchiga yuboring. U havola orqali botga kirib,
              guruhga qo'shilishi mumkin.
            </div>
          </VAlert>

          <div class="pa-3 bg-grey-100 rounded">
            <div class="text-caption text-medium-emphasis mb-1">Guruh:</div>
            <div class="font-weight-medium">{{ generatedLink.groupName }}</div>
          </div>

          <div class="pa-3 bg-grey-100 rounded">
            <div class="text-caption text-medium-emphasis mb-1">
              Muddati tugash vaqti:
            </div>
            <div class="font-weight-medium">{{ formatDate(generatedLink.expiresAt) }}</div>
          </div>

          <VTextField
            :model-value="generatedLink.botLink"
            readonly
            variant="outlined"
            density="compact"
            hide-details
            class="mt-4"
          >
            <template #append-inner>
              <VBtn
                size="small"
                :color="linkCopied ? 'success' : 'primary'"
                :prepend-icon="linkCopied ? 'tabler-check' : 'tabler-copy'"
                @click="copyLink"
              >
                {{ linkCopied ? 'Nusxalandi' : 'Nusxalash' }}
              </VBtn>
            </template>
          </VTextField>
        </div>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          v-if="!generatedLink"
          variant="text"
          @click="close"
          :disabled="loading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          v-if="!generatedLink"
          color="primary"
          :disabled="!selectedGroupId || loading"
          :loading="loading"
          @click="generateLink"
        >
          Havola yaratish
        </VBtn>
        <VBtn
          v-else
          color="primary"
          variant="elevated"
          @click="close"
        >
          Yopish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.space-y-4 > * + * {
  margin-top: 16px;
}
</style>
