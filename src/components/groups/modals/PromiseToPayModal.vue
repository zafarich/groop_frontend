<script setup>
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";
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
  groupId: {
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "success"]);

const {success: showSuccess, error: showError} = useToast();

// State
const promisedDate = ref("");
const notes = ref("");
const loading = ref(false);

// Reset form when modal opens
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    promisedDate.value = "";
    notes.value = "";
  }
});

const closeModal = () => {
  emit("update:modelValue", false);
};

const savePromise = async () => {
  if (!promisedDate.value) {
    showError("Iltimos, to'lov vaqtini tanlang");
    return;
  }

  if (!props.enrollment) {
    showError("O'quvchi ma'lumotlari topilmadi");
    return;
  }

  loading.value = true;
  try {
    const response = await $api(
      `/v1/groups/${props.groupId}/promises-to-pay`,
      {
        method: "POST",
        body: {
          enrollmentId: props.enrollment.id,
          promisedDate: promisedDate.value,
          notes: notes.value || undefined,
        },
      },
    );

    if (response.success) {
      showSuccess("To'lov va'dasi muvaffaqiyatli saqlandi");
      emit("success");
      closeModal();
    }
  } catch (error) {
    console.error("Error creating promise to pay:", error);
    showError(error.data?.message || "Saqlashda xatolik yuz berdi");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="closeModal"
    max-width="500"
  >
    <VCard>
      <VCardTitle class="pa-4 d-flex justify-space-between align-center">
        <span class="text-h6">To'lov va'dasi berish</span>
        <VBtn
          icon="tabler-x"
          variant="text"
          density="compact"
          @click="closeModal"
        />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <VRow>
          <VCol cols="12">
            <div class="mb-4">
              <div class="text-subtitle-2 mb-1">O'quvchi</div>
              <div class="text-body-1">
                {{ enrollment?.student?.firstName }} {{ enrollment?.student?.lastName }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ enrollment?.student?.user?.phoneNumber }}
              </div>
            </div>
          </VCol>

          <VCol cols="12">
            <AppDateTimePicker
              v-model="promisedDate"
              label="To'lov vaqti *"
              placeholder="To'lov qilish sanasini tanlang"
              :config="{ 
                dateFormat: 'Y-m-d',
                minDate: 'today'
              }"
            />
          </VCol>

          <VCol cols="12">
            <VTextarea
              v-model="notes"
              label="Izohlar"
              placeholder="Qo'shimcha izohlar (ixtiyoriy)"
              rows="3"
              auto-grow
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn
          variant="outlined"
          color="secondary"
          @click="closeModal"
          :disabled="loading"
        >
          Bekor qilish
        </VBtn>
        <VBtn
          color="primary"
          @click="savePromise"
          :loading="loading"
          :disabled="!promisedDate"
        >
          Saqlash
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
