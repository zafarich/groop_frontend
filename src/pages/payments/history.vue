<script setup>
import {usePayments} from "@/composables/usePayments";
import {useQueryParams} from "@/composables/useQueryParams";
import {$api} from "@/utils/api";
import {prettyMoney} from "@/utils/utils";
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";

definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();

const {payments, meta, loading, fetchPayments} = usePayments();

// State
const searchQuery = ref("");
const groupFilter = ref(null);
const startDate = ref("");
const endDate = ref("");
const statusFilter = ref("PAID");
const groups = ref([]);
const pagination = ref({
  page: 1,
  limit: 20,
});

// Receipt modal state
const showReceiptModal = ref(false);
const selectedReceipt = ref(null);

// Status options
const statusOptions = [
  {title: "Barchasi", value: null},
  {title: "Tasdiqlangan", value: "PAID"},
  {title: "Kutilmoqda", value: "PENDING"},
  {title: "Bekor qilingan", value: "CANCELLED"},
  {title: "Muddati o'tgan", value: "OVERDUE"},
  {title: "Qaytarilgan", value: "REFUNDED"},
];

// Date range options
const dateRange = ref("THIS_MONTH");
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

  // Helper to format YYYY-MM-DD
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
      end.setDate(0); // Last day of previous month
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

// Fetch groups
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

// Fetch data
const loadPayments = async () => {
  // Convert groupFilter to number if it's a string from URL
  const groupId = groupFilter.value ? Number(groupFilter.value) : undefined;

  await fetchPayments({
    status: statusFilter.value || undefined,
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
    status: statusFilter,
    search: searchQuery,
    groupId: groupFilter,
    startDate: startDate,
    endDate: endDate,
  },
  pagination: pagination,
  fetchData: loadPayments,
  defaultFilters: {
    status: "PAID",
    search: "",
    groupId: null,
    startDate: "",
    endDate: "",
  },
  defaultLimit: 20,
  debounceTime: 300,
});

// Receipt modal
const openReceiptModal = (payment) => {
  selectedReceipt.value = payment;
  showReceiptModal.value = true;
};

// Helpers
const getStudentName = (payment) => {
  if (!payment.student) return "-";
  return (
    `${payment.student.firstName || ""} ${payment.student.lastName || ""}`.trim() ||
    "-"
  );
};

const getStudentPhone = (payment) => {
  return payment.student?.user?.phoneNumber || "-";
};

const getGroupName = (payment) => payment.group?.name || "-";

