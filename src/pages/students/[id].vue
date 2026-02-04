<script setup>
import {useStudentPage} from "@/composables/useStudentPage";
import {prettyMoney, prettyPhoneNumber} from "@/utils/utils";
import StudentMessageModal from "@/components/groups/student-message-modal.vue";
import {
  StudentGroupsTab,
  StudentPaymentsTab,
  StudentLogsTab,
  StudentAddBalanceModal,
  StudentDiscountModal,
  StudentActivationModal,
  StudentExpelModal,
  StudentPaymentEditModal,
  StudentPaymentDeleteModal,
  StudentReceiptModal,
} from "@/components/students";

definePage({
  meta: {
    layout: "default",
  },
});

const route = useRoute();
const studentId = computed(() => route.params.id);

// Use the composable for all data and actions
const {
  loading,
  student,
  groups,
  balanceSummary,
  payments,
  statusLogs,
  refreshAll,
  addBalance,
  setDiscount,
  expelStudent,
  activateStudent,
  getActivationPreview,
  editPayment,
  deletePayment,
} = useStudentPage(studentId);

// Active tab
const activeTab = ref("groups");

// Modal loading states
const balanceLoading = ref(false);
const discountLoading = ref(false);
const expelLoading = ref(false);
const activationLoading = ref(false);
const editPaymentLoading = ref(false);
const deletePaymentLoading = ref(false);

// Modal visibility states
const showAddBalanceModal = ref(false);
const showDiscountModal = ref(false);
const showExpelModal = ref(false);
const showActivationModal = ref(false);
const showEditPaymentModal = ref(false);
const showDeletePaymentModal = ref(false);
const showReceiptModal = ref(false);
const showStudentMessageModal = ref(false);

// Selected items for modals
const selectedEnrollment = ref(null);
const selectedMessageEnrollment = ref(null);
const selectedPayment = ref(null);
const activationPreview = ref(null);
const selectedReceiptUrl = ref("");

// Format date helper
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ru-RU");
};

// Message modal handler
const openMessageModal = (enrollment) => {
  const studentData = {
    id: enrollment.student?.id || student.value.id,
    firstName: student.value?.firstName,
    lastName: student.value?.lastName,
    user: {
      firstName: student.value?.firstName,
      lastName: student.value?.lastName,
      telegramUser: student.value?.telegramUsername
        ? {username: student.value.telegramUsername}
        : null,
    },
  };
  selectedMessageEnrollment.value = {
    id: enrollment.enrollmentId,
    student: studentData,
  };
  showStudentMessageModal.value = true;
};

// Add Balance handlers
const openAddBalanceModal = (enrollment) => {
  selectedEnrollment.value = enrollment;
  showAddBalanceModal.value = true;
};

const onBalanceSubmit = async (data) => {
  balanceLoading.value = true;
  const success = await addBalance(selectedEnrollment.value.enrollmentId, data);
  balanceLoading.value = false;
  if (success) {
    showAddBalanceModal.value = false;
  }
};

// Discount handlers
const openDiscountModal = (enrollment) => {
  selectedEnrollment.value = enrollment;
  showDiscountModal.value = true;
};

const onDiscountSubmit = async (data) => {
  discountLoading.value = true;
  const success = await setDiscount(selectedEnrollment.value.enrollmentId, data);
  discountLoading.value = false;
  if (success) {
    showDiscountModal.value = false;
  }
};

// Expel handlers
const openExpelModal = (enrollment) => {
  selectedEnrollment.value = enrollment;
  showExpelModal.value = true;
};

const onExpelSubmit = async (reason) => {
  expelLoading.value = true;
  const success = await expelStudent(selectedEnrollment.value.enrollmentId, reason);
  expelLoading.value = false;
  if (success) {
    showExpelModal.value = false;
  }
};

// Activation handlers
const openActivationModal = async (enrollment) => {
  selectedEnrollment.value = enrollment;
  activationPreview.value = null;
  showActivationModal.value = true;
};

const onActivationDateChange = async (date) => {
  if (!date || !selectedEnrollment.value) return;
  activationPreview.value = await getActivationPreview(
    selectedEnrollment.value.enrollmentId,
    date
  );
};

const onActivationSubmit = async (lessonStartDate) => {
  activationLoading.value = true;
  const success = await activateStudent(selectedEnrollment.value.enrollmentId, lessonStartDate);
  activationLoading.value = false;
  if (success) {
    showActivationModal.value = false;
  }
};

// Payment handlers
const openEditPaymentModal = (payment) => {
  selectedPayment.value = payment;
  showEditPaymentModal.value = true;
};

const onEditPaymentSubmit = async (data) => {
  editPaymentLoading.value = true;
  const success = await editPayment(selectedPayment.value.id, data);
  editPaymentLoading.value = false;
  if (success) {
    showEditPaymentModal.value = false;
  }
};

const openDeletePaymentModal = (payment) => {
  selectedPayment.value = payment;
  showDeletePaymentModal.value = true;
};

const onDeletePaymentSubmit = async () => {
  deletePaymentLoading.value = true;
  const success = await deletePayment(selectedPayment.value.id);
  deletePaymentLoading.value = false;
  if (success) {
    showDeletePaymentModal.value = false;
  }
};

const openReceiptModal = (url) => {
  selectedReceiptUrl.value = url;
  showReceiptModal.value = true;
};

// Load data on mount
onMounted(() => {
  refreshAll();
});
</script>

