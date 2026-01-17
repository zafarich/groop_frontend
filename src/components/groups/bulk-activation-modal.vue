<script setup>
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import {prettyMoney, prettyPhoneNumber} from "@/utils/utils";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  groupId: {
    type: [String, Number],
    required: true,
  },
  students: {
    type: Array,
    default: () => [],
  },
  courseStartDate: {
    type: String,
    required: true,
  },
  courseEndDate: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "activationSuccess"]);

const {success: showSuccess, error: showError} = useToast();

// State
const selectedEnrollmentIds = ref([]);
const lessonStartDate = ref("");
const previewData = ref(null);
const previewLoading = ref(false);
const activationLoading = ref(false);
const showConfirmDialog = ref(false);

// Computed
const allSelected = computed({
  get() {
    return (
      props.students.length > 0 &&
      selectedEnrollmentIds.value.length === props.students.length
    );
  },
  set(value) {
    if (value) {
      selectedEnrollmentIds.value = props.students.map((s) => s.id);
    } else {
      selectedEnrollmentIds.value = [];
    }
  },
});

const canActivate = computed(() => {
  return selectedEnrollmentIds.value.length > 0 && lessonStartDate.value;
});

const warningCount = computed(() => {
  if (!previewData.value || !previewData.value.previews) return 0;
  return previewData.value.previews.filter((p) => p.hasInsufficientBalance)
    .length;
});

// Methods
const toggleStudent = (enrollmentId) => {
  const index = selectedEnrollmentIds.value.indexOf(enrollmentId);
  if (index > -1) {
    selectedEnrollmentIds.value.splice(index, 1);
  } else {
    selectedEnrollmentIds.value.push(enrollmentId);
  }
};

const validateDate = () => {
  if (!lessonStartDate.value) {
    showError("Iltimos, dars boshlanish sanasini tanlang");
    return false;
  }

  const selectedDate = new Date(lessonStartDate.value);
  const courseStart = new Date(props.courseStartDate);
  const courseEnd = new Date(props.courseEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate > today) {
    showError("Dars boshlanish sanasi kelajakda bo'lishi mumkin emas");
    return false;
  }

  if (selectedDate < courseStart || selectedDate > courseEnd) {
    showError("Dars boshlanish sanasi kurs muddati ichida bo'lishi kerak");
    return false;
  }

  return true;
};

const openConfirmDialog = async () => {
  if (!validateDate()) return;

  if (!canActivate.value) {
    showError("Iltimos, o'quvchilarni tanlang va sanani kiriting");
    return;
  }

  // First call preview API
  previewLoading.value = true;
  try {
    const previewResponse = await $api(
      `/v1/groups/${props.groupId}/students/bulk-activate/preview`,
      {
        method: "POST",
        body: {
          enrollmentIds: selectedEnrollmentIds.value,
          lessonStartDate: lessonStartDate.value,
        },
      }
    );
    console.log("preview response", previewResponse);

    if (previewResponse.success && previewResponse.data) {
      previewData.value = previewResponse.data;
      // After successful preview, show confirmation dialog
      showConfirmDialog.value = true;
    }
  } catch (error) {
    console.error("Error previewing activation:", error);
    showError(error.data?.message || "Ko'rib chiqishda xatolik yuz berdi");
  } finally {
    previewLoading.value = false;
  }
};

const executeActivation = async () => {
  activationLoading.value = true;
  try {
    const response = await $api(
      `/v1/groups/${props.groupId}/students/bulk-activate`,
      {
        method: "POST",
        body: {
          enrollmentIds: selectedEnrollmentIds.value,
          lessonStartDate: lessonStartDate.value,
        },
      }
    );
    console.log("activation response", response);

    if (response.success) {
      showSuccess(
        response.message ||
          `${selectedEnrollmentIds.value.length} ta o'quvchi muvaffaqiyatli faollashtirildi!`
      );
      emit("activationSuccess");
      closeModal();
    }
  } catch (error) {
    console.error("Error executing activation:", error);
    showError(error.data?.message || "Faollashtiriishda xatolik yuz berdi");
  } finally {
    activationLoading.value = false;
    showConfirmDialog.value = false;
  }
};

const closeModal = () => {
  selectedEnrollmentIds.value = [];
  lessonStartDate.value = "";
  previewData.value = null;
  emit("update:modelValue", false);
};

