<script setup>
import TelegramSetupModal from "@/components/TelegramSetupModal.vue";
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";
import {prettyMoney, prettyPhoneNumber} from "@/utils/utils";

definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();
const route = useRoute();
const {success: showSuccess, error: showError} = useToast();

// State
const groupId = computed(() => route.params.id);
const group = ref(null);
const loading = ref(false);
const activeTab = ref("leads");

// Telegram setup modal state
const showTelegramSetupModal = ref(false);

// Status change state
const isStatusDialogVisible = ref(false);
const statusLoading = ref(false);

// Students state
const students = ref([]);
const studentsLoading = ref(false);
const studentsPagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});
const studentsSearch = ref("");

// Get day name in Uzbek
const getDayName = (dayOfWeek) => {
  const days = ["", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];
  return days[dayOfWeek] || "";
};

// Format schedule display
const formatSchedule = (lessonSchedules) => {
  if (!lessonSchedules || lessonSchedules.length === 0) return "-";
  return lessonSchedules
    .map((s) => `${getDayName(s.dayOfWeek)} ${s.startTime}-${s.endTime}`)
    .join(", ");
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

// Get status config
const getStatusConfig = (status) => {
  switch (status) {
    case "ACTIVE":
      return {color: "success", text: "Faol", icon: "tabler-check"};
    case "PENDING":
      return {
        color: "warning",
        text: "Telegram guruhga ulanish kutilmoqda",
        icon: "tabler-clock",
      };
    case "INACTIVE":
      return {color: "error", text: "Faol emas", icon: "tabler-x"};
    default:
      return {color: "default", text: status, icon: "tabler-help"};
  }
};

// Get payment type text
const getPaymentTypeText = (paymentType) => {
  const types = {
    START_TO_END_OF_MONTH: "Oyning boshidan oxirigacha",
    MONTHLY_SAME_DATE: "Har oy bir xil sanada",
    LESSON_BASED: "Darslar asosida",
  };
  return types[paymentType] || paymentType;
};

// Get student status config
const getStudentStatusConfig = (status) => {
  switch (status) {
    case "LEAD":
      return {color: "info", text: "Lead"};
    case "TRIAL":
      return {color: "warning", text: "Sinov darsidagi"};
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
    default:
      return {color: "default", text: status};
  }
};

// Fetch group details
const fetchGroupDetails = async () => {
  loading.value = true;
  try {
    const response = await $api(`/v1/groups/${groupId.value}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      group.value = response.data;
    }
  } catch (error) {
    console.error("Error fetching group details:", error);
    showError("Guruh ma'lumotlarini yuklashda xatolik");
  } finally {
    loading.value = false;
  }
};

// Fetch students
const fetchStudents = async () => {
  studentsLoading.value = true;
  try {
    const params = new URLSearchParams({
      page: studentsPagination.value.page.toString(),
      limit: studentsPagination.value.limit.toString(),
    });

    // Add status filter based on active tab
    if (activeTab.value === "leads") {
      params.append("status", "LEAD");
    } else if (activeTab.value === "trial") {
      params.append("status", "TRIAL");
    } else if (activeTab.value === "active") {
      params.append("status", "ACTIVE");
    }

    if (studentsSearch.value.trim()) {
      params.append("search", studentsSearch.value.trim());
    }

    const response = await $api(
      `/v1/groups/${groupId.value}/students?${params.toString()}`,
      {
        method: "GET",
      }
    );

    if (response.success && response.data) {
      students.value = response.data || [];
      studentsPagination.value = {
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      };
    }
  } catch (error) {
    console.error("Error fetching students:", error);
    showError("O'quvchilar ro'yxatini yuklashda xatolik");
  } finally {
    studentsLoading.value = false;
  }
};

// Search handler with debounce
const searchTimeout = ref(null);
const onStudentsSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    studentsPagination.value.page = 1;
    fetchStudents();
  }, 500);
};

// Tab change handler
const onTabChange = () => {
  studentsPagination.value.page = 1;
  fetchStudents();
};

// Pagination handlers
const onStudentsPageChange = (page) => {
  studentsPagination.value.page = page;
  fetchStudents();
};

const onStudentsLimitChange = (limit) => {
  studentsPagination.value.limit = limit;
  studentsPagination.value.page = 1;
  fetchStudents();
};

// Open telegram setup modal
const openTelegramSetupModal = () => {
  showTelegramSetupModal.value = true;
};

// Handle Telegram setup modal close
const handleSetupModalClose = () => {
  showTelegramSetupModal.value = false;
  fetchGroupDetails();
};

// Copy join link to clipboard
const copyJoinLink = async () => {
  if (!group.value?.joinLink) return;

  try {
    await navigator.clipboard.writeText(group.value.joinLink);
    showSuccess("Havola nusxalandi");
  } catch (error) {
    console.error("Failed to copy link:", error);
    showError("Havolani nusxalashda xatolik");
  }
};

// Navigate to edit page
const goToEdit = () => {
  router.push(`/groups/edit/${groupId.value}`);
};

// Status change handlers
const openStatusDialog = () => {
  isStatusDialogVisible.value = true;
};

const onStatusChange = async () => {
  statusLoading.value = true;
  try {
    const newStatus = group.value.isActive ? "INACTIVE" : "ACTIVE";
    const response = await $api(`/v1/groups/${groupId.value}/status`, {
      method: "PATCH",
      body: {isActive: !group.value.isActive},
    });

    if (response.success) {
      showSuccess(
        `Guruh ${newStatus === "ACTIVE" ? "faollashtirildi" : "faolsizlantirildi"}`
      );
      isStatusDialogVisible.value = false;
      fetchGroupDetails();
    }
  } catch (error) {
    console.error("Error changing status:", error);
    showError("Statusni o'zgartirishda xatolik");
  } finally {
    statusLoading.value = false;
  }
};

// Load data on mount
onMounted(() => {
  fetchGroupDetails();
  fetchStudents();
});

// Watch tab changes
watch(activeTab, () => {
  onTabChange();
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- Back Button -->
      <VBtn
        variant="text"
        color="primary"
        prepend-icon="tabler-arrow-left"
        class="mb-4"
        @click="router.push('/groups')"
      >
        Orqaga
      </VBtn>

      <!-- Loading State -->
      <VCard v-if="loading">
        <VCardText class="text-center py-8">
          <VProgressCircular indeterminate color="primary" />
        </VCardText>
      </VCard>

      <!-- Group Details -->
      <template v-else-if="group">
        <!-- Header Card -->
        <VCard class="mb-4">
          <VCardTitle
            class="d-flex align-center justify-space-between flex-wrap gap-4"
          >
            <div class="d-flex align-center">
              <VIcon icon="tabler-users-group" class="me-2" size="28" />
              <span>{{ group.name }}</span>
            </div>
            <div class="d-flex gap-2">
              <VBtn color="primary" variant="outlined" @click="goToEdit">
                <VIcon icon="tabler-edit" class="me-1" />
                Tahrirlash
              </VBtn>
              <VBtn
                :color="group.isActive ? 'error' : 'success'"
                variant="outlined"
                @click="openStatusDialog"
              >
                <VIcon
                  :icon="group.isActive ? 'tabler-x' : 'tabler-check'"
                  class="me-1"
                />
                {{ group.isActive ? "Faolsizlantirish" : "Faollashtirish" }}
              </VBtn>
            </div>
          </VCardTitle>

          <VDivider />

          <VCardText>
            <VRow>
              <!-- Basic Information -->
              <VCol cols="12" md="6">
                <h3 class="text-h6 mb-3">Asosiy ma'lumotlar</h3>
                <VList density="compact" class="bg-transparent">
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Guruh ID
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1 font-weight-medium">
                      {{ group.id }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Tavsif
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ group.description || "-" }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Oylik to'lov
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1 font-weight-medium">
                      {{ prettyMoney(group.monthlyPrice) }} so'm
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      To'lov turi
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ getPaymentTypeText(group.paymentType) }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem v-if="group.lessonsPerPaymentPeriod" class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Darslar soni (to'lov davri)
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ group.lessonsPerPaymentPeriod }} ta
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Status
                    </VListItemTitle>
                    <VListItemSubtitle>
                      <VChip
                        :color="getStatusConfig(group.status).color"
                        size="small"
                        variant="tonal"
                        :prepend-icon="getStatusConfig(group.status).icon"
                      >
                        {{ getStatusConfig(group.status).text }}
                      </VChip>
                    </VListItemSubtitle>
                  </VListItem>
                </VList>
              </VCol>

              <!-- Dates and Schedule -->
              <VCol cols="12" md="6">
                <h3 class="text-h6 mb-3">Kurs muddati va jadval</h3>
                <VList density="compact" class="bg-transparent">
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Boshlanish sanasi
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ formatDate(group.courseStartDate) }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Tugash sanasi
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ formatDate(group.courseEndDate) }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem class="px-0">
                    <VListItemTitle class="text-body-2 text-medium-emphasis">
                      Dars jadvali
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ formatSchedule(group.lessonSchedules) }}
                    </VListItemSubtitle>
                  </VListItem>
                </VList>
              </VCol>

              <!-- Teachers -->
              <VCol cols="12">
                <h3 class="text-h6 mb-3">O'qituvchilar</h3>
                <VRow>
                  <VCol cols="12" md="4">
                    <div class="d-flex gap-2">
                      <h5
                        v-for="teacher in group.groupTeachers"
                        :key="teacher.id"
                      >
                        {{ teacher.teacher.firstName }}
                        {{ teacher.teacher.lastName }},
                      </h5>
                    </div>
                  </VCol>
                </VRow>
              </VCol>

              <!-- Discounts -->
              <VCol
                v-if="group.discounts && group.discounts.length > 0"
                cols="12"
              >
                <h3 class="text-h6 mb-3">Chegirmalar</h3>
                <VRow>
                  <VCol
                    v-for="discount in group.discounts"
                    :key="discount.months"
                    cols="12"
                    md="3"
                  >
                    <VCard variant="outlined">
                      <VCardText>
                        <div class="text-center">
                          <div class="text-h6 text-primary">
                            {{ discount.months }} oy
                          </div>
                          <div class="text-body-2 text-medium-emphasis">
                            {{ prettyMoney(discount.discountAmount) }} so'm
                          </div>
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </VCol>

              <!-- Telegram Connection -->
              <VCol cols="12">
                <h3 class="text-h6 mb-3">Telegram ulanishi</h3>

                <!-- Not Connected -->
                <VAlert
                  v-if="group.status === 'PENDING' && group.connectToken"
                  type="warning"
                  variant="tonal"
                  class="mb-0"
                >
                  <div
                    class="d-flex align-center justify-space-between flex-wrap gap-4"
                  >
                    <div>
                      <div class="text-body-1 font-weight-medium mb-1">
                        Telegram guruhga ulanmagan
                      </div>
                      <div class="text-body-2">
                        Guruh to'liq ishlashi uchun telegram guruhga ulash kerak
                      </div>
                    </div>
                    <VBtn
                      color="warning"
                      variant="elevated"
                      @click="openTelegramSetupModal"
                    >
                      <VIcon icon="tabler-brand-telegram" class="me-1" />
                      Telegram guruhga ulash
                    </VBtn>
                  </div>
                </VAlert>

                <!-- Connected -->
                <VAlert
                  v-else-if="group.joinLink"
                  type="success"
                  variant="tonal"
                  class="mb-0"
                >
                  <div>
                    <div class="text-body-1 font-weight-medium mb-2">
                      <VIcon icon="tabler-check" class="me-1" />
                      Telegram guruhga ulangan
                    </div>
                    <div class="text-body-2 mb-3">
                      O'quvchilar qo'shilish havolasi:
                    </div>
                    <div class="d-flex align-center gap-2">
                      <VTextField
                        :model-value="group.joinLink"
                        readonly
                        density="compact"
                        variant="outlined"
                        hide-details
                      />
                      <VBtn
                        color="success"
                        variant="elevated"
                        @click="copyJoinLink"
                      >
                        <VIcon icon="tabler-copy" class="me-1" />
                        Nusxalash
                      </VBtn>
                    </div>
                  </div>
                </VAlert>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Students Section -->
        <VCard>
          <VCardTitle>
            <VIcon icon="tabler-users" class="me-2" />
            O'quvchilar
          </VCardTitle>

          <VDivider />

          <!-- Tabs -->
          <VTabs v-model="activeTab" bg-color="transparent">
            <VTab value="leads">Lead o'quvchilar</VTab>
            <VTab value="trial">Sinov darsidagi o'quvchilar</VTab>
            <VTab value="active">Aktiv o'quvchilar</VTab>
          </VTabs>

          <VDivider />

          <!-- Search -->
          <VCardText>
            <VRow>
              <VCol cols="12" md="4">
                <AppTextField
                  v-model="studentsSearch"
                  placeholder="O'quvchi nomi bo'yicha qidirish..."
                  @input="onStudentsSearch"
                >
                  <template #prepend-inner>
                    <VIcon icon="tabler-search" />
                  </template>
                </AppTextField>
              </VCol>
            </VRow>
          </VCardText>

          <!-- Students Table -->
          <VTable>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ism</th>
                <th>Familiya</th>
                <th>Telefon</th>
                <th>Status</th>
                <th>Qo'shilgan sana</th>
                <th>Balans</th>
                <th v-if="activeTab === 'active'">Dars boshlanish</th>
                <th v-if="activeTab === 'active'">Chegirma</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="studentsLoading">
                <td
                  :colspan="activeTab === 'active' ? 9 : 7"
                  class="text-center py-8"
                >
                  <VProgressCircular indeterminate color="primary" />
                </td>
              </tr>
              <tr v-else-if="students.length === 0">
                <td
                  :colspan="activeTab === 'active' ? 9 : 7"
                  class="text-center py-8"
                >
                  <div class="text-body-1 text-medium-emphasis">
                    O'quvchilar topilmadi
                  </div>
                </td>
              </tr>
              <tr v-else v-for="student in students" :key="student.id">
                <td>{{ student.student.id }}</td>
                <td>{{ student.student.firstName }}</td>
                <td>{{ student.student.lastName }}</td>
                <td>
                  {{ prettyPhoneNumber(student.student.user.phoneNumber) }}
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
                <td>{{ formatDate(student.joinedAt) }}</td>
                <td>
                  <span
                    :class="{
                      'text-success': student.balance > 0,
                      'text-error': student.balance < 0,
                    }"
                  >
                    {{ prettyMoney(student.balance) }} so'm
                  </span>
                </td>
                <td v-if="activeTab === 'active'">
                  {{ formatDate(student.lessonStartDate) }}
                </td>
                <td v-if="activeTab === 'active'">
                  <span v-if="student.individualDiscountAmount > 0">
                    {{ prettyMoney(student.individualDiscountAmount) }} so'm
                  </span>
                  <span v-else-if="student.isFreeEnrollment">
                    <VChip size="small" color="success" variant="tonal">
                      Bepul
                    </VChip>
                  </span>
                  <span v-else>-</span>
                </td>
              </tr>
            </tbody>
          </VTable>

          <!-- Pagination -->
          <VCardText v-if="studentsPagination.totalPages > 1">
            <VRow class="align-center">
              <VCol cols="12" md="6">
                <div class="d-flex align-center gap-2">
                  <span class="text-body-2">Sahifada:</span>
                  <VSelect
                    :model-value="studentsPagination.limit"
                    :items="[10, 20, 50, 100]"
                    density="compact"
                    variant="outlined"
                    style="max-width: 100px"
                    @update:model-value="onStudentsLimitChange"
                  />
                </div>
              </VCol>
              <VCol cols="12" md="6" class="d-flex justify-end">
                <VPagination
                  :model-value="studentsPagination.page"
                  :length="studentsPagination.totalPages"
                  :total-visible="5"
                  @update:model-value="onStudentsPageChange"
                />
              </VCol>
            </VRow>
            <div class="text-body-2 text-center mt-2">
              Jami: {{ studentsPagination.total }} ta o'quvchi
            </div>
          </VCardText>
        </VCard>
      </template>
    </VCol>
  </VRow>

  <!-- Telegram Setup Modal -->
  <TelegramSetupModal
    v-if="group"
    v-model="showTelegramSetupModal"
    :connect-token="group.connectToken"
    @close="handleSetupModalClose"
  />

  <!-- Status Change Confirmation Dialog -->
  <VDialog v-model="isStatusDialogVisible" max-width="500">
    <VCard>
      <VCardTitle class="text-h5 pt-4 px-6"> Statusni o'zgartirish </VCardTitle>
      <VCardText>
        Siz haqiqatan ham guruh statusini
        <strong>{{
          group?.isActive ? "faolsizlantirmoqchi" : "faollashtirmoqchi"
        }}</strong>
        misiz?
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="isStatusDialogVisible = false"
          :disabled="statusLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          :color="group?.isActive ? 'error' : 'success'"
          variant="elevated"
          @click="onStatusChange"
          :loading="statusLoading"
          :disabled="statusLoading"
        >
          Tasdiqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
