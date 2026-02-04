<script setup>
const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  rules: {
    type: Object,
    required: true,
  },
  telegramResourceTypes: {
    type: Array,
    default: () => [],
  },
});

const isChannel = computed(() => props.form.telegramResourceType === 'PRIVATE_CHANNEL');
</script>

<template>
  <VRow>
    <VCol cols="12">
      <h3 class="text-h5">Asosiy ma'lumotlar</h3>
    </VCol>

    <VCol cols="12" md="6">
      <AppTextField
        v-model="form.name"
        :label="isChannel ? 'Kanal nomi *' : 'Guruh nomi *'"
        :placeholder="isChannel ? 'Kanal nomini kiriting' : 'Guruh nomini kiriting'"
        :rules="[rules.required]"
      />
    </VCol>

    <VCol cols="12" md="6">
      <AppSelect
        v-model="form.telegramResourceType"
        :items="telegramResourceTypes"
        label="Telegram turi *"
        :rules="[rules.required]"
      />
      <VAlert
        type="info"
        variant="tonal"
        density="compact"
        class="mt-2"
      >
        <template v-if="form.telegramResourceType === 'PRIVATE_GROUP'">
          <strong>Yopiq guruh:</strong> O'quvchilar xabar yozishi mumkin
        </template>
        <template v-else>
          <strong>Yopiq kanal:</strong> Faqat adminlar post qiladi, o'quvchilar faqat o'qiydi
        </template>
      </VAlert>
    </VCol>

    <VCol cols="12" md="6">
      <AppTextarea
        v-model="form.description"
        label="Tavsif - kurs haqida ma'lumot"
        placeholder="Guruh haqida qisqacha ma'lumot..."
        rows="3"
      />
      <div v-if="!isChannel">
        <VSwitch
          v-model="form.studentsCanWrite"
          label="Studentlar guruhga yoza oladimi?"
          color="primary"
          class="mt-2"
        />
        <VAlert
          type="info"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          Buni yoqib qo'ysangiz o'quvchi qarzdor bo'lsa telegram guruhga yoza olmaydi
        </VAlert>
      </div>
    </VCol>
  </VRow>
</template>
