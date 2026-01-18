<script setup>
import {useDashboard} from "@/composables/useDashboard";
import DashboardStatsCard from "@/components/dashboard/DashboardStatsCard.vue";
import DashboardChart from "@/components/dashboard/DashboardChart.vue";
import {prettyMoney} from "@/utils/utils";
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";

const {stats, loading, fetchStats} = useDashboard();

// Date range state
const dateRange = ref("THIS_MONTH");
const startDate = ref("");
const endDate = ref("");

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
  refreshStats();
};

const refreshStats = () => {
  fetchStats({
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
  });
};

// Initial Load
onMounted(() => {
  // Set default range
  const {start, end} = calculateDateRange("THIS_MONTH");
  startDate.value = start;
  endDate.value = end;
  refreshStats();
});

// Format helpers
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Status colors
const getPaymentStatusColor = (status) => {
  const map = {
    PAID: "success",
    PENDING: "warning",
    CANCELLED: "error",
    OVERDUE: "error",
    REFUNDED: "info",
  };
  return map[status] || "secondary";
};

const getStatusText = (status) => {
  const map = {
    PAID: "Tasdiqlangan",
    PENDING: "Kutilmoqda",
    CANCELLED: "Bekor qilingan",
    OVERDUE: "Muddati o'tgan",
    REFUNDED: "Qaytarilgan",
  };
  return map[status] || status;
};
</script>

<template>
  <div>
    <!-- Header & Filters -->
    <VRow class="mb-4 align-center">
      <VCol cols="12" md="6">
        <h2 class="text-h4 font-weight-bold">Dashboard</h2>
      </VCol>
      <VCol cols="12" md="6">
        <VRow class="justify-end">
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
          <VCol cols="6" md="4">
            <AppDateTimePicker
              v-model="startDate"
              placeholder="Dan"
              density="compact"
              hide-details
              @update:model-value="refreshStats"
            />
          </VCol>
          <VCol cols="6" md="4">
            <AppDateTimePicker
              v-model="endDate"
              placeholder="Gacha"
              density="compact"
              hide-details
              @update:model-value="refreshStats"
            />
          </VCol>
        </VRow>
      </VCol>
    </VRow>

    <!-- KPI Cards -->
    <VRow>
      <VCol cols="12" sm="6" md="3">
        <DashboardStatsCard
          title="Jami tushum"
          :value="prettyMoney(stats?.metrics?.revenue || 0) + ' so\'m'"
          icon="tabler-currency-dollar"
          color="success"
          :loading="loading"
        />
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <DashboardStatsCard
          title="Yangi o'quvchilar"
          :value="stats?.metrics?.newStudents || 0"
          icon="tabler-user-plus"
          color="info"
          :loading="loading"
        />
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <DashboardStatsCard
          title="Faol o'quvchilar"
          :value="stats?.metrics?.activeStudents || 0"
          icon="tabler-users"
          color="primary"
          :loading="loading"
        />
      </VCol>
      <VCol cols="12" sm="6" md="3">
        <DashboardStatsCard
          title="Faol guruhlar"
          :value="stats?.metrics?.activeGroups || 0"
          icon="tabler-school"
          color="warning"
          :loading="loading"
        />
      </VCol>
    </VRow>

    <!-- Chart -->
    <VRow class="mt-2">
      <VCol cols="12">
        <DashboardChart :data="stats?.chart || []" :loading="loading" />
      </VCol>
    </VRow>

    <!-- Tables Row -->
    <VRow class="mt-2">
      <!-- Recent Payments -->
      <VCol cols="12" md="6">
        <VCard title="Oxirgi to'lovlar">
          <VTable>
            <thead>
              <tr>
                <th>O'quvchi</th>
                <th>Summa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="3" class="text-center py-4">
                  <VProgressCircular
                    indeterminate
                    size="20"
                    width="2"
                    color="primary"
                  />
                </td>
              </tr>
              <tr v-else-if="!stats?.recentPayments?.length">
                <td colspan="3" class="text-center text-medium-emphasis py-4">
                  To'lovlar yo'q
                </td>
              </tr>
              <tr
                v-else
                v-for="payment in stats.recentPayments"
                :key="payment.id"
              >
                <td>
                  <div class="font-weight-medium">
                    {{ payment.studentName }}
                  </div>
                  <div class="text-caption text-disabled">
                    {{ payment.groupName }}
                  </div>
                </td>
                <td class="font-weight-bold">
                  {{ prettyMoney(payment.amount) }}
                </td>
                <td>
                  <VChip
                    size="x-small"
                    :color="getPaymentStatusColor(payment.status)"
                  >
                    {{ getStatusText(payment.status) }}
                  </VChip>
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCol>

      <!-- Top Debtors -->
      <VCol cols="12" md="6">
        <VCard title="Eng katta qarzdorliklar">
          <VTable>
            <thead>
              <tr>
                <th>O'quvchi</th>
                <th>Guruh</th>
                <th>Qarz</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="3" class="text-center py-4">
                  <VProgressCircular
                    indeterminate
                    size="20"
                    width="2"
                    color="primary"
                  />
                </td>
              </tr>
              <tr v-else-if="!stats?.topDebtors?.length">
                <td colspan="3" class="text-center text-medium-emphasis py-4">
                  Qarzdorlar yo'q
                </td>
              </tr>
              <tr
                v-else
                v-for="debtor in stats.topDebtors"
                :key="debtor.enrollmentId"
              >
                <td>
                  <div class="font-weight-medium">{{ debtor.studentName }}</div>
                  <div class="text-caption text-disabled">
                    {{ debtor.phone }}
                  </div>
                </td>
                <td>{{ debtor.groupName }}</td>
                <td class="text-error font-weight-bold">
                  {{ prettyMoney(debtor.balance) }}
                </td>
              </tr>
            </tbody>
          </VTable>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
