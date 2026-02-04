<script setup>
import {prettyMoney, prettyPhoneNumber} from "@/utils/utils";

const props = defineProps({
  students: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Object,
    required: true,
  },
  summary: {
    type: Object,
    default: () => ({total: 0, trialCount: 0, activeCount: 0}),
  },
});

const emit = defineEmits([
  "update:pagination",
  "view-student",
  "open-activation",
  "open-discount",
  "open-add-balance",
  "open-message",
  "open-telegram",
  "open-expel",
]);

const onPageChange = (page) => {
  emit("update:pagination", {...props.pagination, page});
};

const onLimitChange = (limit) => {
  emit("update:pagination", {...props.pagination, limit, page: 1});
};

// Get student status config
const getStudentStatusConfig = (status) => {
  switch (status) {
    case "LEAD":
      return {color: "info", text: "Lead"};
    case "TRIAL":
      return {color: "warning", text: "Sinov darsidagi"};
    case "PENDING_JOIN":
      return {color: "info", text: "Guruhga ulanish kutilmoqda"};
    case "ACTIVE":
      return {color: "success", text: "Faol"};
    case "FROZEN":
      return {color: "warning", text: "Muzlatilgan"};
    case "EXPELLED":
      return {color: "error", text: "Chiqarilgan"};
    case "COMPLETED":
      return {color: "primary", text: "Tugatgan"};
    case "DROPPED":
      return {color: "secondary", text: "Tashlab ketgan"};
    case "LEFT_GROUP":
      return {color: "error", text: "Guruhdan chiqqan"};
    default:
      return {color: "default", text: status};
  }
};
</script>

<template>
  <div>
    <VCardText>
      <VAlert type="info" variant="tonal" class="mb-4">
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div>
            <div class="text-body-1 font-weight-medium mb-1">
              Jami: {{ summary.total }} ta
            </div>
            <div class="text-body-2">
              Sinov darsidagi: {{ summary.trialCount }} ta | 
              Faol: {{ summary.activeCount }} ta
            </div>
          </div>
        </div>
      </VAlert>
    </VCardText>
    <VTable>
      <thead>
        <tr>
          <th>ID</th>
          <th>O'quvchi</th>
          <th>Status</th>
          <th>Balans</th>
          <th>Amallar</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="5" class="text-center py-8">
            <VProgressCircular indeterminate color="primary" />
          </td>
        </tr>
        <tr v-else-if="students.length === 0">
          <td colspan="5" class="text-center py-8">
            <div class="text-body-1 text-medium-emphasis">
              Telegram orqali qo'shilgan o'quvchilar topilmadi
            </div>
          </td>
        </tr>
        <tr v-else v-for="student in students" :key="student.enrollmentId">
          <td>
            <span class="text-caption text-medium-emphasis">#{{ student.student.id }}</span>
          </td>
          <td>
            <div class="d-flex flex-column">
              <a
                class="font-weight-medium text-primary cursor-pointer"
                @click="$emit('view-student', student.student)"
              >
                {{ student.student.firstName }} {{ student.student.lastName }}
              </a>
              <span class="text-caption text-medium-emphasis">
                {{ prettyPhoneNumber(student.student.phoneNumber) }}
              </span>
            </div>
          </td>
          <td>
            <VChip
              size="small"
              :color="getStudentStatusConfig(student.status).color"
              class="text-capitalize"
            >
              {{ getStudentStatusConfig(student.status).text }}
            </VChip>
          </td>
          <td>
            <span
              :class="student.balance < 0 ? 'text-error' : 'text-success'"
              class="font-weight-medium"
            >
              {{ prettyMoney(student.balance) }} so'm
            </span>
          </td>
          <td>
            <div class="d-flex align-center gap-2">
              <VBtn
                icon
                size="small"
                color="default"
                variant="text"
                @click="$emit('view-student', student.student)"
              >
                <VIcon icon="tabler-eye" />
                <VTooltip activator="parent" location="top">Profilni ko'rish</VTooltip>
              </VBtn>

              <VMenu>
                <template #activator="{props}">
                  <VBtn
                    size="small"
                    color="primary"
                    variant="tonal"
                    v-bind="props"
                  >
                    Amallar
                    <VIcon icon="tabler-chevron-down" size="16" class="ms-1" />
                  </VBtn>
                </template>
                <VList>
                  <VListItem
                    v-if="student.status === 'TRIAL'"
                    @click="$emit('open-activation', student)"
                  >
                    <template #prepend><VIcon icon="tabler-check" color="success" /></template>
                    <VListItemTitle>Faollashtirish</VListItemTitle>
                  </VListItem>
                  <VListItem @click="$emit('open-discount', student)">
                    <template #prepend><VIcon icon="tabler-discount" color="primary" /></template>
                    <VListItemTitle>Chegirma belgilash</VListItemTitle>
                  </VListItem>
                  <VListItem @click="$emit('open-add-balance', student)">
                    <template #prepend><VIcon icon="tabler-cash" color="success" /></template>
                    <VListItemTitle>To'lov qo'shish</VListItemTitle>
                  </VListItem>
                  <VListItem @click="$emit('open-message', student)">
                    <template #prepend><VIcon icon="tabler-send" color="info" /></template>
                    <VListItemTitle>Xabar yuborish</VListItemTitle>
                  </VListItem>
                  <VListItem
                    v-if="student.telegramInfo?.username"
                    @click="$emit('open-telegram', student.telegramInfo.username)"
                  >
                    <template #prepend><VIcon icon="tabler-brand-telegram" color="primary" /></template>
                    <VListItemTitle>Telegramdan yozish</VListItemTitle>
                  </VListItem>
                  <VListItem @click="$emit('open-expel', student)">
                    <template #prepend><VIcon icon="tabler-user-x" color="error" /></template>
                    <VListItemTitle>Guruhdan chetlatish</VListItemTitle>
                  </VListItem>
                </VList>
              </VMenu>
            </div>
          </td>
        </tr>
      </tbody>
    </VTable>
    <!-- Pagination -->
    <VCardText v-if="pagination.totalPages > 1">
      <VRow class="align-center">
        <VCol cols="12" md="6">
          <div class="d-flex align-center gap-2">
            <span class="text-body-2">Sahifada:</span>
            <VSelect
              :model-value="pagination.limit"
              :items="[10, 20, 50, 100]"
              density="compact"
              variant="outlined"
              style="max-width: 100px"
              @update:model-value="onLimitChange"
            />
          </div>
        </VCol>
        <VCol cols="12" md="6" class="d-flex justify-end">
          <VPagination
            :model-value="pagination.page"
            :length="pagination.totalPages"
            :total-visible="5"
            @update:model-value="onPageChange"
          />
        </VCol>
      </VRow>
      <div class="text-body-2 text-center mt-2">
        Jami: {{ pagination.total }} ta o'quvchi
      </div>
    </VCardText>
  </div>
</template>
