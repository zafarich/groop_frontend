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

// Edit modal state
const showEditModal = ref(false);
const editingPayment = ref(null);
const editLoading = ref(false);
const editForm = ref({
  amount: 0,
  amountDisplay: "",
});

// Delete modal state
const showDeleteModal = ref(false);
const deletingPayment = ref(null);
const deleteLoading = ref(false);



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

// Edit handlers
const openEditModal = (payment) => {
  editingPayment.value = payment;
  editForm.value = {
    amount: payment.amount,
    amountDisplay: prettyMoney(payment.amount),
  };
  showEditModal.value = true;
};

// Handle formatted money input
const onMoneyInput = (val) => {
  if (!val) {
    editForm.value.amount = 0;
    editForm.value.amountDisplay = "";
    return;
  }
  // Allow digits and dots, remove spaces
  const cleanVal = val.toString().replace(/[^\d.]/g, "");
  const num = parseFloat(cleanVal || "0");
  
  editForm.value.amount = num;
  editForm.value.amountDisplay = prettyMoney(num);
};

const onEditConfirm = async () => {
  if (!editingPayment.value) return;

  editLoading.value = true;
  try {
    const body = {
      amount: Number(editForm.value.amount),
    };

    const response = await $api(`/v1/payments/${editingPayment.value.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    if (response.success) {
      showEditModal.value = false;
      editingPayment.value = null;
      // Refresh list
      loadPayments();
    }
  } catch (error) {
    console.error("Error updating payment:", error);
  } finally {
    editLoading.value = false;
  }
};

// Delete handlers
const openDeleteModal = (payment) => {
  deletingPayment.value = payment;
  showDeleteModal.value = true;
};

const onDeleteConfirm = async () => {
  if (!deletingPayment.value) return;

  deleteLoading.value = true;
  try {
    const response = await $api(`/v1/payments/${deletingPayment.value.id}`, {
      method: "DELETE",
    });

    if (response.success) {
      showDeleteModal.value = false;
      deletingPayment.value = null;
      // Refresh list
      loadPayments();
    }
  } catch (error) {
    console.error("Error deleting payment:", error);
  } finally {
    deleteLoading.value = false;
  }
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
              <th>Amallar</th>
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
                <div class="d-flex align-center gap-1">
                  <VBtn
                    v-if="payment.receiptUrl"
                    icon="tabler-eye"
                    variant="text"
                    size="small"
                    color="primary"
                    @click="openReceiptModal(payment)"
                  >
                    <VIcon icon="tabler-eye" size="20" />
                    <VTooltip activator="parent" location="top">Chekni ko'rish</VTooltip>
                  </VBtn>
                  <VBtn
                    icon="tabler-edit"
                    variant="text"
                    size="small"
                    color="warning"
                    @click="openEditModal(payment)"
                  >
                    <VIcon icon="tabler-edit" size="20" />
                    <VTooltip activator="parent" location="top">Tahrirlash</VTooltip>
                  </VBtn>
                  <VBtn
                    icon="tabler-trash"
                    variant="text"
                    size="small"
                    color="error"
                    @click="openDeleteModal(payment)"
                  >
                    <VIcon icon="tabler-trash" size="20" />
                    <VTooltip activator="parent" location="top">O'chirish</VTooltip>
                  </VBtn>
                </div>
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

  <!-- Edit Payment Modal -->
  <VDialog v-model="showEditModal" max-width="500">
    <VCard v-if="editingPayment">
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>To'lovni tahrirlash</span>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="showEditModal = false"
        />
      </VCardTitle>
      <VCardText>
        <div class="text-body-2 text-medium-emphasis mb-4">
          <div><strong>O'quvchi:</strong> {{ getStudentName(editingPayment) }}</div>
          <div><strong>Guruh:</strong> {{ getGroupName(editingPayment) }}</div>
          <div><strong>Status:</strong> {{ getStatusConfig(editingPayment.status).text }}</div>
        </div>
        <VTextField
          v-model="editForm.amountDisplay"
          label="Summa (so'm) *"
          density="compact"
          hide-details
          @update:model-value="onMoneyInput"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showEditModal = false"
          :disabled="editLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          @click="onEditConfirm"
          :loading="editLoading"
          :disabled="editLoading"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Delete Confirmation Modal -->
  <VDialog v-model="showDeleteModal" max-width="500">
    <VCard v-if="deletingPayment">
      <VCardTitle class="text-h5 pt-4 px-6">To'lovni o'chirish</VCardTitle>
      <VCardText>
        <p>Siz haqiqatan ham ushbu to'lovni o'chirmoqchimisiz?</p>
        <div class="text-body-2 text-medium-emphasis mt-2">
          <div><strong>ID:</strong> {{ deletingPayment.id }}</div>
          <div><strong>O'quvchi:</strong> {{ getStudentName(deletingPayment) }}</div>
          <div><strong>Summa:</strong> {{ prettyMoney(deletingPayment.amount) }} so'm</div>
        </div>
        <p class="text-caption text-error mt-4">Bu amalni ortga qaytarib bo'lmaydi.</p>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showDeleteModal = false"
          :disabled="deleteLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="error"
          variant="elevated"
          @click="onDeleteConfirm"
          :loading="deleteLoading"
          :disabled="deleteLoading"
        >
          O'chirish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
