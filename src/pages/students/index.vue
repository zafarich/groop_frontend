<script setup>
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";
import AppTextarea from "@/@core/components/app-form-elements/AppTextarea.vue";
import {useToast} from "@/composables/useToast";
import {useQueryParams} from "@/composables/useQueryParams";
import {$api} from "@/utils/api";
import {prettyMoney, prettyPhoneNumber} from "@/utils/utils";

definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();
const {success: showSuccess, error: showError} = useToast();

// State
const students = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const groupFilter = ref(null);
const groups = ref([]);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});

// Group selection modal state
const showGroupSelectionModal = ref(false);
const selectedStudent = ref(null);
const studentEnrollments = ref([]);
const enrollmentsLoading = ref(false);
const selectedEnrollmentId = ref(null);

// Add balance modal state
const showAddBalanceModal = ref(false);
const selectedBalanceEnrollment = ref(null);
const balanceForm = ref({
  amount: 0,
  amountDisplay: "",
  notes: "",
});
const balanceLoading = ref(false);

// Fetch groups for filter dropdown
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

// Fetch students
const fetchStudents = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (searchQuery.value.trim()) {
      params.append("search", searchQuery.value.trim());
    }
    if (groupFilter.value) {
      params.append("groupId", groupFilter.value.toString());
    }

    const res = await $api(`/v1/students?${params.toString()}`);
    if (res.success) {
      students.value = res.data?.data || [];
      pagination.value = {
        ...pagination.value,
        total: res.data?.meta?.total || 0,
        totalPages: res.data?.meta?.totalPages || 0,
      };
    }
  } catch (err) {
    console.error(err);
    showError("O'quvchilarni yuklashda xatolik");
  } finally {
    loading.value = false;
  }
};

// Search debounce

// Navigate to student profile
const viewStudent = (student) => {
  router.push(`/students/${student.id}`);
};

// Open telegram chat
const openTelegram = (username) => {
  if (username) {
    window.open(`https://t.me/${username}`, "_blank");
  }
};

// Fetch student enrollments
const fetchStudentEnrollments = async (studentId) => {
  enrollmentsLoading.value = true;
  try {
    const res = await $api(`/v1/students/${studentId}/enrollments`);
    if (res.success && res.data) {
      // Map the response to match expected structure and filter active enrollments
      const enrollmentsData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      studentEnrollments.value = enrollmentsData
        .filter((e) => e.status !== "EXPELLED" && e.status !== "LEFT_GROUP")
        .map((e) => ({
          id: e.enrollmentId,
          status: e.status,
          balance: e.balance,
          group: {
            id: e.groupId,
            name: e.groupName,
          },
          student: selectedStudent.value,
        }));
    }
  } catch (err) {
    console.error(err);
    showError("Guruhlar ro'yxatini yuklashda xatolik");
  } finally {
    enrollmentsLoading.value = false;
  }
};

// Open group selection modal for balance top-up
const openGroupSelectionModal = async (student) => {
  selectedStudent.value = student;
  selectedEnrollmentId.value = null;
  await fetchStudentEnrollments(student.id);

  if (studentEnrollments.value.length === 0) {
    showError("O'quvchi hech qanday faol guruhda emas");
    return;
  }

  showGroupSelectionModal.value = true;
};

// Proceed to balance modal after group selection
const proceedToBalanceModal = () => {
  if (!selectedEnrollmentId.value) {
    showError("Iltimos, guruhni tanlang");
    return;
  }

  const enrollment = studentEnrollments.value.find(
    (e) => e.id === selectedEnrollmentId.value
  );

  if (!enrollment) {
    showError("Tanlangan guruh topilmadi");
    return;
  }

  selectedBalanceEnrollment.value = enrollment;
  balanceForm.value = {
    amount: 0,
    amountDisplay: "",
    notes: "",
  };

  showGroupSelectionModal.value = false;
  showAddBalanceModal.value = true;
};

// Format balance amount
const formatBalanceAmount = (value) => {
  const numericValue = value.replace(/\s/g, "");
  const number = parseInt(numericValue, 10);
  if (isNaN(number)) {
    balanceForm.value.amount = 0;
    balanceForm.value.amountDisplay = "";
  } else {
    balanceForm.value.amount = number;
    balanceForm.value.amountDisplay = prettyMoney(number);
  }
};

