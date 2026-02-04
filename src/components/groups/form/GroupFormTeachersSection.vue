<script setup>
const props = defineProps({
  teachers: {
    type: Array,
    required: true,
  },
  teachersList: {
    type: Array,
    default: () => [],
  },
  loadingTeachers: {
    type: Boolean,
    default: false,
  },
  rules: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["add", "remove", "set-primary"]);
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mt-4">
      <h3 class="text-h5">O'qituvchilar</h3>
      <VBtn
        size="small"
        color="primary"
        prepend-icon="tabler-plus"
        @click="$emit('add')"
      >
        O'qituvchi qo'shish
      </VBtn>
    </div>

    <VRow class="mt-2">
      <VCol
        v-for="(teacher, index) in teachers"
        :key="index"
        cols="12"
      >
        <VCard variant="outlined" class="pa-4">
          <VRow>
            <VCol cols="12" md="8">
              <AppSelect
                v-model="teacher.teacherId"
                :items="teachersList"
                label="O'qituvchi *"
                placeholder="O'qituvchini tanlang"
                :loading="loadingTeachers"
                :rules="[rules.required]"
              />
            </VCol>
            <VCol cols="12" md="4" class="d-flex gap-2">
              <VCheckbox
                :model-value="teacher.isPrimary"
                label="Asosiy o'qituvchi"
                class="mt-4 block"
                style="height: 40px"
                @update:model-value="$emit('set-primary', index)"
              />
              <VBtn
                v-if="teachers.length > 1"
                size="small"
                color="error"
                class="mt-4"
                variant="text"
                icon="tabler-trash"
                @click="$emit('remove', index)"
              />
            </VCol>
          </VRow>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