const getStatusConfig = (status) => {
  switch (status) {
    case "PENDING":
      return {color: "warning", text: "Kutilmoqda"};
    case "PAID":
      return {color: "success", text: "Tasdiqlangan"};
    case "CANCELLED":
      return {color: "error", text: "Bekor qilingan"};
    case "OVERDUE":
      return {color: "warning", text: "Muddati o'tgan"};
    case "REFUNDED":
      return {color: "info", text: "Qaytarilgan"};
    default:
      return {color: "default", text: status};
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Initialize: Set default dates and fetch groups
onMounted(async () => {
  // Set default dates based on THIS_MONTH if not set from URL
  if (!startDate.value && !endDate.value) {
    const {start, end} = calculateDateRange("THIS_MONTH");
    startDate.value = start;
    endDate.value = end;
  }
  await fetchGroups();
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard class="mb-4">
        <VCardText class="d-flex align-center justify-space-between py-3">
          <div>
            <h3 class="text-h6 font-weight-medium mb-1">Jami summa</h3>
            <div class="text-caption text-medium-emphasis">
              Tanlangan davr va filtrlar bo'yicha
            </div>
          </div>
          <div class="text-h4 font-weight-bold text-primary">
            {{ prettyMoney(meta.totalAmount || 0) }} so'm
          </div>
        </VCardText>
      </VCard>

      <VCard>
        <VCardTitle class="d-flex align-center gap-2">
          <VIcon icon="tabler-cash" />
          <span>To'lovlar tarixi</span>
        </VCardTitle>
        <VDivider />

        <!-- Filters -->
        <VCardText>
          <VRow>
            <!-- Row 1: Status, Search, Group -->
            <VCol cols="12" md="4">
              <VSelect
                v-model="statusFilter"
                label="Status"
                :items="statusOptions"
                density="compact"
                hide-details
              />
            </VCol>
            <VCol cols="12" md="4">
              <AppTextField
                v-model="searchQuery"
                placeholder="Qidirish..."
                density="compact"
                hide-details
              >
                <template #prepend-inner>
                  <VIcon icon="tabler-search" size="20" />
                </template>
              </AppTextField>
            </VCol>
            <VCol cols="12" md="4">
              <VSelect
                v-model="groupFilter"
                :items="[{title: 'Barcha guruhlar', value: null}, ...groups]"
                label="Guruh"
                density="compact"
                hide-details
                clearable
              />
            </VCol>

            <!-- Row 2: Date Filters -->
            <VCol cols="12" md="4">
              <VSelect
                v-model="dateRange"
                :items="dateRangeOptions"
                label="Davr"
                density="compact"
                hide-details
                @update:model-value="onDateRangeChange"
              />
            </VCol>
            <VCol cols="12" md="4">
              <AppDateTimePicker
                v-model="startDate"
                placeholder="Dan"
                density="compact"
                hide-details
              />
            </VCol>
            <VCol cols="12" md="4">
              <AppDateTimePicker
                v-model="endDate"
                placeholder="Gacha"
                density="compact"
                hide-details
              />
            </VCol>
          </VRow>
        </VCardText>

        <VTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>O'quvchi</th>
              <th>Guruh</th>
              <th>Summa</th>
              <th>Sana</th>
              <th>Status</th>
              <th>Chek</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-8">
                <VProgressCircular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="payments.length === 0">
              <td colspan="7" class="text-center py-8">To'lovlar topilmadi</td>
            </tr>
            <tr v-else v-for="payment in payments" :key="payment.id">
              <td>{{ payment.id }}</td>
              <td>
                <a
                  class="font-weight-medium text-primary cursor-pointer"
                  @click="router.push(`/students/${payment.student?.id}`)"
                >
                  {{ getStudentName(payment) }}
                </a>
                <div class="text-caption text-disabled">
                  {{ getStudentPhone(payment) }}
                </div>
              </td>
              <td>{{ getGroupName(payment) }}</td>
              <td
                class="font-weight-bold"
                :class="
                  payment.status === 'REFUNDED'
                    ? 'text-decoration-line-through text-error'
                    : 'text-success'
                "
              >
                {{ prettyMoney(payment.amount) }}
              </td>
              <td>{{ formatDateTime(payment.createdAt) }}</td>
              <td>
                <VChip
                  size="small"
                  variant="tonal"
                  :color="getStatusConfig(payment.status).color"
                >
                  {{ getStatusConfig(payment.status).text }}
                </VChip>
              </td>
              <td>
                <VBtn
                  v-if="payment.receiptUrl"
                  icon="tabler-eye"
                  variant="text"
                  size="small"
                  color="primary"
                  @click="openReceiptModal(payment)"
                />
              </td>
            </tr>
          </tbody>
        </VTable>

        <!-- Pagination -->
        <VCardText
          v-if="meta.totalPages > 1"
          class="d-flex align-center justify-end"
        >
          <VPagination
            v-model="pagination.page"
            :length="meta.totalPages"
            total-visible="5"
          />
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Receipt Modal (Read-only) -->
  <VDialog v-model="showReceiptModal" max-width="500">
    <VCard v-if="selectedReceipt">
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>Chek rasmi</span>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="showReceiptModal = false"
        />
      </VCardTitle>
      <VCardText class="text-center pa-4">
        <img
          :src="selectedReceipt.receiptUrl"
          style="max-width: 100%; max-height: 500px; border-radius: 8px"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          :href="selectedReceipt.receiptUrl"
          target="_blank"
          variant="tonal"
          color="primary"
        >
          <VIcon icon="tabler-download" class="me-2" /> Yuklab olish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
