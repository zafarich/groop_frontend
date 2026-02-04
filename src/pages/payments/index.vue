<script setup>
import {usePayments} from "@/composables/usePayments";
import {useToast} from "@/composables/useToast";
import {useQueryParams} from "@/composables/useQueryParams";
import {$api} from "@/utils/api";
import {
  PaymentStats,
  PaymentFilters,
  PaymentTable,
  PaymentReceiptModal,
  PaymentRejectModal,
} from "@/components/payments";

definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();

const {success: showSuccess, error: showError} = useToast();
const {
  payments,
  stats,
  meta,
  loading,
  fetchPayments,
  fetchStats,
  approvePayment,
  rejectPayment,
} = usePayments();

// State
const activeTab = ref("PENDING");
const searchQuery = ref("");
const groupFilter = ref(null);
const startDate = ref("");
const endDate = ref("");
const groups = ref([]);
const pagination = ref({
  page: 1,
  limit: 10,
});

// Modal states
const showReceiptModal = ref(false);
const showRejectModal = ref(false);
const selectedPayment = ref(null);
const actionLoading = ref(false);
const confirmedAmount = ref(null);

// Tabs configuration
const tabs = [
  {status: "PENDING", label: "Yangi", color: "warning", countKey: "pending"},
  {status: "PAID", label: "Tasdiqlangan", color: "success", countKey: "paid"},
  {status: "CANCELLED", label: "Bekor qilingan", color: "error", countKey: "cancelled"},
];

// Fetch groups for dropdown
const fetchGroups = async () => {
  try {
    const res = await $api("/v1/groups?limit=100");
    if (res.success) {
      groups.value = res.data?.map((g) => ({title: g.name, value: String(g.id)})) || [];
    }
  } catch (e) {
    console.error(e);
  }
};

// Fetch data
const loadPayments = async () => {
  const groupId = groupFilter.value ? Number(groupFilter.value) : undefined;

  await fetchPayments({
    status: activeTab.value,
    search: searchQuery.value.trim() || undefined,
    groupId: groupId,
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
    page: pagination.value.page,
    limit: pagination.value.limit,
  });
};

// Use Query Params Sync
useQueryParams({
  filters: {
    status: activeTab,
    search: searchQuery,
    groupId: groupFilter,
    startDate: startDate,
    endDate: endDate,
  },
  pagination: pagination,
  fetchData: loadPayments,
  defaultFilters: {
    status: "PENDING",
    search: "",
    groupId: null,
    startDate: "",
    endDate: "",
  },
  debounceTime: 500,
});

// Modal handlers
const openReceiptModal = (payment) => {
  selectedPayment.value = payment;
  confirmedAmount.value = payment.amount;
  showReceiptModal.value = true;
};

const closeReceiptModal = () => {
  showReceiptModal.value = false;
  selectedPayment.value = null;
};

const handleApprove = async (amount) => {
  if (!selectedPayment.value) return;

  actionLoading.value = true;
  try {
    const result = await approvePayment(selectedPayment.value.id, null, amount);
    if (result.success) {
      showSuccess(result.message || "To'lov muvaffaqiyatli tasdiqlandi");
      closeReceiptModal();
      await Promise.all([loadPayments(), fetchStats()]);
    } else {
      showError(result.message || "To'lovni tasdiqlashda xatolik yuz berdi");
    }
  } catch (err) {
    showError("To'lovni tasdiqlashda xatolik yuz berdi");
  } finally {
    actionLoading.value = false;
  }
};

const openRejectModal = () => {
  showRejectModal.value = true;
};

const closeRejectModal = () => {
  showRejectModal.value = false;
};

const handleReject = async (reason) => {
  if (!selectedPayment.value) return;

  actionLoading.value = true;
  try {
    const result = await rejectPayment(selectedPayment.value.id, reason);
    if (result.success) {
      showSuccess(result.message || "To'lov muvaffaqiyatli bekor qilindi");
      closeRejectModal();
      closeReceiptModal();
      await Promise.all([loadPayments(), fetchStats()]);
    } else {
      showError(result.message || "To'lovni bekor qilishda xatolik yuz berdi");
    }
  } catch (err) {
    showError("To'lovni bekor qilishda xatolik yuz berdi");
  } finally {
    actionLoading.value = false;
  }
};

const viewStudent = (studentId) => {
  if (studentId) {
    router.push(`/students/${studentId}`);
  }
};

// Load data on mount
onMounted(async () => {
  await Promise.all([fetchGroups(), fetchStats()]);
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- Stats Cards -->
      <PaymentStats :stats="stats" />

      <!-- Main Card -->
      <VCard>
        <!-- Header -->
        <VCardTitle class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center">
            <VIcon icon="tabler-receipt" class="me-2" />
            <span>Cheklarni tasdiqlash</span>
          </div>
        </VCardTitle>

        <VDivider />

        <!-- Tabs -->
        <VTabs v-model="activeTab" bg-color="transparent">
          <VTab v-for="tab in tabs" :key="tab.status" :value="tab.status">
            {{ tab.label }}
            <VBadge
              :color="tab.color"
              :content="stats[tab.countKey] || 0"
              inline
              class="ms-2"
            />
          </VTab>
        </VTabs>

        <VDivider />

        <!-- Filters -->
        <PaymentFilters
          v-model:search="searchQuery"
          v-model:group="groupFilter"
          v-model:start-date="startDate"
          v-model:end-date="endDate"
          :groups="groups"
          @date-range-change="({start, end}) => { startDate = start; endDate = end; }"
        />

        <!-- Payments Table -->
        <PaymentTable
          :payments="payments"
          :loading="loading"
          :meta="meta"
          :pagination="pagination"
          @view-receipt="openReceiptModal"
          @view-student="viewStudent"
        />
      </VCard>
    </VCol>
  </VRow>

  <!-- Receipt Modal -->
  <PaymentReceiptModal
    v-model="showReceiptModal"
    :payment="selectedPayment"
    :loading="actionLoading"
    @approve="handleApprove"
    @reject="openRejectModal"
    @view-student="viewStudent"
  />

  <!-- Rejection Reason Modal -->
  <PaymentRejectModal
    v-model="showRejectModal"
    :loading="actionLoading"
    @confirm="handleReject"
  />
</template>
