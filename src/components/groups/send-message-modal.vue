<script setup>
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";
import AppTextarea from "@/@core/components/app-form-elements/AppTextarea.vue";
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import {prettyPhoneNumber, prettyMoney} from "@/utils/utils";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  groupId: {
    type: [String, Number],
    required: true,
  },
  group: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "messageSent"]);

const {success: showSuccess, error: showError} = useToast();

// Form state
const messageForm = ref({
  message: "",
  isBulk: true,
  status: "all",
});

// Payment button state
const includePaymentButton = ref(false);
const selectedPaymentButtons = ref([]);
const customPaymentTitle = ref("");
const customPaymentAmount = ref("");
const customPaymentAmountDisplay = ref("");

// Student status options
const statusOptions = [
  {title: "Barcha o'quvchilar", value: "all"},
  {title: "Lead", value: "LEAD"},
  {title: "Sinov darsidagi", value: "TRIAL"},
  {title: "Guruhga ulanish kutilmoqda", value: "PENDING_JOIN"},
  {title: "Faol", value: "ACTIVE"},
  {title: "Qarzdorlar", value: "DEBTOR"},
];

// Students for individual selection (when isBulk is false)
const students = ref([]);
const studentsLoading = ref(false);
const studentsPagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});
const studentsSearch = ref("");
const searchTimeout = ref(null);

// Selected enrollment IDs (persisted across pages)
const selectedEnrollmentIds = ref([]);

// Sending state
const sendLoading = ref(false);

// Computed
const allSelected = computed({
  get() {
    if (students.value.length === 0) return false;
    return students.value.every((s) =>
      selectedEnrollmentIds.value.includes(s.id),
    );
  },
  set(value) {
    if (value) {
      // Add all current page students to selection
      students.value.forEach((s) => {
        if (!selectedEnrollmentIds.value.includes(s.id)) {
          selectedEnrollmentIds.value.push(s.id);
        }
      });
    } else {
      // Remove all current page students from selection
      const currentPageIds = students.value.map((s) => s.id);
      selectedEnrollmentIds.value = selectedEnrollmentIds.value.filter(
        (id) => !currentPageIds.includes(id),
      );
    }
  },
});

// Available payment buttons based on group configuration
const availablePaymentButtons = computed(() => {
  const buttons = [];
  
  if (!props.group) return buttons;
  
  // Monthly price button (always available if group has monthly price)
  if (props.group.monthlyPrice && Number(props.group.monthlyPrice) > 0) {
    buttons.push({
      type: 'monthly',
      label: `1 oyga to'lash - ${prettyMoney(props.group.monthlyPrice)} so'm`,
      amount: Number(props.group.monthlyPrice),
      value: 'monthly',
    });
  }
  
  // Trial price button (if trial payment type is PAID and trial price exists)
  if (props.group.trialPaymentType === 'PAID' && props.group.trialPrice && Number(props.group.trialPrice) > 0) {
    buttons.push({
      type: 'trial',
      label: `Sinov darsi - ${prettyMoney(props.group.trialPrice)} so'm`,
      amount: Number(props.group.trialPrice),
      value: 'trial',
    });
  }
  
  return buttons;
});

// Check if custom payment option is selected
const isCustomPaymentSelected = computed(() => {
  return selectedPaymentButtons.value.includes('custom');
});

// Check if join group button is available (group must be connected to Telegram)
const isJoinGroupAvailable = computed(() => {
  return props.group?.telegramGroupId != null;
});

const canSend = computed(() => {
  if (!messageForm.value.message.trim()) return false;
  if (!messageForm.value.isBulk && selectedEnrollmentIds.value.length === 0) {
    return false;
  }
  // Validate custom payment if selected
  if (includePaymentButton.value && isCustomPaymentSelected.value) {
    if (!customPaymentTitle.value.trim() || !customPaymentAmount.value || customPaymentAmount.value <= 0) {
      return false;
    }
  }
  // Validate at least one payment button is selected
  if (includePaymentButton.value && selectedPaymentButtons.value.length === 0) {
    return false;
  }
  return true;
});

// Format custom amount input
const formatCustomAmount = (value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    customPaymentAmount.value = 0;
    customPaymentAmountDisplay.value = "";
  } else {
    customPaymentAmount.value = number;
    customPaymentAmountDisplay.value = prettyMoney(number);
  }
};

// Methods
const toggleStudent = (enrollmentId) => {
  const index = selectedEnrollmentIds.value.indexOf(enrollmentId);
  if (index > -1) {
    selectedEnrollmentIds.value.splice(index, 1);
  } else {
    selectedEnrollmentIds.value.push(enrollmentId);
  }
};

