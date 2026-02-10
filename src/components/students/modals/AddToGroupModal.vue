<script setup>
import { ref, watch, computed } from 'vue';
import { $api } from '@/utils/api';
import { useToast } from '@/composables/useToast';
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";

const props = defineProps({
  modelValue: Boolean,
  student: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'enrollment-created']);

const { success: showSuccess, error: showError } = useToast();

// State
const loading = ref(false);
const availableGroups = ref([]);
const selectedGroupId = ref(null);
const selectedStatus = ref('TRIAL'); // TRIAL or ACTIVE
const activationDate = ref(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
const generatedLink = ref(null);
const linkCopied = ref(false);
const enrolling = ref(false);

const statusOptions = [
  { title: 'Sinov darsi (TRIAL)', value: 'TRIAL' },
  { title: 'Faol (ACTIVE)', value: 'ACTIVE' },
];

const selectedGroup = computed(() => {
  return availableGroups.value.find(g => g.id === selectedGroupId.value);
});

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
  selectedStatus.value = 'TRIAL';
  activationDate.value = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  generatedLink.value = null;
  linkCopied.value = false;
};

// Fetch available groups for this student
const fetchAvailableGroups = async () => {
  loading.value = true;
  try {
    const res = await $api(`/v1/group-invites/available-groups/${props.student.id}`);
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

// Enroll student and generate link
const enrollAndGenerateLink = async () => {
  if (!selectedGroupId.value) {
    showError('Iltimos, guruhni tanlang');
    return;
  }

  enrolling.value = true;
  try {
    // Step 1: Create enrollment with selected status
    const enrollmentRes = await $api('/v1/enrollments', {
      method: 'POST',
      body: {
        studentId: props.student.id,
        groupId: selectedGroupId.value,
        status: selectedStatus.value,
        lessonStartDate: selectedStatus.value === 'ACTIVE' ? activationDate.value : undefined,
      },
    });

    if (!enrollmentRes.success) {
      throw new Error(enrollmentRes.message || 'Guruhga qo\'shishda xatolik');
    }

    // Step 2: Generate invite link for the enrollment
    const inviteRes = await $api('/v1/group-invites', {
      method: 'POST',
      body: {
        groupId: selectedGroupId.value,
        studentId: props.student.id,
        enrollmentId: enrollmentRes.data?.id,
      },
    });

    if (inviteRes.success) {
      generatedLink.value = inviteRes.data;
      showSuccess('O\'quvchi guruhga qo\'shildi va taklif havolasi yaratildi');
      emit('enrollment-created');
    }
  } catch (err) {
    console.error('Error enrolling student:', err);
    showError(err.data?.message || err.message || 'Guruhga qo\'shishda xatolik');
  } finally {
    enrolling.value = false;
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
          <VIcon icon="tabler-users-plus" class="me-2" />
          <span>Guruhga qo'shish</span>
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

        <!-- Enrollment Form -->
        <div v-else-if="!generatedLink" class="space-y-4">
          <!-- Group Selection -->
          <div>
            <div class="text-body-1 mb-3 font-weight-medium">
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

          <VDivider />

          <!-- Status Selection -->
          <div>
            <div class="text-body-1 mb-3 font-weight-medium">
              Statusni tanlang:
            </div>
            <VSelect
              v-model="selectedStatus"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="comfortable"
            />
          </div>

          <!-- Activation Date (if ACTIVE) -->
          <div v-if="selectedStatus === 'ACTIVE'">
            <div class="text-body-1 mb-3 font-weight-medium">
              Aktivlashtirish sanasi:
            </div>
            <AppDateTimePicker
              v-model="activationDate"
              label="Aktivlashtirish sanasi"
              :config="{ dateFormat: 'Y-m-d' }"
            />
            <div class="text-caption text-medium-emphasis mt-1">
              Bu sanadan boshlab o'quvchi balansidan avtomatik yechiladi
            </div>
          </div>
        </div>

        <!-- Generated Link -->
        <div v-else class="space-y-4">
          <VAlert color="success" variant="tonal" class="mb-4">
            <VAlertTitle>O'quvchi guruhga qo'shildi!</VAlertTitle>
            <div class="text-body-2 mt-1">
              Bu havolani o'quvchiga yuboring. U havola orqali botga kirib,
              to'g'ridan-to'g'ri guruhga qo'shilishi mumkin.
            </div>
          </VAlert>

          <div class="pa-3 bg-grey-100 rounded">
            <div class="text-caption text-medium-emphasis mb-1">Guruh:</div>
            <div class="font-weight-medium">{{ generatedLink.groupName }}</div>
          </div>

          <div class="pa-3 bg-grey-100 rounded">
            <div class="text-caption text-medium-emphasis mb-1">Status:</div>
            <VChip
              size="small"
              :color="selectedStatus === 'ACTIVE' ? 'success' : 'info'"
              variant="tonal"
            >
              {{ selectedStatus === 'ACTIVE' ? 'Faol' : 'Sinov darsi' }}
            </VChip>
          </div>

          <div class="pa-3 bg-grey-100 rounded">
            <div class="text-caption text-medium-emphasis mb-1">
              Havola muddati:
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
          :disabled="enrolling"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          v-if="!generatedLink"
          color="primary"
          :disabled="!selectedGroupId || enrolling"
          :loading="enrolling"
          @click="enrollAndGenerateLink"
        >
          <VIcon icon="tabler-link" class="me-1" />
          Guruhga qo'shish va havola yaratish
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
