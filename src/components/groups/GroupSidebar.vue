<script setup>
import {prettyMoney, prettyPhoneNumber} from "@/utils/utils";

const props = defineProps({
  group: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "send-message",
  "edit",
  "toggle-status",
  "setup-telegram",
  "copy-link",
]);

const router = useRouter();

// Channel type detection
const isChannel = computed(() => props.group?.telegramResourceType === 'PRIVATE_CHANNEL');

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

const handleSendMessage = () => emit("send-message");
const handleEdit = () => emit("edit");
const handleToggleStatus = () => emit("toggle-status");
const handleSetupTelegram = () => emit("setup-telegram");
const handleCopyLink = () => emit("copy-link");
</script>

<template>
  <VCard class="mb-4">
    <VCardText class="d-flex flex-column gap-y-4">
      <!-- Header -->
      <div class="d-flex align-center mb-2">
        <VIcon :icon="isChannel ? 'tabler-broadcast' : 'tabler-users-group'" class="me-2" size="24" />
        <span class="text-h6 text-truncate" :title="group.name">{{
          group.name
        }}</span>
      </div>

      <!-- Channel/Group Type Badge -->
      <VChip
        v-if="isChannel"
        color="info"
        size="small"
        variant="tonal"
        class="mb-2"
      >
        <VIcon icon="tabler-broadcast" size="14" class="me-1" />
        Kanal
      </VChip>

      <!-- Status Chip -->
      <div>
        <VChip
          :color="getStatusConfig(group.status).color"
          size="small"
          variant="tonal"
          :prepend-icon="getStatusConfig(group.status).icon"
          class="w-100 justify-center"
        >
          {{ getStatusConfig(group.status).text }}
        </VChip>
      </div>

      <VDivider />

      <!-- Actions -->
      <div class="d-flex flex-column gap-2">
        <VBtn
          block
          color="info"
          variant="elevated"
          @click="handleSendMessage"
        >
          <VIcon icon="tabler-send" class="me-1" /> Xabar yuborish
        </VBtn>
        <VBtn block color="primary" variant="outlined" @click="handleEdit">
          <VIcon icon="tabler-edit" class="me-1" /> Tahrirlash
        </VBtn>
        <VBtn
          block
          :color="group.isActive ? 'error' : 'success'"
          variant="outlined"
          @click="handleToggleStatus"
        >
          <VIcon
            :icon="group.isActive ? 'tabler-x' : 'tabler-check'"
            class="me-1"
          />
          {{ group.isActive ? "Faolsizlantirish" : "Faollashtirish" }}
        </VBtn>
      </div>

      <VDivider />

      <!-- Info List -->
      <VList density="compact" class="bg-transparent pa-0">
        <VListItem class="px-0">
          <VListItemTitle class="text-caption text-medium-emphasis">
            {{ isChannel ? 'Kanal ID' : 'Guruh ID' }}
          </VListItemTitle>
          <VListItemSubtitle class="text-body-2 text-high-emphasis">{{
            group.id
          }}</VListItemSubtitle>
        </VListItem>

        <VListItem class="px-0">
          <VListItemTitle class="text-caption text-medium-emphasis"
            >Oylik to'lov</VListItemTitle
          >
          <VListItemSubtitle class="text-body-2 text-high-emphasis"
            >{{ prettyMoney(group.monthlyPrice) }} so'm</VListItemSubtitle
          >
        </VListItem>

        <!-- Payment Type (hidden for channels) -->
        <VListItem v-if="!isChannel" class="px-0">
          <VListItemTitle class="text-caption text-medium-emphasis"
            >To'lov turi</VListItemTitle
          >
          <VListItemSubtitle class="text-body-2 text-high-emphasis">{{
            getPaymentTypeText(group.paymentType)
          }}</VListItemSubtitle>
        </VListItem>

        <!-- Course Start Date (hidden for channels) -->
        <VListItem v-if="!isChannel" class="px-0">
          <VListItemTitle class="text-caption text-medium-emphasis"
            >Boshlanish sanasi</VListItemTitle
          >
          <VListItemSubtitle class="text-body-2 text-high-emphasis">{{
            formatDate(group.courseStartDate)
          }}</VListItemSubtitle>
        </VListItem>

        <!-- Course End Date (hidden for channels) -->
        <VListItem v-if="!isChannel" class="px-0">
          <VListItemTitle class="text-caption text-medium-emphasis"
            >Tugash sanasi</VListItemTitle
          >
          <VListItemSubtitle class="text-body-2 text-high-emphasis">{{
            formatDate(group.courseEndDate)
          }}</VListItemSubtitle>
        </VListItem>

        <!-- Lesson Schedule (hidden for channels) -->
        <VListItem v-if="!isChannel" class="px-0">
          <VListItemTitle class="text-caption text-medium-emphasis"
            >Dars jadvali</VListItemTitle
          >
          <VListItemSubtitle class="text-body-2 text-high-emphasis">{{
            formatSchedule(group.lessonSchedules)
          }}</VListItemSubtitle>
        </VListItem>
      </VList>

      <!-- Teachers (hidden for channels) -->
      <template v-if="!isChannel">
        <VDivider />

        <div>
          <div class="text-caption text-medium-emphasis mb-1">
            O'qituvchilar
          </div>
          <div
            v-for="teacher in group.groupTeachers"
            :key="teacher.id"
            class="text-body-2 font-weight-medium"
          >
            {{ teacher.teacher.firstName }} {{ teacher.teacher.lastName }}
          </div>
        </div>
      </template>

      <!-- Telegram -->
      <div
        v-if="group.status === 'PENDING' && group.connectToken"
        class="mt-2"
      >
        <VBtn
          block
          color="warning"
          variant="tonal"
          size="small"
          @click="handleSetupTelegram"
        >
          <VIcon icon="tabler-brand-telegram" class="me-1" /> Ulanish
        </VBtn>
      </div>
      <div v-else-if="group.joinLink" class="mt-2">
        <VBtn
          block
          color="success"
          variant="tonal"
          size="small"
          @click="handleCopyLink"
        >
          <VIcon icon="tabler-copy" class="me-1" /> Linkni nusxalash
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>