<template>
  <div>
    <!-- Header Card -->
    <VRow>
      <VCol cols="12">
        <VCard class="mb-4">
          <VCardText class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VAvatar size="64" color="primary" variant="tonal" class="me-4">
                <VIcon icon="tabler-user" size="32" />
              </VAvatar>
              <div>
                <h2 class="text-h4 mb-1">
                  {{ student?.firstName }} {{ student?.lastName }}
                </h2>
                <div class="d-flex gap-2 text-body-1 text-medium-emphasis">
                  <div v-if="student?.phoneNumber" class="d-flex align-center">
                    <VIcon icon="tabler-phone" size="16" class="me-1" />
                    {{ prettyPhoneNumber(student?.phoneNumber) }}
                  </div>
                  <div
                    v-if="student?.telegramUsername"
                    class="d-flex align-center"
                  >
                    <VIcon
                      icon="tabler-brand-telegram"
                      size="16"
                      class="me-1"
                    />
                    <a
                      :href="`https://t.me/${student?.telegramUsername}`"
                      target="_blank"
                    >@{{ student?.telegramUsername }}</a>
                  </div>
                </div>
              </div>
            </div>
            <div class="text-end">
              <div class="mt-2 text-caption">ID: {{ student?.id }}</div>
              <div class="text-caption">
                Ro'yxatdan o'tgan: {{ formatDate(student?.createdAt) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Stats Cards -->
    <VRow class="mb-4">
      <VCol cols="12" md="4">
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="d-flex align-center gap-1">
                  <div class="text-caption">Umumiy Balans</div>
                  <VTooltip location="top">
                    <template #activator="{ props }">
                      <VIcon
                        v-bind="props"
                        icon="tabler-info-circle"
                        size="16"
                        color="medium-emphasis"
                      />
                    </template>
                    <span>Faol va sinov darsi uchun</span>
                  </VTooltip>
                </div>
                <div
                  :class="`text-h4 ${balanceSummary?.totalBalance < 0 ? 'text-error' : 'text-success'}`"
                >
                  {{ prettyMoney(balanceSummary?.totalBalance || 0) }} UZS
                </div>
              </div>
              <VIcon icon="tabler-wallet" size="32" color="primary" />
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption">Faol Guruhlar</div>
                <div class="text-h4">
                  {{ balanceSummary?.activeEnrollments || 0 }}
                </div>
              </div>
              <VIcon icon="tabler-users-group" size="32" color="info" />
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption">Qarzdorlik</div>
                <div class="text-h4 text-error">
                  {{ prettyMoney(balanceSummary?.totalDebtAmount || 0) }} UZS
                </div>
              </div>
              <VIcon icon="tabler-trending-down" size="32" color="error" />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Main Content Card -->
    <VCard>
      <VTabs v-model="activeTab">
        <VTab value="groups">Guruhlar</VTab>
        <VTab value="payments">To'lovlar</VTab>
        <VTab value="logs">Tarix</VTab>
      </VTabs>

      <VWindow v-model="activeTab">
        <!-- Groups Tab -->
        <VWindowItem value="groups">
          <StudentGroupsTab
            :groups="groups"
            :student="student"
            @activate="openActivationModal"
            @discount="openDiscountModal"
            @add-balance="openAddBalanceModal"
            @message="openMessageModal"
            @expel="openExpelModal"
          />
        </VWindowItem>

        <!-- Payments Tab -->
        <VWindowItem value="payments">
          <StudentPaymentsTab
            :payments="payments"
            @view-receipt="openReceiptModal"
            @edit="openEditPaymentModal"
            @delete="openDeletePaymentModal"
          />
        </VWindowItem>

        <!-- Logs Tab -->
        <VWindowItem value="logs">
          <StudentLogsTab :logs="statusLogs" />
        </VWindowItem>
      </VWindow>
    </VCard>

    <!-- Modals -->
    <StudentAddBalanceModal
      v-model="showAddBalanceModal"
      :enrollment="selectedEnrollment"
      :loading="balanceLoading"
      @submit="onBalanceSubmit"
    />

    <StudentDiscountModal
      v-model="showDiscountModal"
      :enrollment="selectedEnrollment"
      :loading="discountLoading"
      @submit="onDiscountSubmit"
    />

    <StudentExpelModal
      v-model="showExpelModal"
      :enrollment="selectedEnrollment"
      :loading="expelLoading"
      @submit="onExpelSubmit"
    />

    <StudentActivationModal
      v-model="showActivationModal"
      :enrollment="selectedEnrollment"
      :loading="activationLoading"
      :preview="activationPreview"
      @update:preview="onActivationDateChange"
      @submit="onActivationSubmit"
    />

    <StudentPaymentEditModal
      v-model="showEditPaymentModal"
      :payment="selectedPayment"
      :loading="editPaymentLoading"
      @submit="onEditPaymentSubmit"
    />

    <StudentPaymentDeleteModal
      v-model="showDeletePaymentModal"
      :payment="selectedPayment"
      :loading="deletePaymentLoading"
      @submit="onDeletePaymentSubmit"
    />

    <StudentReceiptModal
      v-model="showReceiptModal"
      :url="selectedReceiptUrl"
    />

    <StudentMessageModal
      v-if="selectedMessageEnrollment"
      v-model="showStudentMessageModal"
      :enrollment="selectedMessageEnrollment"
    />
  </div>
</template>
