<script setup>
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue";
import {prettyPhoneNumber} from "@/utils/utils";

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
  search: {
    type: String,
    default: "",
  },
  statusFilter: {
    type: String,
    default: "all",
  },
  sortBy: {
    type: String,
    default: "joinedAt",
  },
  sortOrder: {
    type: String,
    default: "desc",
  },
  activatableStudentsCount: {
    type: Number,
    default: 0,
  },
  activatableStudentsLoading: {
    type: Boolean,
    default: false,
  },
  isChannel: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "update:search",
  "update:statusFilter",
  "update:sortBy",
  "update:sortOrder",
  "update:pagination",
  "search",
  "open-bulk-activation",
  "view-student",
  "open-activation",
  "open-discount",
  "open-add-balance",
  "open-message",
  "open-telegram",
  "open-expel",
]);

const router = useRouter();

const localSearch = computed({
  get: () => props.search,
  set: (val) => emit("update:search", val),
});

const localStatusFilter = computed({
  get: () => props.statusFilter,
  set: (val) => emit("update:statusFilter", val),
});

const localSortBy = computed({
  get: () => props.sortBy,
  set: (val) => {
    emit("update:sortBy", val);
    emit("search");
  },
});

const toggleSortOrder = () => {
  const newOrder = props.sortOrder === "asc" ? "desc" : "asc";
  emit("update:sortOrder", newOrder);
  emit("search");
};

const onPageChange = (page) => {
  emit("update:pagination", {...props.pagination, page});
};

const onLimitChange = (limit) => {
  emit("update:pagination", {...props.pagination, limit, page: 1});
};

const onSearchInput = () => {
  emit("search");
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

const viewStudentProfile = (student) => {
  emit("view-student", student);
};

const openTelegram = (username) => {
  emit("open-telegram", username);
};
</script>

<template>
  <div>
    <VCardText>
      <VRow>
        <!-- Search -->
        <VCol cols="12" md="4">
          <AppTextField
            v-model="localSearch"
            placeholder="Qidirish..."
            hide-details
            @input="onSearchInput"
          >
            <template #prepend-inner>
              <VIcon icon="tabler-search" />
            </template>
          </AppTextField>
        </VCol>

        <!-- Status Filter -->
        <VCol cols="12" md="3">
          <VSelect
            v-model="localStatusFilter"
            :items="[
              {title: 'Aktiv', value: 'active'},
              {title: 'Barchasi', value: 'all'},
              {title: 'Sinov', value: 'trial'},
              {title: 'Lead', value: 'leads'},
              {title: 'Guruhdan chiqqan', value: 'left_group'},
              {title: 'Chetlatilgan', value: 'expelled'},
            ]"
            label="Status"
            hide-details
          />
        </VCol>

        <!-- Sort Controls -->
        <VCol cols="12" md="4">
          <VSelect
            v-model="localSortBy"
            :items="[
              {title: 'ID', value: 'id'},
              {title: 'Qoshilgan sana', value: 'joinedAt'},
              {title: 'Status', value: 'status'},
              {title: 'Balans', value: 'balance'},
              {title: 'Ism', value: 'studentName'},
            ]"
            label="Saralash"
            hide-details
          />
        </VCol>

        <VCol cols="12" md="1">
          <VBtn
            variant="outlined"
            size="small"
            @click="toggleSortOrder"
            :icon="sortOrder === 'asc' ? 'tabler-arrow-up' : 'tabler-arrow-down'"
          />
        </VCol>

        <!-- Bulk Action -->
        <VCol cols="12" md="4">
          <VBtn
            color="primary"
            variant="elevated"
            @click="$emit('open-bulk-activation')"
            :disabled="activatableStudentsCount === 0"
            :loading="activatableStudentsLoading"
          >
            <VIcon icon="tabler-users-plus" class="me-1" />
            Ommaviy faollashtirish
            <VChip
              v-if="activatableStudentsCount > 0"
              size="small"
              color="white"
              text-color="primary"
              class="ms-2"
            >
              {{ activatableStudentsCount }}
            </VChip>
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>

    <!-- Students Table -->
    <VTable>
      <thead>
        <tr>
          <th>ID</th>
          <th>Ism Familiya</th>
          <th>Status</th>
          <th>Balans</th>
          <th>Amallar</th>
        </tr>
      </thead>
      <tbody>
        <!-- Loading -->
        <tr v-if="loading">
          <td colspan="5" class="text-center py-8">
            <VProgressCircular indeterminate color="primary" />
          </td>
        </tr>
        <!-- Empty -->
        <tr v-else-if="students.length === 0">
          <td colspan="5" class="text-center py-8">
            <div class="text-body-1 text-medium-emphasis">
              {{ isChannel ? 'Obunachilar topilmadi' : "O'quvchilar topilmadi" }}
            </div>
          </td>
        </tr>
        <!-- Rows -->
        <tr v-else v-for="student in students" :key="student.id">
          <td>
            <span class="text-caption text-medium-emphasis">#{{ student.id }}</span>
          </td>
          <td>
            <div class="d-flex flex-column">
              <a
                class="font-weight-medium text-primary cursor-pointer"
                @click="viewStudentProfile(student)"
              >
                {{ student.student.firstName }}
                {{ student.student.lastName }}
              </a>
              <span class="text-caption text-medium-emphasis">
                {{ prettyPhoneNumber(student.student.user.phoneNumber) }}
              </span>
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
            <span
              :class="{
                'text-success': student.balance >= 0,
                'text-error': student.balance < 0,
              }"
            >
              {{ student.balance }} so'm
            </span>
          </td>

          <!-- Actions -->
          <td>
            <div class="d-flex align-center gap-2">
              <VBtn
                icon
                size="small"
                color="default"
                variant="text"
                @click="viewStudentProfile(student)"
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
                  <VListItem
                    v-if="
                      student.status === 'TRIAL' ||
                      student.status === 'LEAD'
                    "
                    @click="$emit('open-activation', student)"
                  >
                    <template #prepend
                      ><VIcon icon="tabler-check" color="success"
                    /></template>
                    <VListItemTitle>Faollashtirish</VListItemTitle>
                  </VListItem>
                  <VListItem @click="$emit('open-discount', student)">
                    <template #prepend
                      ><VIcon icon="tabler-discount" color="primary"
                    /></template>
                    <VListItemTitle>Chegirma belgilash</VListItemTitle>
                  </VListItem>
                  <VListItem @click="$emit('open-add-balance', student)">
                    <template #prepend
                      ><VIcon icon="tabler-cash" color="success"
                    /></template>
                    <VListItemTitle>To'lov qo'shish</VListItemTitle>
                  </VListItem>
                  <VListItem @click="$emit('open-message', student)">
                    <template #prepend
                      ><VIcon icon="tabler-send" color="info"
                    /></template>
                    <VListItemTitle>Xabar yuborish</VListItemTitle>
                  </VListItem>
                  <VListItem
                    v-if="student.student?.user?.telegramUser?.username"
                    @click="openTelegram(student.student.user.telegramUser.username)"
                  >
                    <template #prepend
                      ><VIcon
                        icon="tabler-brand-telegram"
                        color="primary"
                    /></template>
                    <VListItemTitle>Telegramdan yozish</VListItemTitle>
                  </VListItem>
                  <VListItem @click="$emit('open-expel', student)">
                    <template #prepend
                      ><VIcon icon="tabler-user-x" color="error"
                    /></template>
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