const fetchStudents = async () => {
  studentsLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: studentsPagination.value.page.toString(),
      limit: studentsPagination.value.limit.toString(),
    });

    // Add status filter if not "all"
    if (messageForm.value.status !== "all") {
      params.append("status", messageForm.value.status);
    }

    if (studentsSearch.value.trim()) {
      params.append("search", studentsSearch.value.trim());
    }

    const response = await $api(
      `/v1/groups/${props.groupId}/students?${params.toString()}`,
      {
        method: "GET",
      },
    );

    if (response.success && response.data) {
      students.value = response.data || [];
      studentsPagination.value = {
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      };
    }
  } catch (error) {
    console.error("Error fetching students:", error);
    showError("O'quvchilar ro'yxatini yuklashda xatolik");
  } finally {
    studentsLoading.value = false;
  }
};

const onStudentsSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    studentsPagination.value.page = 1;
    fetchStudents();
  }, 500);
};

const onStudentsPageChange = (page) => {
  studentsPagination.value.page = page;
  fetchStudents();
};

const onStudentsLimitChange = (limit) => {
  studentsPagination.value.limit = limit;
  studentsPagination.value.page = 1;
  fetchStudents();
};

const onStatusChange = () => {
  // Reset pagination and selection when status changes
  studentsPagination.value.page = 1;
  selectedEnrollmentIds.value = [];
  if (!messageForm.value.isBulk) {
    fetchStudents();
  }
};

const onBulkChange = (value) => {
  if (!value) {
    // Switching to individual selection mode - fetch students
    fetchStudents();
  } else {
    // Switching to bulk mode - clear selection
    selectedEnrollmentIds.value = [];
  }
};

const sendMessage = async () => {
  if (!canSend.value) {
    showError("Iltimos, xabar matnini kiriting");
    return;
  }

  sendLoading.value = true;
  try {
    let payload;

    if (messageForm.value.isBulk) {
      // Bulk send by status
      payload = {
        message: messageForm.value.message,
        isBulk: true,
        status: messageForm.value.status,
      };
    } else {
      // Individual send by enrollment IDs
      payload = {
        message: messageForm.value.message,
        isBulk: false,
        enrollmentIds: selectedEnrollmentIds.value,
      };
    }

    // Add payment buttons if enabled
    if (includePaymentButton.value && selectedPaymentButtons.value.length > 0) {
      payload.includePaymentButton = true;
      payload.paymentButtons = [];

      // Add selected standard buttons
      for (const buttonValue of selectedPaymentButtons.value) {
        if (buttonValue === 'custom') {
          // Add custom payment button
          if (customPaymentTitle.value.trim() && customPaymentAmount.value > 0) {
            payload.paymentButtons.push({
              label: `${customPaymentTitle.value.trim()} - ${prettyMoney(customPaymentAmount.value)} so'm`,
              amount: customPaymentAmount.value,
              type: 'custom',
            });
          }
        } else if (buttonValue === 'join_group') {
          // Add join group button
          payload.paymentButtons.push({
            label: "📲 Guruhga qo'shilish",
            type: 'join_group',
          });
        } else {
          // Find the button config
          const buttonConfig = availablePaymentButtons.value.find(b => b.value === buttonValue);
          if (buttonConfig) {
            payload.paymentButtons.push({
              label: buttonConfig.label,
              amount: buttonConfig.amount,
              type: buttonConfig.type,
            });
          }
        }
      }
    }

    const response = await $api(`/v1/groups/${props.groupId}/send-message`, {
      method: "POST",
      body: payload,
    });

    if (response.success) {
      showSuccess(response.message || "Xabar muvaffaqiyatli yuborildi!");
      emit("messageSent");
      closeModal();
    }
  } catch (error) {
    console.error("Error sending message:", error);
    showError(error.data?.message || "Xabar yuborishda xatolik yuz berdi");
  } finally {
    sendLoading.value = false;
  }
};

const closeModal = () => {
  messageForm.value = {
    message: "",
    isBulk: true,
    status: "all",
  };
  selectedEnrollmentIds.value = [];
  students.value = [];
  studentsSearch.value = "";
  studentsPagination.value = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };
  // Reset payment state
  includePaymentButton.value = false;
  selectedPaymentButtons.value = [];
  customPaymentTitle.value = "";
  customPaymentAmount.value = "";
  customPaymentAmountDisplay.value = "";
  emit("update:modelValue", false);
};

