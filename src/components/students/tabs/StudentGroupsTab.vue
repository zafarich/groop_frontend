<script setup>
import {prettyMoney} from "@/utils/utils";

const props = defineProps({
  groups: {
    type: Array,
    default: () => [],
  },
  student: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits([
  "activate",
  "discount",
  "add-balance",
  "message",
  "expel",
]);

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

const canActivate = (status) => ["LEAD", "TRIAL"].includes(status);
</script>

<template>
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
          <div :class="item.balance < 0 ? 'text-error' : 'text-success'">
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
                  v-if="canActivate(item.status)"
                  @click="$emit('activate', item)"
                >
                  <template #prepend>
                    <VIcon icon="tabler-check" size="20" />
                  </template>
                  <VListItemTitle>Faollashtirish</VListItemTitle>
                </VListItem>
                <VListItem @click="$emit('discount', item)">
                  <template #prepend>
                    <VIcon icon="tabler-percentage" size="20" />
                  </template>
                  <VListItemTitle>Chegirma belgilash</VListItemTitle>
                </VListItem>
                <VListItem @click="$emit('add-balance', item)">
                  <template #prepend>
                    <VIcon icon="tabler-plus" size="20" />
                  </template>
                  <VListItemTitle>To'lov qo'shish</VListItemTitle>
                </VListItem>
                <VListItem @click="$emit('message', item)">
                  <template #prepend>
                    <VIcon icon="tabler-brand-telegram" size="20" />
                  </template>
                  <VListItemTitle>Xabar yuborish</VListItemTitle>
                </VListItem>
                <VDivider />
                <VListItem
                  class="text-error"
                  @click="$emit('expel', item)"
                >
                  <template #prepend>
                    <VIcon icon="tabler-ban" size="20" />
                  </template>
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
</template>
