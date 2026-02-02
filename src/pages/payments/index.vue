<script setup>
import {usePayments} from "@/composables/usePayments";
import {useToast} from "@/composables/useToast";
import {useQueryParams} from "@/composables/useQueryParams";
import {$api} from "@/utils/api";
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";

definePage({
  meta: {
    layout: "default",
  },
});

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

// Date range options
const dateRange = ref(null);
const dateRangeOptions = [
  {title: "Bugun", value: "TODAY"},
  {title: "Oxirgi 7 kun", value: "LAST_7_DAYS"},
  {title: "Bu oy", value: "THIS_MONTH"},
  {title: "O'tgan oy", value: "LAST_MONTH"},
  {title: "Barchasi", value: "ALL"},
];

const calculateDateRange = (range) => {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);
  const fmt = (d) => d.toISOString().split("T")[0];

  switch (range) {
    case "TODAY":
      return {start: fmt(start), end: fmt(end)};
    case "LAST_7_DAYS":
      start.setDate(today.getDate() - 7);
      return {start: fmt(start), end: fmt(end)};
    case "THIS_MONTH":
      start.setDate(1);
      return {start: fmt(start), end: fmt(end)};
    case "LAST_MONTH":
      start.setMonth(today.getMonth() - 1);
      start.setDate(1);
      end.setDate(0);
      return {start: fmt(start), end: fmt(end)};
    case "ALL":
      return {start: "", end: ""};
    default:
      return {start: "", end: ""};
  }
};

const onDateRangeChange = (val) => {
  const {start, end} = calculateDateRange(val);
  startDate.value = start;
  endDate.value = end;
};

// Fetch groups for dropdown
const fetchGroups = async () => {
  try {
    const res = await $api("/v1/groups?limit=100");
    if (res.success) {
      groups.value =
        res.data?.map((g) => ({title: g.name, value: String(g.id)})) || [];
    }
  } catch (e) {
    console.error(e);
  }
};

// Receipt modal state
const showReceiptModal = ref(false);
const selectedReceipt = ref(null);
const confirmedAmount = ref(null);

// Formatted confirmed amount for input display
const formattedConfirmedAmount = computed({
  get: () => {
    if (!confirmedAmount.value) return "";
    return new Intl.NumberFormat("uz-UZ").format(confirmedAmount.value);
  },
  set: (value) => {
    // Remove all non-digit characters and convert to number
    const cleanValue = value.replace(/\D/g, "");
    confirmedAmount.value = cleanValue ? Number(cleanValue) : null;
  },
});

// Rejection modal state
const showRejectModal = ref(false);
const rejectReason = ref("");
const actionLoading = ref(false);

// Tabs configuration
const tabs = [
  {status: "PENDING", label: "Yangi", color: "warning", countKey: "pending"},
  {status: "PAID", label: "Tasdiqlangan", color: "success", countKey: "paid"},
  {
    status: "CANCELLED",
    label: "Bekor qilingan",
    color: "error",
    countKey: "cancelled",
  },
];

// Format price with thousands separator
const formatPrice = (price) => {
  if (!price) return "-";
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("uz-UZ").format(num) + " so'm";
};

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

// Get status configuration
const getStatusConfig = (status) => {
  switch (status) {
    case "PENDING":
      return {color: "warning", text: "Kutilmoqda", icon: "tabler-clock"};
    case "PAID":
      return {color: "success", text: "Tasdiqlangan", icon: "tabler-check"};
    case "CANCELLED":
      return {color: "error", text: "Bekor qilingan", icon: "tabler-x"};
    case "OVERDUE":
      return {
        color: "warning",
        text: "Muddati o'tgan",
        icon: "tabler-alert-triangle",
      };
    case "REFUNDED":
      return {color: "info", text: "Qaytarilgan", icon: "tabler-refresh"};
    default:
      return {color: "default", text: status, icon: "tabler-help"};
  }
};

// Format phone number
const formatPhoneNumber = (phone) => {
  if (!phone) return "-";
  // Format: +998 90 123 45 67
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
  }
  return phone;
};

