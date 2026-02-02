<script setup>
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import {prettyMoney, prettyPhoneNumber} from "@/utils/utils";
import StudentMessageModal from "@/components/groups/student-message-modal.vue";
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";
import AppTextarea from "@/@core/components/app-form-elements/AppTextarea.vue";
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";

const route = useRoute();
const router = useRouter();
const {success: showSuccess, error: showError} = useToast();

const studentId = computed(() => route.params.id);
const loading = ref(false);
const student = ref(null);
const activeTab = ref("groups"); // groups, payments, logs

// Data states
const groups = ref([]);
const groupsLoading = ref(false);
const balanceSummary = ref(null);
const balanceSummaryLoading = ref(false);
const payments = ref([]);
const paymentsLoading = ref(false);
const statusLogs = ref([]);
const statusLogsLoading = ref(false);

// Modals State
const showStudentMessageModal = ref(false);
const selectedMessageEnrollment = ref(null);

// Add Balance Modal
const showAddBalanceModal = ref(false);
const selectedBalanceEnrollment = ref(null);
const balanceForm = ref({amount: 0, amountDisplay: "", notes: ""});
const balanceLoading = ref(false);

// Discount Modal
const showDiscountModal = ref(false);
const selectedDiscountEnrollment = ref(null);
const discountForm = ref({
  customMonthlyPrice: 0,
  customMonthlyPriceDisplay: "",
  discountStartDate: "",
  discountEndDate: "",
  discountReason: "",
});
const discountLoading = ref(false);

// Activation (Single)
const showActivationModal = ref(false);
const selectedActivationEnrollment = ref(null);
const activationForm = ref({lessonStartDate: ""});
const activationLoading = ref(false);
const activationPreview = ref(null);

// Expel Modal
const showExpelModal = ref(false);
const selectedExpelEnrollment = ref(null);
const expelForm = ref({reason: ""});
const expelLoading = ref(false);

// Edit Payment Modal
const showEditPaymentModal = ref(false);
const selectedPayment = ref(null);
const editPaymentForm = ref({
  amount: 0,
  amountDisplay: "",
  notes: "",
  paymentMethod: "",
  paidAt: "",
});
const editPaymentLoading = ref(false);

// Delete Payment Modal
const showDeletePaymentModal = ref(false);
const deletePaymentLoading = ref(false);

// Receipt Modal
const showReceiptModal = ref(false);
const selectedReceiptUrl = ref("");

// -- Data Fetching --

const fetchStudent = async () => {
  loading.value = true;
  try {
    const res = await $api(`/v1/students/${studentId.value}`);
    if (res.success) {
      student.value = res.data?.data;
    }
  } catch (err) {
    showError(err.data?.message || "Error fetching student");
  } finally {
    loading.value = false;
  }
};

