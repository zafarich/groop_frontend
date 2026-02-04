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
});

const emit = defineEmits(["edit-discount", "view-student"]);

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
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="text-h6">Chegirmali o'quvchilar</div>
        <div class="text-body-2 text-medium-emphasis">
          Jami: {{ students.length }} ta
        </div>
      </div>
    </VCardText>
    <VTable>
      <thead>
        <tr>
          <th>ID</th>
          <th>O'quvchi</th>
          <th>Status</th>
          <th>Maxsus narx</th>
          <th>Chegirma muddati</th>
          <th>Sabab</th>
          <th>Amallar</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="7" class="text-center py-8">
            <VProgressCircular indeterminate color="primary" />
          </td>
        </tr>
        <tr v-else-if="students.length === 0">
          <td colspan="7" class="text-center py-8">
            <div class="text-body-1 text-medium-emphasis">
              Chegirmali o'quvchilar yo'q
            </div>
          </td>
        </tr>
        <tr
          v-else
          v-for="student in students"
          :key="student.enrollmentId"
        >
          <td>{{ student.student.id }}</td>
          <td>
            <div class="d-flex flex-column">
              <a
                class="font-weight-medium text-primary cursor-pointer"
                @click="viewStudentProfile(student.student.id)"
              >
                {{ student.student.firstName }}
                {{ student.student.lastName }}
              </a>
              <span class="text-caption text-medium-emphasis">{{
                prettyPhoneNumber(student.student.phoneNumber)
              }}</span>
            </div>
          </td>
          <td>
            <VChip
              :color="getStudentStatusConfig(student.status).color"
              size="small"
              variant="tonal"
            >
              {{ getStudentStatusConfig(student.status).text }}
            </VChip>
          </td>
          <td>
            <span class="font-weight-medium text-primary">
              {{ prettyMoney(student.customMonthlyPrice) }} so'm
            </span>
            <div
              v-if="student.isFreeEnrollment"
              class="text-caption text-success"
            >
              Bepul
            </div>
          </td>
          <td>
            <div
              v-if="student.discountStartDate || student.discountEndDate"
              class="text-body-2"
            >
              {{
                student.discountStartDate
                  ? formatDate(student.discountStartDate)
                  : "Hozirdan"
              }}
              -
              {{
                student.discountEndDate
                  ? formatDate(student.discountEndDate)
                  : "Cheksiz"
              }}
            </div>
            <span v-else class="text-caption text-medium-emphasis"
              >Cheksiz</span
            >
          </td>
          <td>
            <span
              v-if="student.discountReason"
              class="text-body-2 text-truncate d-inline-block"
              style="max-width: 200px"
              :title="student.discountReason"
            >
              {{ student.discountReason }}
            </span>
            <span v-else class="text-caption text-disabled">-</span>
          </td>
          <td>
            <VBtn
              icon
              size="small"
              color="default"
              variant="text"
              @click="$emit('edit-discount', student)"
            >
              <VIcon icon="tabler-pencil" />
              <VTooltip activator="parent" location="top"
                >Tahrirlash</VTooltip
              >
            </VBtn>
          </td>
        </tr>
      </tbody>
    </VTable>
  </div>
</template>