// Watch for modal close to reset state
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) {
      selectedEnrollmentIds.value = [];
      lessonStartDate.value = "";
      previewData.value = null;
    }
  }
);
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="1200"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <VIcon icon="tabler-users-plus" class="me-2" color="primary" />
          <span>O'quvchilarni ommaviy faollashtirish</span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="closeModal"
          :disabled="activationLoading"
        />
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Date Picker -->
        <VRow class="mb-4">
          <VCol cols="12" md="6">
            <AppDateTimePicker
              v-model="lessonStartDate"
              placeholder="Dars boshlanish sanasini tanlang"
              :config="{dateFormat: 'Y-m-d'}"
              label="Dars boshlanish sanasi *"
            />
            <div class="text-caption text-medium-emphasis mt-1">
              Barcha tanlangan o'quvchilar uchun bir xil sana qo'llaniladi
            </div>
          </VCol>
        </VRow>

        <!-- Students Selection Table -->
        <VCard variant="outlined" class="mb-4">
          <VCardTitle class="text-body-1">
            O'quvchilarni tanlash
            <VChip
              v-if="selectedEnrollmentIds.length > 0"
              size="small"
              color="primary"
              class="ms-2"
            >
              {{ selectedEnrollmentIds.length }} ta tanlangan
            </VChip>
          </VCardTitle>
          <VDivider />
          <VTable density="compact">
            <thead>
              <tr>
                <th style="width: 50px">
                  <VCheckbox
                    v-model="allSelected"
                    hide-details
                    density="compact"
                  />
                </th>
                <th>ID</th>
                <th>Ism</th>
                <th>Familiya</th>
                <th>Telefon</th>
                <th>Joriy balans</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="students.length === 0">
                <td colspan="7" class="text-center py-4">
                  <div class="text-body-2 text-medium-emphasis">
                    Faollashtirish uchun o'quvchilar yo'q
                  </div>
                </td>
              </tr>
              <tr v-else v-for="student in students" :key="student.id">
                <td>
                  <VCheckbox
                    :model-value="selectedEnrollmentIds.includes(student.id)"
                    hide-details
                    density="compact"
                    @update:model-value="toggleStudent(student.id)"
                  />
                </td>
                <td>{{ student.student.id }}</td>
                <td>{{ student.student.firstName }}</td>
                <td>{{ student.student.lastName }}</td>
                <td>
                  {{ prettyPhoneNumber(student.student.user.phoneNumber) }}
                </td>
                <td>
                  <span
                    :class="{
                      'text-success': student.balance > 0,
                      'text-error': student.balance < 0,
                    }"
                  >
                    {{ prettyMoney(student.balance) }} so'm
                  </span>
                </td>
                <td>
                  <VChip
                    :color="
                      student.status === 'LEAD'
                        ? 'info'
                        : student.status === 'TRIAL'
                          ? 'warning'
                          : 'default'
                    "
                    size="small"
                    variant="tonal"
                  >
                    {{
                      student.status === "LEAD"
                        ? "Lead"
                        : student.status === "TRIAL"
                          ? "Sinov"
                          : student.status
                    }}
                  </VChip>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="closeModal"
          :disabled="activationLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          :disabled="!canActivate"
          :loading="activationLoading"
          @click="openConfirmDialog"
        >
          <VIcon icon="tabler-check" class="me-1" />
          Tanlangan o'quvchilarni faollashtirish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Confirmation Dialog -->
  <VDialog v-model="showConfirmDialog" max-width="500">
    <VCard>
      <VCardTitle class="text-h5 pt-4 px-6">
        Faollashtirishni tasdiqlash
      </VCardTitle>
      <VCardText>
        <div class="mb-2">
          Siz
          <strong>{{ selectedEnrollmentIds.length }} ta o'quvchini</strong>
          faollashtirmoqchisiz.
        </div>
        <div v-if="warningCount > 0" class="text-warning">
          <VIcon icon="tabler-alert-triangle" size="18" class="me-1" />
          <strong>{{ warningCount }} ta o'quvchining</strong> balansi manfiy
          bo'ladi.
        </div>
        <div class="mt-2">Davom etishni xohlaysizmi?</div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showConfirmDialog = false"
          :disabled="activationLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          :loading="activationLoading"
          @click="executeActivation"
        >
          Tasdiqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
