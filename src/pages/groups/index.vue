<script setup>
import TelegramSetupModal from "@/components/TelegramSetupModal.vue";
import {$api} from "@/utils/api";
definePage({
  meta: {
    layout: "default",
  },
});

const router = useRouter();

// Telegram setup modal state
const showTelegramSetupModal = ref(false);
const connectToken = ref("");

// State
const groups = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const statusFilter = ref("");
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

// Delete state
const isDeleteDialogVisible = ref(false);
const groupToDelete = ref(null);
const deleteLoading = ref(false);

// Status options
const statusOptions = [
  {title: "Barchasi", value: ""},
  {title: "Telegram guruhga ulanish kutilmoqda", value: "PENDING"},
  {title: "Faol", value: "ACTIVE"},
  {title: "Faol emas", value: "INACTIVE"},
];

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

// Get primary teacher name
const getPrimaryTeacher = (groupTeachers) => {
  if (!groupTeachers || groupTeachers.length === 0) return "-";
  const primary = groupTeachers.find((gt) => gt.isPrimary);
  const teacher = primary ? primary.teacher : groupTeachers[0]?.teacher;
  if (!teacher) return "-";
  return `${teacher.firstName} ${teacher.lastName}`;
};

// Format price with thousands separator
const formatPrice = (price) => {
  if (!price) return "-";
  return Number(price).toLocaleString("uz-UZ") + " so'm";
};

// Get status color and text
const getStatusConfig = (status) => {
  switch (status) {
    case "ACTIVE":
      return {color: "success", text: "Faol"};
    case "PENDING":
      return {color: "warning", text: "Telegram guruhga ulanish kutilmoqda"};
    case "INACTIVE":
      return {color: "error", text: "Faol emas"};
    default:
      return {color: "default", text: status};
  }
};

// Fetch groups
const fetchGroups = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (searchQuery.value.trim()) {
      params.append("search", searchQuery.value.trim());
    }

    if (statusFilter.value) {
      params.append("status", statusFilter.value);
    }

    const response = await $api(`/v1/groups?${params.toString()}`, {
      method: "GET",
    });

    if (response.success && response.data) {
      groups.value = response.data || [];
      pagination.value = {
        page: response.meta.page,
        limit: response.meta.limit,
        total: response.meta.total,
        totalPages: response.meta.totalPages,
      };
    }
  } catch (error) {
    console.error("Error fetching groups:", error);
  } finally {
    loading.value = false;
  }
};

// Search handler with debounce
const searchTimeout = ref(null);
const onSearch = () => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  searchTimeout.value = setTimeout(() => {
    pagination.value.page = 1;
    fetchGroups();
  }, 500);
};

// Status filter handler
const onStatusChange = () => {
  pagination.value.page = 1;
  fetchGroups();
};

// Pagination handlers
const onPageChange = (page) => {
  pagination.value.page = page;
  fetchGroups();
};

const onLimitChange = (limit) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  fetchGroups();
};

// Navigate to create page
const goToCreate = () => {
  router.push("/groups/create");
};

// Open telegram setup modal

const openTelegramSetupModal = (token) => {
  connectToken.value = token;
  showTelegramSetupModal.value = true;
};

// Handle Telegram setup modal close
const handleSetupModalClose = () => {
  showTelegramSetupModal.value = false;
};

// Delete handlers
const onDeleteClick = (group) => {
  groupToDelete.value = group;
  isDeleteDialogVisible.value = true;
};

const onDeleteConfirm = async () => {
  if (!groupToDelete.value) return;

  deleteLoading.value = true;
  try {
    const response = await $api(`/v1/groups/${groupToDelete.value.id}`, {
      method: "DELETE",
    });

    if (response.success) {
      isDeleteDialogVisible.value = false;
      groupToDelete.value = null;
      fetchGroups();
    }
  } catch (error) {
    console.error("Error deleting group:", error);
  } finally {
    deleteLoading.value = false;
  }
};

