<script setup>
import {prettyMoney, prettyPhoneNumber} from "@/utils/utils";

const props = defineProps({
  debtors: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  summary: {
    type: Object,
    default: () => ({totalDebtors: 0, totalDebtAmount: "0"}),
  },
});

const emit = defineEmits(["open-bulk-expel", "view-student"]);

const router = useRouter();

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

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  let date = new Date(dateString);

  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  if (month < 10) {
    month = `0${month}`;
  }
  if (day < 10) {
    day = `0${day}`;
  }

  return `${day}.${month}.${year}`;
};

const viewStudentProfile = (studentId) => {
  emit("view-student", studentId);
};
</script>

<template>
  <div>
    <VCardText>
      <VAlert type="error" variant="tonal" class="mb-0">
        <div
          class="d-flex align-center justify-space-between flex-wrap gap-4"
        >
          <div>
            <div class="text-body-1 font-weight-medium mb-1">
              Jami qarzdorlar: {{ summary.totalDebtors }} ta
            </div>
            <div class="text-body-2">
              Jami qarz:
              {{ prettyMoney(summary.totalDebtAmount) }} so'm
            </div>
          </div>
          <VBtn
            v-if="debtors.length > 0"
            color="error"
            variant="elevated"
            @click="$emit('open-bulk-expel')"
          >
            <VIcon icon="tabler-user-x" class="me-1" />
            Qarzdorlarni guruhdan chiqarish
          </VBtn>
        </div>
      </VAlert>
    </VCardText>
    <VTable>
      <thead>
        <tr>
          <th>ID</th>
          <th>Ism</th>
          <th>Familiya</th>
          <th>Telefon</th>
          <th>Status</th>
          <th>Oylik narx</th>
          <th>Qarz miqdori</th>
          <th>Oxirgi to'lov</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="8" class="text-center py-8">
            <VProgressCircular indeterminate color="primary" />
          </td>
        </tr>
        <tr v-else-if="debtors.length === 0">
          <td colspan="8" class="text-center py-8">
            <div class="d-flex flex-column align-center">
              <VIcon
                icon="tabler-check-circle"
                size="48"
                color="success"
                class="mb-2"
              />
              <div class="text-body-1 text-medium-emphasis">
                Qarzdor o'quvchilar yo'q 🎉
              </div>
            </div>
          </td>
        </tr>
        <tr v-else v-for="debtor in debtors" :key="debtor.enrollmentId">
          <td>{{ debtor.student.id }}</td>
          <td>
            <a
              class="font-weight-medium text-primary cursor-pointer"
              @click="viewStudentProfile(debtor.student.id)"
            >
              {{ debtor.student.firstName }}
            </a>
          </td>
          <td>
            <a
              class="font-weight-medium text-primary cursor-pointer"
              @click="viewStudentProfile(debtor.student.id)"
            >
              {{ debtor.student.lastName }}
            </a>
          </td>
          <td>{{ prettyPhoneNumber(debtor.student.phoneNumber) }}</td>
          <td>
            <VChip
              :color="getStudentStatusConfig(debtor.status).color"
              size="small"
              variant="tonal"
            >
              {{ getStudentStatusConfig(debtor.status).text }}
            </VChip>
          </td>
          <td>
            <span v-if="debtor.customMonthlyPrice">
              {{ prettyMoney(debtor.effectiveMonthlyPrice) }} so'm
              <VChip
                size="x-small"
                color="info"
                variant="tonal"
                class="ms-1"
              >
                Maxsus
              </VChip>
            </span>
            <span v-else>
              {{ prettyMoney(debtor.effectiveMonthlyPrice) }} so'm
            </span>
          </td>
          <td>
            <span class="text-error font-weight-medium">
              -{{ prettyMoney(debtor.debtAmount) }} so'm
            </span>
          </td>
          <td>{{ formatDate(debtor.lastPaymentDate) }}</td>
        </tr>
      </tbody>
    </VTable>
  </div>
</template>
