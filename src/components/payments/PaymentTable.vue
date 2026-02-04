<script setup>
const props = defineProps({
  payments: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  meta: {
    type: Object,
    default: () => ({}),
  },
  pagination: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["view-receipt", "view-student"]);

const localPagination = computed({
  get: () => props.pagination,
  set: (val) => {
    Object.assign(props.pagination, val);
  },
});

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
      return {color: "warning", text: "Muddati o'tgan", icon: "tabler-alert-triangle"};
    case "REFUNDED":
      return {color: "info", text: "Qaytarilgan", icon: "tabler-refresh"};
    default:
      return {color: "default", text: status, icon: "tabler-help"};
  }
};

// Format phone number
const formatPhoneNumber = (phone) => {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
  }
  return phone;
};

// Get student full name
const getStudentName = (payment) => {
  if (!payment.student) return "-";
  return `${payment.student.firstName || ""} ${payment.student.lastName || ""}`.trim() || "-";
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
</script>

<template>
  <div>
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
            <a
              class="font-weight-medium text-primary cursor-pointer"
              @click="$emit('view-student', payment.student?.id)"
            >
              {{ getStudentName(payment) }}
            </a>
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
              @click="$emit('view-receipt', payment)"
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
              v-model="localPagination.limit"
              :items="[10, 20, 50, 100]"
              density="compact"
              variant="outlined"
              style="max-width: 100px"
            />
          </div>
        </VCol>
        <VCol cols="12" md="6" class="d-flex justify-end">
          <VPagination
            v-model="localPagination.page"
            :length="meta.totalPages"
            :total-visible="5"
          />
        </VCol>
      </VRow>
      <div class="text-body-2 text-center mt-2">
        Jami: {{ meta.total }} ta chek
      </div>
    </VCardText>
  </div>
</template>