// Fetch data
const loadPayments = async () => {
  // Convert groupFilter to number if it's a string from URL
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
    groupId: groupFilter, // Assuming backend expects groupId, not groupFilter which is ref to value
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

// Open receipt modal
const openReceiptModal = (payment) => {
  selectedReceipt.value = payment;
  confirmedAmount.value = payment.amount;
  showReceiptModal.value = true;
};

// Close receipt modal
const closeReceiptModal = () => {
  showReceiptModal.value = false;
  selectedReceipt.value = null;
};

// Handle approve payment
const handleApprove = async () => {
  if (!selectedReceipt.value) return;

  actionLoading.value = true;
  try {
    const result = await approvePayment(
      selectedReceipt.value.id,
      null,
      confirmedAmount.value,
    );
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

// Open rejection modal
const openRejectModal = () => {
  rejectReason.value = "";
  showRejectModal.value = true;
};

// Close rejection modal
const closeRejectModal = () => {
  showRejectModal.value = false;
  rejectReason.value = "";
};

// Handle reject payment
const handleReject = async () => {
  if (!selectedReceipt.value) return;

  if (!rejectReason.value.trim()) {
    showError("Bekor qilish sababini kiriting");
    return;
  }

  actionLoading.value = true;
  try {
    const result = await rejectPayment(
      selectedReceipt.value.id,
      rejectReason.value.trim(),
    );
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

// Get student full name
const getStudentName = (payment) => {
  if (!payment.student) return "-";
  return (
    `${payment.student.firstName || ""} ${payment.student.lastName || ""}`.trim() ||
    "-"
  );
};

// Get student phone
const getStudentPhone = (payment) => {
  if (!payment.student?.user?.phoneNumber) return "-";
  return formatPhoneNumber(payment.student.user.phoneNumber);
};

// Get group name
const getGroupName = (payment) => {
  if (!payment.group) return "-";
  return payment.group.name || "-";
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
      <VRow class="mb-4">
        <VCol cols="12" sm="4">
          <VCard variant="tonal" color="warning">
            <VCardText class="d-flex align-center gap-3">
              <VAvatar color="warning" variant="tonal" size="44">
                <VIcon icon="tabler-clock" size="28" />
              </VAvatar>
              <div>
                <div class="text-h5 font-weight-bold">
                  {{ stats.pending || 0 }}
                </div>
                <div class="text-body-2">Kutilmoqda</div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="4">
          <VCard variant="tonal" color="success">
            <VCardText class="d-flex align-center gap-3">
              <VAvatar color="success" variant="tonal" size="44">
                <VIcon icon="tabler-check" size="28" />
              </VAvatar>
              <div>
                <div class="text-h5 font-weight-bold">
                  {{ stats.paid || 0 }}
                </div>
                <div class="text-body-2">Tasdiqlangan</div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" sm="4">
          <VCard variant="tonal" color="error">
            <VCardText class="d-flex align-center gap-3">
              <VAvatar color="error" variant="tonal" size="44">
                <VIcon icon="tabler-x" size="28" />
              </VAvatar>
              <div>
                <div class="text-h5 font-weight-bold">
                  {{ stats.cancelled || 0 }}
                </div>
                <div class="text-body-2">Bekor qilingan</div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Main Card -->
      <VCard>
        <!-- Header -->
        <VCardTitle
          class="d-flex align-center justify-space-between flex-wrap gap-4"
        >
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
        <!-- Filters -->
        <VCardText>
          <VRow>
            <VCol cols="12" md="3">
              <AppTextField
                v-model="searchQuery"
                placeholder="O'quvchi ismi yoki telefon..."
                density="compact"
              >
                <template #prepend-inner>
                  <VIcon icon="tabler-search" />
                </template>
              </AppTextField>
            </VCol>
            <VCol cols="12" md="3">
              <VSelect
                v-model="groupFilter"
                :items="[{title: 'Barcha guruhlar', value: null}, ...groups]"
                label="Guruh"
                density="compact"
                clearable
              />
            </VCol>
            <VCol cols="12" md="2">
              <VSelect
                v-model="dateRange"
                :items="dateRangeOptions"
                label="Davr"
                density="compact"
                hide-details
                @update:model-value="onDateRangeChange"
              />
            </VCol>
            <VCol cols="12" md="2">
              <AppDateTimePicker
                v-model="startDate"
                placeholder="Boshlanish"
                density="compact"
              />
            </VCol>
            <VCol cols="12" md="2">
              <AppDateTimePicker
                v-model="endDate"
                placeholder="Tugash"
                density="compact"
              />
            </VCol>
          </VRow>
        </VCardText>

        <!-- Payments Table -->
        <VTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>O'quvchi</th>
              <th>Guruh</th>
              <th>To'lov summasi</th>
              <th>Vaqt</th>
              <th>Status</th>
              <th>Chek rasmi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-8">
                <VProgressCircular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="payments.length === 0">
              <td colspan="7" class="text-center py-8">
                <div class="text-body-1 text-medium-emphasis">
                  Cheklar topilmadi
                </div>
              </td>
            </tr>
            <tr v-else v-for="payment in payments" :key="payment.id">
              <td>{{ payment.id }}</td>
              <td>
                <div class="font-weight-medium">
                  {{ getStudentName(payment) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ getStudentPhone(payment) }}
                </div>
              </td>
              <td>{{ getGroupName(payment) }}</td>
              <td class="font-weight-medium">
                {{ formatPrice(payment.amount) }}
              </td>
              <td>{{ formatDateTime(payment.createdAt) }}</td>
              <td>
                <VChip
                  :color="getStatusConfig(payment.status).color"
                  size="small"
                  variant="tonal"
                  :prepend-icon="getStatusConfig(payment.status).icon"
                >
                  {{ getStatusConfig(payment.status).text }}
                </VChip>
              </td>
              <td>
                <VBtn
                  v-if="payment.receiptUrl"
                  size="small"
                  color="primary"
                  variant="tonal"
                  @click="openReceiptModal(payment)"
                >
                  <VIcon icon="tabler-eye" class="me-1" />
                  Ko'rish
                </VBtn>
                <span v-else class="text-medium-emphasis">-</span>
              </td>
            </tr>
          </tbody>
        </VTable>

        <!-- Pagination -->
        <VCardText v-if="meta.totalPages > 1">
          <VRow class="align-center">
            <VCol cols="12" md="6">
              <div class="d-flex align-center gap-2">
                <span class="text-body-2">Sahifada:</span>
                <VSelect
                  v-model="pagination.limit"
                  :items="[10, 20, 50, 100]"
                  density="compact"
                  variant="outlined"
                  style="max-width: 100px"
                />
              </div>
            </VCol>
            <VCol cols="12" md="6" class="d-flex justify-end">
              <VPagination
                v-model="pagination.page"
                :length="meta.totalPages"
                :total-visible="5"
              />
            </VCol>
          </VRow>
          <div class="text-body-2 text-center mt-2">
            Jami: {{ meta.total }} ta chek
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Receipt Modal -->
  <VDialog v-model="showReceiptModal" max-width="600">
    <VCard v-if="selectedReceipt">
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>Chek rasmi</span>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="closeReceiptModal"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <!-- Payment Info -->
        <VRow class="mb-4">
          <VCol cols="6">
            <div class="text-caption text-medium-emphasis">O'quvchi</div>
            <div class="font-weight-medium">
              {{ getStudentName(selectedReceipt) }}
            </div>
            <div class="text-body-2">
              {{ getStudentPhone(selectedReceipt) }}
            </div>
          </VCol>
          <VCol cols="6">
            <div class="text-caption text-medium-emphasis">To'lov summasi</div>
            <div class="font-weight-medium text-primary">
              {{ formatPrice(selectedReceipt.amount) }}
            </div>
          </VCol>
          <VCol cols="6">
            <div class="text-caption text-medium-emphasis">Guruh</div>
            <div class="font-weight-medium">
              {{ getGroupName(selectedReceipt) }}
            </div>
          </VCol>
          <VCol cols="6">
            <div class="text-caption text-medium-emphasis">Yuborilgan vaqt</div>
            <div class="font-weight-medium">
              {{ formatDateTime(selectedReceipt.createdAt) }}
            </div>
          </VCol>
        </VRow>

        <div v-if="selectedReceipt.status === 'PENDING'" class="mb-4">
          <AppTextField
            v-model="formattedConfirmedAmount"
            label="Tasdiqlanadigan summa"
            type="text"
            placeholder="Summani kiriting"
            :hint="`Asl summa: ${formatPrice(selectedReceipt.amount)}`"
            persistent-hint
          />
        </div>

        <VDivider class="mb-4" />

        <!-- Receipt Image -->
        <div class="receipt-image-container">
          <img
            :src="selectedReceipt.receiptUrl"
            alt="Chek rasmi"
            class="receipt-image"
          />
        </div>
      </VCardText>

      <VDivider class="mb-4" />

      <VCardActions>
        <!-- Approve/Reject buttons for pending payments -->
        <template v-if="selectedReceipt.status === 'PENDING'">
          <VBtn
            color="error"
            variant="outlined"
            :disabled="actionLoading"
            @click="openRejectModal"
          >
            <VIcon icon="tabler-x" class="me-1" />
            Bekor qilish
          </VBtn>
          <VBtn color="success" :loading="actionLoading" @click="handleApprove">
            <VIcon icon="tabler-check" class="me-1" />
            Tasdiqlash
          </VBtn>
        </template>
        <VSpacer />
        <VBtn
          :href="selectedReceipt.receiptUrl"
          download
          target="_blank"
          color="primary"
          variant="outlined"
        >
          <VIcon icon="tabler-download" class="me-1" />
          Yuklab olish
        </VBtn>
        <VBtn color="secondary" variant="outlined" @click="closeReceiptModal">
          Yopish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Rejection Reason Modal -->
  <VDialog v-model="showRejectModal" max-width="500" persistent>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>To'lovni bekor qilish</span>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          :disabled="actionLoading"
          @click="closeRejectModal"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <VAlert type="warning" variant="tonal" class="mb-4">
          <template #prepend>
            <VIcon icon="tabler-alert-triangle" />
          </template>
          To'lovni bekor qilish sababini kiriting. Bu sabab o'quvchiga
          ko'rsatiladi.
        </VAlert>

        <AppTextField
          v-model="rejectReason"
          label="Bekor qilish sababi"
          placeholder="Masalan: Chek summasi noto'g'ri"
          :rules="[(v) => !!v?.trim() || 'Sababni kiriting']"
          autofocus
        />
      </VCardText>

      <VDivider class="mb-4" />

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          :disabled="actionLoading"
          @click="closeRejectModal"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="error"
          :loading="actionLoading"
          :disabled="!rejectReason.trim()"
          @click="handleReject"
        >
          <VIcon icon="tabler-x" class="me-1" />
          Tasdiqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.receipt-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 8px;
  padding: 16px;
  min-height: 300px;
}

.receipt-image {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 4px;
}
</style>
