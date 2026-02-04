<script setup>
import {prettyMoney} from "@/utils/utils";

const props = defineProps({
  logs: {
    type: Array,
    default: () => [],
  },
});

// Format date
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ru-RU");
};

// Format status
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
</script>

<template>
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
      <tr v-for="log in logs" :key="log.id">
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
      <tr v-if="logs.length === 0">
        <td colspan="5" class="text-center py-4 text-disabled">
          O'zgarishlar tarixi bo'sh
        </td>
      </tr>
    </tbody>
  </VTable>
</template>