const fetchGroups = async () => {
  groupsLoading.value = true;
  try {
    const res = await $api(`/v1/students/${studentId.value}/groups`);
    if (res.success) {
      groups.value = res.data?.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    groupsLoading.value = false;
  }
};

const fetchBalanceSummary = async () => {
  balanceSummaryLoading.value = true;
  try {
    const res = await $api(`/v1/students/${studentId.value}/balance-summary`);
    console.log(res);
    if (res.success) {
      balanceSummary.value = res?.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    balanceSummaryLoading.value = false;
  }
};

const fetchPayments = async () => {
  paymentsLoading.value = true;
  try {
    const res = await $api(`/v1/students/${studentId.value}/payments`);
    if (res.success) {
      payments.value = res.data?.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    paymentsLoading.value = false;
  }
};

const fetchStatusLogs = async () => {
  statusLogsLoading.value = true;
  try {
    const res = await $api(`/v1/students/${studentId.value}/status-logs`);
    if (res.success) {
      statusLogs.value = res.data?.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    statusLogsLoading.value = false;
  }
};

const refreshAll = () => {
  fetchStudent();
  fetchGroups();
  fetchBalanceSummary();
  fetchPayments();
  fetchStatusLogs();
};

onMounted(() => {
  refreshAll();
});

// -- Formatting helpers --
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ru-RU");
};

const formatStatus = (status) => {
  const map = {
    ACTIVE: {color: "success", text: "Faol", icon: "tabler-check"},
    TRIAL: {color: "info", text: "Sinov", icon: "tabler-clock"},
    PENDING_JOIN: {
      color: "info",
      text: "Guruhga ulanish kutilmoqda",
      icon: "tabler-clock",
    },
    LEAD: {color: "warning", text: "Lid", icon: "tabler-user-plus"},
    FROZEN: {color: "secondary", text: "Muzlatilgan", icon: "tabler-snowflake"},
    EXPELLED: {color: "error", text: "Chetlatilgan", icon: "tabler-ban"},
    COMPLETED: {color: "success", text: "Tamomlagan", icon: "tabler-school"},
    LEFT_GROUP: {
      color: "error",
      text: "Guruhdan chiqib ketgan",
      icon: "tabler-door-exit",
    },
    DROPPED: {color: "error", text: "Tashlab ketgan", icon: "tabler-archive"},
  };
  return map[status] || {color: "default", text: status};
};

// -- Actions --

// Message
const openMessageModal = (enrollment) => {
  // Construct a student object compatible with the modal
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
  // The modal expects enrollment object with enrollment.student inside
  selectedMessageEnrollment.value = {
    id: enrollment.enrollmentId,
    student: studentData,
  };
  showStudentMessageModal.value = true;
};

// Add Balance
const openAddBalanceModal = (enrollment) => {
  selectedBalanceEnrollment.value = enrollment;
  balanceForm.value = {amount: 0, amountDisplay: "", notes: ""};
  showAddBalanceModal.value = true;
};

const onBalanceSubmit = async () => {
  if (!balanceForm.value.amount || balanceForm.value.amount <= 0) {
    showError("Summani kiriting");
    return;
  }
  balanceLoading.value = true;
  try {
    const res = await $api(
      `/v1/enrollments/${selectedBalanceEnrollment.value.enrollmentId}/add-balance`,
      {
        method: "POST",
        body: {
          amount: balanceForm.value.amount,
          notes: balanceForm.value.notes,
        },
      },
    );
    if (res.success) {
      showSuccess("Balans to'ldirildi");
      showAddBalanceModal.value = false;
      refreshAll();
    } else {
      showError(res.message);
    }
  } catch (e) {
    showError(e.data?.message || "Xatolik");
  } finally {
    balanceLoading.value = false;
  }
};

// Discount
const openDiscountModal = (enrollment) => {
  selectedDiscountEnrollment.value = enrollment;
  discountForm.value = {
    customMonthlyPrice: enrollment.customMonthlyPrice || 0,
    customMonthlyPriceDisplay: enrollment.customMonthlyPrice
      ? prettyMoney(enrollment.customMonthlyPrice)
      : "",
    discountStartDate: "",
    discountEndDate: "",
    discountReason: enrollment.discountReason || "",
  };
  showDiscountModal.value = true;
};

const onDiscountSubmit = async () => {
  discountLoading.value = true;
  try {
    const res = await $api(
      `/v1/enrollments/${selectedDiscountEnrollment.value.enrollmentId}/discount`,
      {
        method: "PATCH",
        body: {
          customMonthlyPrice: discountForm.value.customMonthlyPrice,
          discountStartDate: discountForm.value.discountStartDate || null,
          discountEndDate: discountForm.value.discountEndDate || null,
          discountReason: discountForm.value.discountReason,
        },
      },
    );
    if (res.success) {
      showSuccess("Chegirma belgilandi");
      showDiscountModal.value = false;
      fetchGroups();
    } else {
      showError(res.message);
    }
  } catch (e) {
    showError(e.data?.message || "Xatolik");
  } finally {
    discountLoading.value = false;
  }
};

// Expel
const openExpelModal = (enrollment) => {
  selectedExpelEnrollment.value = enrollment;
  expelForm.value = {reason: ""};
  showExpelModal.value = true;
};

const onExpelSubmit = async () => {
  expelLoading.value = true;
  try {
    const res = await $api(
      `/v1/enrollments/${selectedExpelEnrollment.value.enrollmentId}/expel`,
      {
        method: "PATCH",
        body: {reason: expelForm.value.reason},
      },
    );
    if (res.success) {
      showSuccess("Guruhdan chetlatildi");
      showExpelModal.value = false;
      refreshAll();
    } else {
      showError(res.message);
    }
  } catch (e) {
    showError(e.data?.message || "Xatolik");
  } finally {
    expelLoading.value = false;
  }
};

// Activate (Single)
const openActivationModal = (enrollment) => {
  selectedActivationEnrollment.value = enrollment;
  activationForm.value = {
    lessonStartDate: new Date().toISOString().split("T")[0],
  };
  showActivationModal.value = true;
  updateActivationPreview();
};

const updateActivationPreview = async () => {
  if (!activationForm.value.lessonStartDate) return;
  try {
    const res = await $api(
      `/v1/enrollments/${selectedActivationEnrollment.value.enrollmentId}/activation-preview?lessonStartDate=${activationForm.value.lessonStartDate}`,
    );
    if (res.success) {
      activationPreview.value = res.data;
    }
  } catch (e) {
    console.error(e);
  }
};

const onActivationSubmit = async () => {
  activationLoading.value = true;
  try {
    const res = await $api(
      `/v1/enrollments/${selectedActivationEnrollment.value.enrollmentId}/activate`,
      {
        method: "PATCH",
        body: {lessonStartDate: activationForm.value.lessonStartDate},
      },
    );
    if (res.success) {
      showSuccess("O'quvchi faollashtirildi");
      showActivationModal.value = false;
      refreshAll();
    } else {
      showError(res.message);
    }
  } catch (e) {
    showError(e.data?.message || "Xatolik");
  } finally {
    activationLoading.value = false;
  }
};

// Edit Payment
const openEditPaymentModal = (payment) => {
  selectedPayment.value = payment;
  const amount = parseFloat(payment.amount);
  editPaymentForm.value = {
    amount: amount,
    amountDisplay: prettyMoney(amount),
    notes: payment.notes || "",
    paymentMethod: payment.paymentMethod || "CASH",
    paidAt: payment.paidAt ? new Date(payment.paidAt).toISOString().split('T')[0] : "",
  };
  showEditPaymentModal.value = true;
};

const onEditPaymentSubmit = async () => {
  editPaymentLoading.value = true;
  try {
    const res = await $api(`/v1/payments/${selectedPayment.value.id}`, {
      method: "PATCH",
      body: {
        amount: editPaymentForm.value.amount,
      },
    });
    if (res.success) {
      showSuccess("To'lov tahrirlandi");
      showEditPaymentModal.value = false;
      refreshAll();
    } else {
      showError(res.message);
    }
  } catch (e) {
    showError(e.data?.message || "Xatolik");
  } finally {
    editPaymentLoading.value = false;
  }
};

// Delete Payment
const openDeletePaymentModal = (payment) => {
  selectedPayment.value = payment;
  showDeletePaymentModal.value = true;
};

const onDeletePaymentSubmit = async () => {
  deletePaymentLoading.value = true;
  try {
    const res = await $api(`/v1/payments/${selectedPayment.value.id}`, {
      method: "DELETE",
    });
    if (res.success) {
      showSuccess("To'lov o'chirildi");
      showDeletePaymentModal.value = false;
      refreshAll();
    } else {
      showError(res.message);
    }
  } catch (e) {
    showError(e.data?.message || "Xatolik");
  } finally {
    deletePaymentLoading.value = false;
  }
};

const openReceiptModal = (url) => {
  selectedReceiptUrl.value = url;
  showReceiptModal.value = true;
};

// Helper for masking money input
const onMoneyInput = (val, form, key, displayKey) => {
  // Handle both ref and object
  const target = form.value ? form.value : form;
  
  if (!val) {
    target[key] = 0;
    target[displayKey] = "";
    return;
  }
  // Allow digits and dots, remove spaces
  const cleanVal = val.toString().replace(/[^\d.]/g, "");
  const num = parseFloat(cleanVal || "0");
  
  target[key] = num;
  target[displayKey] = prettyMoney(num);
};
</script>

<template>
  <div>
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
                      >@{{ student?.telegramUsername }}</a
                    >
                  </div>
                </div>
              </div>
            </div>
            <div class="text-end">
              <!-- <VChip :color="student?.isActive ? 'success' : 'error'">
                {{ student?.isActive ? "Faol o'quvchi" : "Nofaol" }}
              </VChip> -->
              <div class="mt-2 text-caption">ID: {{ student?.id }}</div>
              <div class="text-caption">
                Ro'yxatdan o'tgan: {{ formatDate(student?.createdAt) }}
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mb-4">
      <VCol cols="12" md="4">
        <VCard>
          <VCardText>
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption">Umumiy Balans</div>
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

    <VCard>
      <VTabs v-model="activeTab">
        <VTab value="groups">Guruhlar</VTab>
        <VTab value="payments">To'lovlar</VTab>
        <VTab value="logs">Tarix</VTab>
      </VTabs>

      <VWindow v-model="activeTab">
        <!-- Groups Tab -->
        <VWindowItem value="groups">
          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th>Guruh</th>
                <th>Status</th>
                <th>Balans</th>
                <th>Narx</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in groups" :key="item.enrollmentId">
                <td>
                  <div class="font-weight-medium">{{ item.groupName }}</div>
                  <div class="text-caption">
                    {{ formatDate(item.courseStartDate) }} -
                    {{ formatDate(item.courseEndDate) }}
                  </div>
                </td>
                <td>
                  <VChip v-bind="formatStatus(item.status)" size="small" />
                </td>
                <td>
                  <div
                    :class="item.balance < 0 ? 'text-error' : 'text-success'"
                  >
                    {{ prettyMoney(item.balance) }} UZS
                  </div>
                </td>
                <td>
                  <div>{{ prettyMoney(item.effectiveMonthlyPrice) }} UZS</div>
                  <div
                    v-if="item.customMonthlyPrice"
                    class="text-caption text-primary"
                  >
                    Maxsus narx
                  </div>
                </td>
                <td>
                  <VBtn icon variant="text" size="small" color="default">
                    <VIcon icon="tabler-dots-vertical" />
                    <VMenu activator="parent">
                      <VList>
                        <VListItem
                          v-if="['LEAD', 'TRIAL'].includes(item.status)"
                          @click="openActivationModal(item)"
                        >
                          <template #prepend
                            ><VIcon icon="tabler-check" size="20"
                          /></template>
                          <VListItemTitle>Faollashtirish</VListItemTitle>
                        </VListItem>
                        <VListItem @click="openDiscountModal(item)">
                          <template #prepend
                            ><VIcon icon="tabler-percentage" size="20"
                          /></template>
                          <VListItemTitle>Chegirma belgilash</VListItemTitle>
                        </VListItem>
                        <VListItem @click="openAddBalanceModal(item)">
                          <template #prepend
                            ><VIcon icon="tabler-plus" size="20"
                          /></template>
                          <VListItemTitle>To'lov qo'shish</VListItemTitle>
                        </VListItem>
                        <VListItem @click="openMessageModal(item)">
                          <template #prepend
                            ><VIcon icon="tabler-brand-telegram" size="20"
                          /></template>
                          <VListItemTitle>Xabar yuborish</VListItemTitle>
                        </VListItem>
                        <VDivider />
                        <VListItem
                          class="text-error"
                          @click="openExpelModal(item)"
                        >
                          <template #prepend
                            ><VIcon icon="tabler-ban" size="20"
                          /></template>
                          <VListItemTitle>Guruhdan chetlatish</VListItemTitle>
                        </VListItem>
                      </VList>
                    </VMenu>
                  </VBtn>
                </td>
              </tr>
              <tr v-if="groups.length === 0">
                <td colspan="5" class="text-center py-4 text-disabled">
                  Guruhlar mavjud emas
                </td>
              </tr>
            </tbody>
          </VTable>
        </VWindowItem>

        <!-- Payments Tab -->
        <VWindowItem value="payments">
          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th>Guruh</th>
                <th>Summa</th>
                <th>Sana</th>
                <th>Amal turi</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in payments" :key="p.id">
                <td>{{ p.groupName }}</td>
                <td class="text-success font-weight-bold">
                  +{{ prettyMoney(p.amount) }} {{ p.currency }}
                </td>
                <td>{{ formatDate(p.createdAt) }}</td>
                <td>
                  <VChip size="small" color="success" variant="tonal"
                    >To'lov</VChip
                  >
                </td>
                <td>
                  <div class="d-flex gap-2">
                    <VBtn
                      icon
                      variant="text"
                      size="small"
                      :color="p.receiptUrl ? 'info' : 'secondary'"
                      :disabled="!p.receiptUrl"
                      @click="openReceiptModal(p.receiptUrl)"
                      title="Chekni ko'rish"
                    >
                      <VIcon icon="tabler-eye" size="20" />
                    </VBtn>
                    <VBtn
                      icon
                      variant="text"
                      size="small"
                      color="primary"
                      @click="openEditPaymentModal(p)"
                      title="Tahrirlash"
                    >
                      <VIcon icon="tabler-edit" size="20" />
                    </VBtn>
                    <VBtn
                      icon
                      variant="text"
                      size="small"
                      color="error"
                      @click="openDeletePaymentModal(p)"
                      title="O'chirish"
                    >
                      <VIcon icon="tabler-trash" size="20" />
                    </VBtn>
                  </div>
                </td>
              </tr>
              <tr v-if="payments.length === 0">
                <td colspan="5" class="text-center py-4 text-disabled">
                  To'lovlar tarixi bo'sh
                </td>
              </tr>
            </tbody>
          </VTable>
        </VWindowItem>

        <!-- Logs Tab -->
        <VWindowItem value="logs">
          <VTable class="text-no-wrap">
            <thead>
              <tr>
                <th>Guruh</th>
                <th>Turi</th>
                <th>Tafsilotlar</th>
                <th>Sabab</th>
                <th>Sana</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in statusLogs" :key="log.id">
                <td>{{ log.groupName }}</td>
                <td>
                  <VChip
                    v-if="log.type === 'STATUS_CHANGE' || !log.type"
                    color="primary"
                    size="small"
                    variant="tonal"
                  >
                    Status o'zgarishi
                  </VChip>
                  <VChip
                    v-else-if="log.type === 'DISCOUNT_ASSIGNED'"
                    color="warning"
                    size="small"
                    variant="tonal"
                  >
                    Chegirma
                  </VChip>
                  <VChip v-else size="small" variant="tonal">{{ log.type }}</VChip>
                </td>
                <td>
                  <!-- Status Change Details -->
                  <div v-if="log.type === 'STATUS_CHANGE' || !log.type" class="d-flex align-center gap-2">
                    <VChip v-bind="formatStatus(log.fromStatus)" size="x-small" />
                    <VIcon icon="tabler-arrow-right" size="14" class="text-medium-emphasis" />
                    <VChip v-bind="formatStatus(log.toStatus)" size="x-small" />
                  </div>
                  
                  <!-- Discount Details -->
                  <div v-else-if="log.type === 'DISCOUNT_ASSIGNED' && log.data">
                    <div class="text-caption mb-1">
                      <span class="text-medium-emphasis">Oylik: </span>
                      <span class="text-decoration-line-through me-1">{{ prettyMoney(log.data.groupMonthlyPrice) }}</span>
                      <VIcon icon="tabler-arrow-right" size="12" class="me-1" />
                      <span class="font-weight-bold text-success">{{ prettyMoney(log.data.customMonthlyPrice) }}</span>
                    </div>
                    <div class="text-caption text-medium-emphasis" style="font-size: 0.7rem;">
                      Dars narxi: {{ prettyMoney(log.data.oldLessonPrice) }} → {{ prettyMoney(log.data.newLessonPrice) }}
                    </div>
                    <div v-if="log.data.retroactiveRefund" class="text-caption text-info mt-1">
                      <VIcon icon="tabler-receipt-refund" size="14" class="me-1" />
                      Qaytarildi: {{ prettyMoney(log.data.retroactiveRefund) }}
                    </div>
                  </div>
                  <span v-else>-</span>
                </td>
                <td class="text-wrap" style="max-width: 200px;">
                  {{ log.reason || "-" }}
                </td>
                <td>{{ formatDate(log.createdAt) }}</td>
              </tr>
              <tr v-if="statusLogs.length === 0">
                <td colspan="5" class="text-center py-4 text-disabled">
                  O'zgarishlar tarixi bo'sh
                </td>
              </tr>
            </tbody>
          </VTable>
        </VWindowItem>
      </VWindow>
    </VCard>

    <!-- Modals -->

    <!-- Add Balance Modal -->
    <VDialog v-model="showAddBalanceModal" max-width="400">
      <VCard title="Balans to'ldirish">
        <VCardText>
          <AppTextField
            v-model="balanceForm.amountDisplay"
            label="Summa"
            @update:model-value="val => onMoneyInput(val, balanceForm, 'amount', 'amountDisplay')"
          />
          <AppTextField v-model="balanceForm.notes" label="Izoh" class="mt-3" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showAddBalanceModal = false"
            >Bekor qilish</VBtn
          >
          <VBtn
            color="primary"
            variant="elevated"
            :loading="balanceLoading"
            @click="onBalanceSubmit"
            >Saqlash</VBtn
          >
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Discount Modal -->
    <VDialog v-model="showDiscountModal" max-width="500">
      <VCard title="Chegirma belgilash">
        <VCardText>
          <AppTextField
            v-model="discountForm.customMonthlyPriceDisplay"
            label="Maxsus oylik narx"
            @update:model-value="val => onMoneyInput(val, discountForm, 'customMonthlyPrice', 'customMonthlyPriceDisplay')"
            class="mb-3"
          />
          <VRow>
            <VCol cols="6">
              <AppDateTimePicker
                v-model="discountForm.discountStartDate"
                label="Boshlash sanasi"
              />
            </VCol>
            <VCol cols="6">
              <AppDateTimePicker
                v-model="discountForm.discountEndDate"
                label="Tugash sanasi"
              />
            </VCol>
          </VRow>
          <AppTextField
            v-model="discountForm.discountReason"
            label="Sabab"
            class="mt-3"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showDiscountModal = false"
            >Bekor qilish</VBtn
          >
          <VBtn
            color="primary"
            variant="elevated"
            :loading="discountLoading"
            @click="onDiscountSubmit"
            >Saqlash</VBtn
          >
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Expel Modal -->
    <VDialog v-model="showExpelModal" max-width="400">
      <VCard title="Guruhdan chetlatish">
        <VCardText>
          <p class="mb-4">
            Haqiqatan ham ushbu o'quvchini guruhdan chetlatmoqchimisiz?
          </p>
          <AppTextarea v-model="expelForm.reason" label="Sabab" />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showExpelModal = false"
            >Bekor qilish</VBtn
          >
          <VBtn
            color="error"
            variant="elevated"
            :loading="expelLoading"
            @click="onExpelSubmit"
            >Chetlatish</VBtn
          >
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Activation Modal -->
    <VDialog v-model="showActivationModal" max-width="500">
      <VCard title="O'quvchini faollashtirish">
        <VCardText>
          <AppDateTimePicker
            v-model="activationForm.lessonStartDate"
            label="Dars boshlash sanasi"
            @update:model-value="updateActivationPreview"
            class="mb-4"
          />
          <div v-if="activationPreview" class="bg-grey-100 pa-3 rounded">
            <div class="d-flex justify-space-between mb-1">
              <span>Darslar soni:</span>
              <span class="font-weight-bold"
                >{{ activationPreview.lessonsIncluded }} ta</span
              >
            </div>
            <div class="d-flex justify-space-between mb-1">
              <span>Hisoblangan summa:</span>
              <span class="font-weight-bold"
                >{{ prettyMoney(activationPreview.proratedAmount) }} UZS</span
              >
            </div>
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showActivationModal = false"
            >Bekor qilish</VBtn
          >
          <VBtn
            color="primary"
            variant="elevated"
            :loading="activationLoading"
            @click="onActivationSubmit"
            >Faollashtirish</VBtn
          >
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Payment Modal -->
    <VDialog v-model="showEditPaymentModal" max-width="500">
      <VCard title="To'lovni tahrirlash">
        <VCardText>
          <VAlert
            color="warning"
            variant="tonal"
            icon="tabler-alert-circle"
            class="mb-4"
            density="compact"
          >
            Summani o'zgartirish o'quvchi balansiga ta'sir qiladi.
          </VAlert>
          <AppTextField
            v-model="editPaymentForm.amountDisplay"
            label="Summa"
            @update:model-value="val => onMoneyInput(val, editPaymentForm, 'amount', 'amountDisplay')"
            class="mb-3"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showEditPaymentModal = false"
            >Bekor qilish</VBtn
          >
          <VBtn
            color="primary"
            variant="elevated"
            :loading="editPaymentLoading"
            @click="onEditPaymentSubmit"
            >Saqlash</VBtn
          >
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Payment Modal -->
    <VDialog v-model="showDeletePaymentModal" max-width="400">
      <VCard title="To'lovni o'chirish">
        <VCardText>
          <VAlert
            color="error"
            variant="tonal"
            icon="tabler-alert-triangle"
            class="mb-4"
          >
            Diqqat! To'lov o'chirilganda o'quvchi balansidan ushbu summa ayirib tashlanadi (qarz paydo bo'lishi mumkin).
          </VAlert>
          <p>Haqiqatan ham ushbu to'lovni o'chirmoqchimisiz?</p>
          <div class="d-flex align-center justify-space-between mt-2 pa-3 bg-grey-100 rounded">
             <span class="text-body-2">Summa:</span>
             <span class="font-weight-bold">{{ prettyMoney(selectedPayment?.amount) }} UZS</span>
          </div>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="showDeletePaymentModal = false"
            >Bekor qilish</VBtn
          >
          <VBtn
            color="error"
            variant="elevated"
            :loading="deletePaymentLoading"
            @click="onDeletePaymentSubmit"
            >O'chirish</VBtn
          >
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Receipt Modal -->
    <VDialog v-model="showReceiptModal" max-width="600">
      <VCard>
        <VCardText class="pa-0 position-relative">
          <VBtn
            icon
            variant="flat"
            color="secondary"
            size="small"
            class="position-absolute top-0 right-0 ma-2"
            style="z-index: 10"
            @click="showReceiptModal = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
          <VImg :src="selectedReceiptUrl" cover max-height="80vh" />
        </VCardText>
        <VCardActions class="justify-center">
          <VBtn
            color="primary"
            variant="text"
            :href="selectedReceiptUrl"
            target="_blank"
            prepend-icon="tabler-download"
          >
            Rasmni yuklab olish
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <StudentMessageModal
      v-if="selectedMessageEnrollment"
      v-model="showStudentMessageModal"
      :enrollment="selectedMessageEnrollment"
    />
  </div>
</template>
