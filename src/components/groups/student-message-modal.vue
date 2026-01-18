<script setup>
import AppTextarea from "@/@core/components/app-form-elements/AppTextarea.vue";
import {useToast} from "@/composables/useToast";
import {$api} from "@/utils/api";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  enrollment: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "messageSent"]);

const {success: showSuccess, error: showError} = useToast();

// Form state
const message = ref("");
const sendLoading = ref(false);

// Computed
const studentName = computed(() => {
  if (!props.enrollment) return "";
  const student = props.enrollment.student;
  return (
    `${student?.firstName || student?.user?.firstName || ""} ${student?.lastName || student?.user?.lastName || ""}`.trim() ||
    "O'quvchi"
  );
});

const canSend = computed(() => {
  return message.value.trim().length > 0;
});

// Methods
const sendMessage = async () => {
  if (!canSend.value || !props.enrollment) {
    showError("Iltimos, xabar matnini kiriting");
    return;
  }

  sendLoading.value = true;
  try {
    const response = await $api(
      `/v1/enrollments/${props.enrollment.id}/send-message`,
      {
        method: "POST",
        body: {
          message: message.value,
        },
      }
    );

    if (response.success) {
      showSuccess(response.message || "Xabar muvaffaqiyatli yuborildi!");
      emit("messageSent");
      closeModal();
    } else {
      showError(response.message || "Xabar yuborishda xatolik yuz berdi");
    }
  } catch (error) {
    console.error("Error sending message:", error);
    showError(error.data?.message || "Xabar yuborishda xatolik yuz berdi");
  } finally {
    sendLoading.value = false;
  }
};

const closeModal = () => {
  message.value = "";
  emit("update:modelValue", false);
};

// Reset form when modal closes
watch(
  () => props.modelValue,
  (newVal) => {
    if (!newVal) {
      message.value = "";
    }
  }
);
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="500"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <VIcon icon="tabler-send" class="me-2" color="primary" />
          <span>O'quvchiga xabar yuborish</span>
        </div>
        <VBtn
          icon="tabler-x"
          variant="text"
          size="small"
          @click="closeModal"
          :disabled="sendLoading"
        />
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!-- Student Info -->
        <VAlert type="info" variant="tonal" density="compact" class="mb-4">
          <div class="d-flex align-center">
            <VIcon icon="tabler-user" size="18" class="me-2" />
            <span>
              <strong>{{ studentName }}</strong> ga Telegram orqali xabar
              yuboriladi
            </span>
          </div>
        </VAlert>

        <!-- Message Input -->
        <AppTextarea
          v-model="message"
          label="Xabar matni *"
          placeholder="Assalomu alaykum! Sizga muhim xabar bor..."
          rows="4"
        />
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="secondary"
          variant="outlined"
          @click="closeModal"
          :disabled="sendLoading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          variant="elevated"
          :disabled="!canSend"
          :loading="sendLoading"
          @click="sendMessage"
        >
          <VIcon icon="tabler-send" class="me-1" />
          Yuborish
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