// Add balance
const addBalance = async () => {
  if (!selectedBalanceEnrollment.value) return;
  if (!balanceForm.value.amount || balanceForm.value.amount <= 0) {
    showError("Iltimos, to'lov summasini kiriting");
    return;
  }

  balanceLoading.value = true;
  try {
    const response = await $api(
      `/v1/enrollments/${selectedBalanceEnrollment.value.id}/add-balance`,
      {
        method: "POST",
        body: {
          amount: balanceForm.value.amount,
          notes: balanceForm.value.notes || "",
        },
      },
    );

    if (response.success) {
      const previousBalance = response.data.previousBalance;
      const newBalance = response.data.newBalance;
      showSuccess(
        `To'lov muvaffaqiyatli qo'shildi! Balans: ${prettyMoney(previousBalance)} → ${prettyMoney(newBalance)} so'm`,
      );
      showAddBalanceModal.value = false;
      await fetchStudents();
    }
  } catch (error) {
    console.error("Error adding balance:", error);
    showError(error.data?.message || "To'lov qo'shishda xatolik yuz berdi");
  } finally {
    balanceLoading.value = false;
  }
};

// Initialize query params sync
useQueryParams({
  filters: {
    search: searchQuery,
    groupId: groupFilter,
  },
  pagination: pagination,
  fetchData: fetchStudents,
  defaultFilters: {
    search: "",
    groupId: null,
  },
  defaultLimit: 20,
  debounceTime: 500,
});

