<script setup>
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import {prettyMoney} from "@/utils/utils";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  groupId: {
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "success"]);

const {success: showSuccess, error: showError} = useToast();

// State
const loading = ref(false);
const previewData = ref(null);
const showConfirmDialog = ref(false);

// Reset when modal opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    fetchPreview();
  } else {
    previewData.value = null;
    showConfirmDialog.value = false;
  }
});

const closeModal = () => {
  emit("update:modelValue", false);
};

const fetchPreview = async () => {
  loading.value = true;
  try {
    // First fetch all TRIAL students with zero balance
    const response = await $api(
      `/v1/groups/${props.groupId}/students?status=TRIAL&limit=1000`,
      {method: "GET"},
    );

    if (response.success && response.data) {
      // Filter students with balance <= 0
      const zeroBalanceStudents = response.data.filter(
        (s) => Number(s.balance) <= 0
      );

      // Fetch promises to identify excluded students
      const promisesResponse = await $api(
        `/v1/groups/${props.groupId}/promises-to-pay`,
        {method: "GET"},
      );

      const promisedEnrollmentIds = promisesResponse.success && promisesResponse.data
        ? promisesResponse.data
            .filter((p) => p.status === "ACTIVE")
            .map((p) => p.enrollmentId)
        : [];

      // Separate students
      const toRemove = zeroBalanceStudents.filter(
        (s) => !promisedEnrollmentIds.includes(s.id)
      );
      const excluded = zeroBalanceStudents.filter(
        (s) => promisedEnrollmentIds.includes(s.id)
      );

      previewData.value = {
        toRemove,
        excluded,
        totalCount: zeroBalanceStudents.length,
      };
    }
  } catch (error) {
    console.error("Error fetching preview:", error);
    showError("Ma'lumotlarni yuklashda xatolik");
  } finally {
    loading.value = false;
  }
};

const performRemoval = async () => {
  if (!previewData.value?.toRemove?.length) {
    closeModal();
    return;
  }

  loading.value = true;
  try {
    const response = await $api(
      `/v1/groups/${props.groupId}/bulk-remove-trial-zero-balance`,
      {
        method: "POST",
        body: {
          excludeEnrollmentIds: previewData.value.excluded.map((s) => s.id),
        },
      },
    );

    if (response.success) {
      showSuccess(
        response.message || `${response.data.removedCount} ta o'quvchi chiqarildi`
      );
      emit("success");
      closeModal();
    }
  } catch (error) {
    console.error("Error removing trial students:", error);
    showError(error.data?.message || "Chiqarishda xatolik yuz berdi");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="closeModal"
    max-width="700"
  >
    <VCard>
      <VCardTitle class="pa-4 d-flex justify-space-between align-center">
        <span class="text-h6">Sinov darsi o'quvchilarini chiqarish</span>
        <VBtn
          icon="tabler-x"
          variant="text"
          density="compact"
          @click="closeModal"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <div v-if="loading && !previewData" class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
          <div class="mt-2 text-medium-emphasis">Yuklanmoqda...</div>
        </div>

        <template v-else-if="previewData">
          <!-- Summary -->
          <VAlert
            v-if="previewData.toRemove.length === 0"
            type="info"
            variant="tonal"
            class="mb-4"
          >
            <VAlertTitle>Hech kim chiqarilmaydi</VAlertTitle>
            <div>
              Balansi nol yoki manfiy bo'lgan sinov darsi o'quvchilari topilmadi,
              yoki ularning barchasida to'lov va'dasi mavjud.
            </div>
          </VAlert>

          <template v-else>
            <!-- Summary Stats -->
            <VRow class="mb-4">
              <VCol cols="6">
                <VCard color="error" variant="tonal">
                  <VCardText class="text-center">
                    <div class="text-h4 font-weight-bold">{{ previewData.toRemove.length }}</div>
                    <div class="text-body-2">Chiqariladigan o'quvchilar</div>
                    <div class="text-caption text-medium-emphasis">
                      Balansi nol yoki manfiy
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
              <VCol cols="6" v-if="previewData.excluded.length > 0">
                <VCard color="success" variant="tonal">
                  <VCardText class="text-center">
                    <div class="text-h4 font-weight-bold">{{ previewData.excluded.length }}</div>
                    <div class="text-body-2">Saqlanadigan o'quvchilar</div>
                    <div class="text-caption text-medium-emphasis">
                      To'lov va'dasi mavjud
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>

            <VAlert
              v-if="previewData.toRemove.length > 0"
              type="warning"
              variant="tonal"
              class="mb-4"
            >
              <VAlertTitle>Diqqat!</VAlertTitle>
              <div>
                <strong>{{ previewData.toRemove.length }}</strong> ta sinov darsi o'quvchisi
                guruhdan chiqariladi.
              </div>
            </VAlert>

            <!-- Excluded List (Promise to Pay) - Always show all without pagination -->
            <VCard
              v-if="previewData.excluded.length > 0"
              variant="outlined"
            >
              <VCardTitle class="text-subtitle-2 bg-success-lighten-5 pa-3 d-flex align-center">
                <VIcon icon="tabler-shield-check" size="18" class="me-2" />
                To'lov va'dasi sababli saqlanadi
                <VChip size="small" color="success" class="ms-2">
                  {{ previewData.excluded.length }}
                </VChip>
              </VCardTitle>
              <VDivider />
              <VList
                density="compact"
                class="pa-0"
                style="max-height: 400px; overflow-y: auto;"
              >
                <VListItem
                  v-for="student in previewData.excluded"
                  :key="student.id"
                  class="border-b"
                >
                  <template #prepend>
                    <VAvatar size="32" color="success" variant="tonal">
                      <VIcon icon="tabler-user" size="16" />
                    </VAvatar>
                  </template>
                  <VListItemTitle>
                    {{ student.student?.firstName }} {{ student.student?.lastName }}
                  </VListItemTitle>
                  <VListItemSubtitle>
                    {{ student.student?.user?.phoneNumber }}
                  </VListItemSubtitle>
                  <template #append>
                    <VChip
                      size="small"
                      color="success"
                      variant="tonal"
                    >
                      Va'da berilgan
                    </VChip>
                  </template>
                </VListItem>
              </VList>
            </VCard>
          </template>
        </template>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="outlined"
          color="secondary"
          @click="closeModal"
          :disabled="loading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          v-if="previewData?.toRemove?.length > 0"
          color="error"
          @click="showConfirmDialog = true"
          :loading="loading"
        >
          <VIcon icon="tabler-user-minus" class="me-2" />
          Chiqarish
        </VBtn>
      </VCardActions>
    </VCard>

    <!-- Confirmation Dialog -->
    <VDialog v-model="showConfirmDialog" max-width="400">
      <VCard>
        <VCardTitle class="text-h6 pa-4">
          Tasdiqlash
        </VCardTitle>
        <VCardText class="pa-4">
          <p>
            Haqiqatan ham <strong>{{ previewData?.toRemove?.length }}</strong> ta o'quvchini
            guruhdan chiqarmoqchimisiz?
          </p>
          <p class="text-medium-emphasis mt-2">
            Bu amalni ortga qaytarib bo'lmaydi.
          </p>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="showConfirmDialog = false"
          >
            Yo'q
          </VBtn>
          <VBtn
            color="error"
            @click="performRemoval"
            :loading="loading"
          >
            Ha, chiqarish
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VDialog>
</template>