// Load groups on mount
onMounted(() => {
  fetchGroups();
});
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <!-- Header -->
        <VCardTitle
          class="d-flex align-center justify-space-between flex-wrap gap-4"
        >
          <div class="d-flex align-center">
            <VIcon icon="tabler-users-group" class="me-2" />
            <span>Guruhlar ro'yxati</span>
          </div>
          <VBtn color="primary" @click="goToCreate">
            <VIcon icon="tabler-plus" class="me-1" />
            Guruh yaratish
          </VBtn>
        </VCardTitle>

        <VDivider />

        <!-- Filters -->
        <VCardText>
          <VRow>
            <VCol cols="12" md="4">
              <AppTextField
                v-model="searchQuery"
                placeholder="Guruh nomi bo'yicha qidirish..."
                @input="onSearch"
              >
                <template #prepend-inner>
                  <VIcon icon="tabler-search" />
                </template>
              </AppTextField>
            </VCol>
            <VCol cols="12" md="3">
              <AppSelect
                v-model="statusFilter"
                :items="statusOptions"
                @update:model-value="onStatusChange"
              />
            </VCol>
          </VRow>
        </VCardText>

        <!-- Groups Table -->
        <VTable>
          <thead>
            <tr>
              <th>ID</th>
              <th>Guruh nomi</th>
              <!-- <th>O'qituvchi</th> -->
              <th>Narx</th>
              <!-- <th>Dars jadvali</th> -->
              <th>Status</th>
              <th>Telegram</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-8">
                <VProgressCircular indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="groups.length === 0">
              <td colspan="7" class="text-center py-8">
                <div class="text-body-1 text-medium-emphasis">
                  Guruhlar topilmadi
                </div>
              </td>
            </tr>
            <tr v-else v-for="group in groups" :key="group.id">
              <td>{{ group.id }}</td>
              <td>
                <div class="font-weight-medium">{{ group.name }}</div>
                <!-- <div
                  class="text-caption text-medium-emphasis"
                  v-if="group.description"
                >
                  {{ group.description }}
                </div> -->
              </td>
              <!-- <td>{{ getPrimaryTeacher(group.groupTeachers) }}</td> -->
              <td>{{ formatPrice(group.monthlyPrice) }}</td>
              <!-- <td>
                <div class="text-caption">
                  {{ formatSchedule(group.lessonSchedules) }}
                </div>
              </td> -->
              <td>
                <VChip
                  :color="getStatusConfig(group.status).color"
                  size="small"
                  variant="tonal"
                >
                  {{ getStatusConfig(group.status).text }}
                </VChip>
              </td>
              <td>
                <VBtn
                  v-if="group.status === 'PENDING'"
                  size="small"
                  color="info"
                  variant="text"
                  prepend-icon="tabler-link"
                  @click="openTelegramSetupModal(group.connectToken)"
                >
                  Telegram guruhga ulash
                </VBtn>

                <VChip
                  size="small"
                  v-else
                  text="Telegram guruhga ulangan"
                  color="success"
                />
              </td>
              <td>
                <VBtn
                  size="small"
                  color="info"
                  variant="text"
                  icon="tabler-eye"
                  @click="router.push(`/groups/${group.id}`)"
                />
                <VBtn
                  size="small"
                  color="primary"
                  variant="text"
                  icon="tabler-edit"
                  @click="router.push(`/groups/edit/${group.id}`)"
                />
                <VBtn
                  size="small"
                  color="error"
                  variant="text"
                  icon="tabler-trash"
                  @click="onDeleteClick(group)"
                />
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
            Jami: {{ pagination.total }} ta guruh
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Telegram Setup Modal -->
  <TelegramSetupModal
    v-model="showTelegramSetupModal"
    :connect-token="connectToken"
    @close="handleSetupModalClose"
  />
  <!-- Delete Confirmation Dialog -->
  <VDialog v-model="isDeleteDialogVisible" max-width="500">
    <VCard>
      <VCardTitle class="text-h5 pt-4 px-6">Guruhni o'chirish</VCardTitle>
      <VCardText>
        Siz haqiqatan ham "{{ groupToDelete?.name }}" guruhini
        o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="isDeleteDialogVisible = false"
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