// Load groups on mount (students will be loaded by useQueryParams)
onMounted(() => {
  fetchGroups();
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardTitle
          class="d-flex align-center justify-space-between flex-wrap gap-4"
        >
          <div class="d-flex align-center">
            <VIcon icon="tabler-school" class="me-2" />
            <span>O'quvchilar ro'yxati</span>
          </div>
        </VCardTitle>

        <VDivider />

        <!-- Filters -->
        <VCardText>
          <VRow>
            <VCol cols="12" md="5">
              <AppTextField
                v-model="searchQuery"
                placeholder="Ism, telefon yoki Telegram bo'yicha qidirish..."
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
                clearable
              />
            </VCol>
          </VRow>
        </VCardText>

        <!-- Students Table -->
        <VTable>
          <thead>
            <tr>
              <th>O'quvchi</th>
              <th>Telegram</th>
              <th>Guruhlar</th>
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
                  O'quvchilar topilmadi
                </div>
              </td>
            </tr>
            <tr v-else v-for="student in students" :key="student.id">
              <td>
                <div class="d-flex flex-column">
                  <span class="font-weight-medium">
                    {{ student.firstName }} {{ student.lastName }}
                  </span>
                  <span class="text-caption text-medium-emphasis">
                    {{ prettyPhoneNumber(student.phoneNumber) }}
                  </span>
                </div>
              </td>
              <td>
                <a
                  v-if="student.telegramUsername"
                  :href="`https://t.me/${student.telegramUsername}`"
                  target="_blank"
                  class="text-primary"
                >
                  @{{ student.telegramUsername }}
                </a>
                <span v-else class="text-disabled">-</span>
              </td>
              <td>
                <VChip size="small" color="info" variant="tonal">
                  {{ student.enrollmentsCount }} guruh
                </VChip>
                <VChip
                  v-if="student.activeEnrollmentsCount > 0"
                  size="small"
                  color="success"
                  variant="tonal"
                  class="ms-1"
                >
                  {{ student.activeEnrollmentsCount }} faol
                </VChip>
              </td>
              <td>
                <span
                  :class="
                    student.totalBalance < 0 ? 'text-error' : 'text-success'
                  "
                >
                  {{ prettyMoney(student.totalBalance) }} so'm
                </span>
              </td>
              <td>
                <div class="d-flex align-center gap-2">
                  <VBtn
                    icon
                    size="small"
                    color="default"
                    variant="text"
                    @click="viewStudent(student)"
                  >
                    <VIcon icon="tabler-eye" />
                    <VTooltip activator="parent" location="top"
                      >Profilni ko'rish</VTooltip
                    >
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
                        <VIcon
                          icon="tabler-chevron-down"
                          size="16"
                          class="ms-1"
                        />
                      </VBtn>
                    </template>
                    <VList>
                      <VListItem @click="openGroupSelectionModal(student)">
                        <template #prepend
                          ><VIcon icon="tabler-cash" color="success"
                        /></template>
                        <VListItemTitle>To'lov qo'shish</VListItemTitle>
                      </VListItem>
                      <VListItem
                        v-if="student.telegramUsername"
                        @click="openTelegram(student.telegramUsername)"
                      >
                        <template #prepend
                          ><VIcon
                            icon="tabler-brand-telegram"
                            color="primary"
                        /></template>
                        <VListItemTitle>Telegramdan yozish</VListItemTitle>
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
                :length="pagination.totalPages"
                :total-visible="5"
              />
            </VCol>
          </VRow>
          <div class="text-body-2 text-center mt-2">
            Jami: {{ pagination.total }} ta o'quvchi
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Group Selection Modal -->
  <VDialog v-model="showGroupSelectionModal" max-width="600">
    <VCard v-if="selectedStudent">
      <VCardTitle class="text-h5 pt-4 px-6">
        <VIcon icon="tabler-cash" class="me-2" color="success" />
        Guruhni tanlang
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Student Info -->
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-1">
            <strong>O'quvchi:</strong>
            {{ selectedStudent.firstName }} {{ selectedStudent.lastName }}
          </div>
          <div class="text-body-2 mt-1">
            <strong>Telefon:</strong>
            {{ prettyPhoneNumber(selectedStudent.phoneNumber) }}
          </div>
        </VAlert>

        <!-- Enrollments Loading -->
        <div v-if="enrollmentsLoading" class="text-center py-4">
          <VProgressCircular indeterminate color="primary" />
        </div>

        <!-- No Enrollments -->
        <VAlert
          v-else-if="studentEnrollments.length === 0"
          type="warning"
          variant="tonal"
        >
          <div class="text-body-2">
            O'quvchi hech qanday faol guruhda emas
          </div>
        </VAlert>

        <!-- Enrollments List -->
        <div v-else>
          <div class="text-body-2 text-medium-emphasis mb-3">
            To'lov qo'shish uchun guruhni tanlang:
          </div>
          <VRadioGroup v-model="selectedEnrollmentId">
            <VRadio
              v-for="enrollment in studentEnrollments"
              :key="enrollment.id"
              :value="enrollment.id"
            >
              <template #label>
                <div class="d-flex flex-column">
                  <span class="font-weight-medium">{{ enrollment.group.name }}</span>
                  <div class="text-caption text-medium-emphasis">
                    Balans:
                    <span
                      :class="{
                        'text-success': enrollment.balance >= 0,
                        'text-error': enrollment.balance < 0,
                      }"
                    >
                      {{ prettyMoney(enrollment.balance) }} so'm
                    </span>
                  </div>
                </div>
              </template>
            </VRadio>
          </VRadioGroup>
        </div>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showGroupSelectionModal = false"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          @click="proceedToBalanceModal"
          :disabled="!selectedEnrollmentId || enrollmentsLoading"
        >
          Davom etish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Add Balance Modal -->
  <VDialog v-model="showAddBalanceModal" max-width="600">
    <VCard v-if="selectedBalanceEnrollment">
      <VCardTitle class="text-h5 pt-4 px-6">
        <VIcon icon="tabler-cash" class="me-2" color="success" />
        To'lov qo'shish
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Student and Group Info -->
        <VAlert type="info" variant="tonal" class="mb-4">
          <div class="text-body-1">
            <strong>O'quvchi:</strong>
            {{ selectedBalanceEnrollment.student.firstName }}
            {{ selectedBalanceEnrollment.student.lastName }}
          </div>
          <div class="text-body-2 mt-1">
            <strong>Guruh:</strong>
            {{ selectedBalanceEnrollment.group.name }}
          </div>
          <div class="text-body-2 mt-1">
            <strong class="mr-2">Hozirgi balans:</strong>
            <span
              :class="{
                'text-success': selectedBalanceEnrollment.balance > 0,
                'text-error': selectedBalanceEnrollment.balance < 0,
              }"
            >
              {{ prettyMoney(selectedBalanceEnrollment.balance) }} so'm
            </span>
          </div>
        </VAlert>

        <VRow>
          <!-- Amount Input -->
          <VCol cols="12">
            <AppTextField
              v-model="balanceForm.amountDisplay"
              label="To'lov summasi *"
              placeholder="50 000"
              @input="formatBalanceAmount($event.target.value)"
            >
              <template #append-inner>
                <span class="text-body-2 text-medium-emphasis">so'm</span>
              </template>
            </AppTextField>
          </VCol>

          <!-- Notes Input -->
          <VCol cols="12">
            <AppTextarea
              v-model="balanceForm.notes"
              label="Izoh"
              placeholder="Masalan: Telegram orqali qabul qilingan to'lov"
              rows="3"
            />
          </VCol>
        </VRow>

        <!-- Preview new balance -->
        <VAlert
          v-if="balanceForm.amount > 0"
          type="success"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          <div class="text-body-2">
            Yangi balans:
            {{
              prettyMoney(
                Number(selectedBalanceEnrollment.balance) + balanceForm.amount,
              )
            }}
            so'm
          </div>
        </VAlert>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="showAddBalanceModal = false"
          :disabled="balanceLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="success"
          variant="elevated"
          @click="addBalance"
          :loading="balanceLoading"
          :disabled="balanceLoading || balanceForm.amount <= 0"
        >
          <VIcon icon="tabler-check" class="me-1" />
          Qo'shish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