// Get student status config
const getStudentStatusConfig = (status) => {
  switch (status) {
    case "LEAD":
      return {color: "info", text: "Lead"};
    case "TRIAL":
      return {color: "warning", text: "Sinov"};
    case "PENDING_JOIN":
      return {color: "info", text: "Guruhga ulanish kutilmoqda"};
    case "ACTIVE":
      return {color: "success", text: "Faol"};
    case "FROZEN":
      return {color: "warning", text: "Muzlatilgan"};
    case "EXPELLED":
      return {color: "error", text: "Chiqarilgan"};
    case "COMPLETED":
      return {color: "primary", text: "Tugatgan"};
    case "DROPPED":
      return {color: "secondary", text: "Tashlab ketgan"};
    default:
      return {color: "default", text: status};
  }
};

// Watch for modal open
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) {
      // Reset state when modal closes
      messageForm.value = {
        message: "",
        isBulk: true,
        status: "all",
      };
      selectedEnrollmentIds.value = [];
      students.value = [];
      studentsSearch.value = "";
      // Reset payment state
      includePaymentButton.value = false;
      selectedPaymentButtons.value = [];
      customPaymentTitle.value = "";
      customPaymentAmount.value = "";
      customPaymentAmountDisplay.value = "";
    }
  },
);
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="900"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <VIcon icon="tabler-send" class="me-2" color="primary" />
          <span>Xabar yuborish</span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="closeModal"
          :disabled="sendLoading"
        />
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Message Input -->
        <VRow class="mb-4">
          <VCol cols="12">
            <AppTextarea
              v-model="messageForm.message"
              label="Xabar matni *"
              placeholder="Assalomu alaykum! Ertaga dars bo'lmaydi."
              rows="4"
            />
          </VCol>
        </VRow>

        <!-- Student Type Selection -->
        <VRow class="mb-4">
          <VCol cols="12" md="6">
            <VSelect
              v-model="messageForm.status"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              label="O'quvchi turi"
              @update:model-value="onStatusChange"
            />
          </VCol>
          <VCol cols="12" md="6" class="d-flex align-center">
            <VSwitch
              v-model="messageForm.isBulk"
              label="Ommaviy yuborish"
              color="primary"
              hide-details
              @update:model-value="onBulkChange"
            />
            <VTooltip location="top">
              <template #activator="{props}">
                <VIcon
                  v-bind="props"
                  icon="tabler-info-circle"
                  size="18"
                  class="ms-2 text-medium-emphasis"
                />
              </template>
              <span
                >Yoqilganda tanlangan turdagi barcha o'quvchilarga
                yuboriladi</span
              >
            </VTooltip>
          </VCol>
        </VRow>

        <!-- Payment Button Section -->
        <VCard variant="outlined" class="mb-4">
          <VCardText>
            <VRow>
              <VCol cols="12">
                <VSwitch
                  v-model="includePaymentButton"
                  label="To'lov tugmasi bilan yuborish"
                  color="success"
                  hide-details
                />
                <div class="text-caption text-medium-emphasis mt-1">
                  Xabar bilan birga to'lov tugmasi ham yuboriladi
                </div>
              </VCol>
            </VRow>

            <!-- Payment Button Options -->
            <VExpandTransition>
              <VRow v-if="includePaymentButton" class="mt-2">
                <VCol cols="12">
                  <div class="text-subtitle-2 mb-2">To'lov tugmalari:</div>
                  
                  <!-- Standard Payment Buttons -->
                  <VCheckbox
                    v-for="button in availablePaymentButtons"
                    :key="button.value"
                    v-model="selectedPaymentButtons"
                    :label="button.label"
                    :value="button.value"
                    hide-details
                    density="compact"
                    class="mb-1"
                  />
                  
                  <!-- Join Group Button Option -->
                  <VCheckbox
                    v-if="isJoinGroupAvailable"
                    v-model="selectedPaymentButtons"
                    label="📲 Guruhga qo'shilish (bir martalik havola)"
                    value="join_group"
                    hide-details
                    density="compact"
                    class="mb-1"
                  />
                  
                  <!-- Custom Payment Button Option -->
                  <VCheckbox
                    v-model="selectedPaymentButtons"
                    label="Boshqa summa (qo'lda kiritish)"
                    value="custom"
                    hide-details
                    density="compact"
                    class="mb-2"
                  />

                  <!-- Custom Payment Form -->
                  <VExpandTransition>
                    <VRow v-if="isCustomPaymentSelected" class="mt-2">
                      <VCol cols="12" md="6">
                        <AppTextField
                          v-model="customPaymentTitle"
                          label="Tugma nomi"
                          placeholder="Masalan: Qisman to'lash"
                        />
                      </VCol>
                      <VCol cols="12" md="6">
                        <AppTextField
                          v-model="customPaymentAmountDisplay"
                          label="Summa"
                          placeholder="50 000"
                          @input="formatCustomAmount($event.target.value)"
                        >
                          <template #append-inner>
                            <span class="text-body-2 text-medium-emphasis">so'm</span>
                          </template>
                        </AppTextField>
                      </VCol>
                    </VRow>
                  </VExpandTransition>

                  <!-- Preview of how button will look -->
                  <VAlert
                    v-if="selectedPaymentButtons.length > 0"
                    type="info"
                    variant="tonal"
                    density="compact"
                    class="mt-3"
                  >
                    <div class="text-caption">Tugma ko'rinishi:</div>
                    <div class="d-flex flex-wrap gap-2 mt-1">
                      <VChip
                        v-for="buttonValue in selectedPaymentButtons"
                        :key="buttonValue"
                        size="small"
                        color="primary"
                        variant="tonal"
                      >
                        <template v-if="buttonValue === 'custom' && customPaymentTitle">
                          {{ customPaymentTitle }} - {{ prettyMoney(customPaymentAmount || 0) }} so'm
                        </template>
                        <template v-else-if="buttonValue === 'custom'">
                          Boshqa summa
                        </template>
                        <template v-else-if="buttonValue === 'join_group'">
                          📲 Guruhga qo'shilish
                        </template>
                        <template v-else>
                          {{ availablePaymentButtons.find(b => b.value === buttonValue)?.label }}
                        </template>
                      </VChip>
                    </div>
                  </VAlert>
                </VCol>
              </VRow>
            </VExpandTransition>
          </VCardText>
        </VCard>

        <!-- Info Alert for Bulk Mode -->
        <VAlert
          v-if="messageForm.isBulk"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <VIcon icon="tabler-info-circle" size="18" class="me-1" />
          {{
            messageForm.status === "all"
              ? "Barcha o'quvchilarga xabar yuboriladi"
              : `Barcha ${statusOptions.find((s) => s.value === messageForm.status)?.title} o'quvchilariga xabar yuboriladi`
          }}
        </VAlert>

        <!-- Individual Selection Mode -->
        <template v-if="!messageForm.isBulk">
          <!-- Search -->
          <VRow class="mb-4">
            <VCol cols="12" md="6">
              <AppTextField
                v-model="studentsSearch"
                placeholder="O'quvchi nomi bo'yicha qidirish..."
                @input="onStudentsSearch"
              >
                <template #prepend-inner>
                  <VIcon icon="tabler-search" />
                </template>
              </AppTextField>
            </VCol>
            <VCol cols="12" md="6" class="d-flex align-center justify-end">
              <VChip
                v-if="selectedEnrollmentIds.length > 0"
                color="primary"
                variant="tonal"
              >
                {{ selectedEnrollmentIds.length }} ta tanlangan
              </VChip>
            </VCol>
          </VRow>

          <!-- Students Selection Table -->
          <VCard variant="outlined" class="mb-4">
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="studentsLoading">
                  <td colspan="6" class="text-center py-4">
                    <VProgressCircular indeterminate color="primary" />
                  </td>
                </tr>
                <tr v-else-if="students.length === 0">
                  <td colspan="6" class="text-center py-4">
                    <div class="text-body-2 text-medium-emphasis">
                      O'quvchilar topilmadi
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
                    <VChip
                      :color="getStudentStatusConfig(student.status).color"
                      size="small"
                      variant="tonal"
                    >
                      {{ getStudentStatusConfig(student.status).text }}
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>

            <!-- Pagination -->
            <VCardText v-if="studentsPagination.totalPages > 1">
              <VRow class="align-center">
                <VCol cols="12" md="6">
                  <div class="d-flex align-center gap-2">
                    <span class="text-body-2">Sahifada:</span>
                    <VSelect
                      :model-value="studentsPagination.limit"
                      :items="[10, 20, 50, 100]"
                      density="compact"
                      variant="outlined"
                      style="max-width: 100px"
                      @update:model-value="onStudentsLimitChange"
                    />
                  </div>
                </VCol>
                <VCol cols="12" md="6" class="d-flex justify-end">
                  <VPagination
                    :model-value="studentsPagination.page"
                    :length="studentsPagination.totalPages"
                    :total-visible="5"
                    @update:model-value="onStudentsPageChange"
                  />
                </VCol>
              </VRow>
              <div class="text-body-2 text-center mt-2">
                Jami: {{ studentsPagination.total }} ta o'quvchi
              </div>
            </VCardText>
          </VCard>
        </template>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="closeModal"
          :disabled="sendLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          :disabled="!canSend"
          :loading="sendLoading"
          @click="sendMessage"
        >
          <VIcon icon="tabler-send" class="me-1" />
          Xabar yuborish
          <VChip
            v-if="!messageForm.isBulk && selectedEnrollmentIds.length > 0"
            size="x-small"
            color="white"
            text-color="primary"
            class="ms-2"
          >
            {{ selectedEnrollmentIds.length }}
          </VChip>
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
