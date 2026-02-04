<script setup>
import {prettyMoney} from "@/utils/utils";

const props = defineProps({
  payments: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["view-receipt", "edit", "delete"]);

// Format date
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ru-RU");
};
</script>

<template>
  <VTable class="text-no-wrap">
    <thead>
      <tr>
        <th>Guruh</th>
        <th>Summa</th>
        <th>Sana</th>
        <th>Amal turi</th>
        <th>Amallar</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="p in payments" :key="p.id">
        <td>{{ p.groupName }}</td>
        <td class="text-success font-weight-bold">
          +{{ prettyMoney(p.amount) }} {{ p.currency }}
        </td>
        <td>{{ formatDate(p.createdAt) }}</td>
        <td>
          <VChip size="small" color="success" variant="tonal">To'lov</VChip>
        </td>
        <td>
          <div class="d-flex gap-2">
            <VBtn
              icon
              variant="text"
              size="small"
              :color="p.receiptUrl ? 'info' : 'secondary'"
              :disabled="!p.receiptUrl"
              @click="$emit('view-receipt', p.receiptUrl)"
              title="Chekni ko'rish"
            >
              <VIcon icon="tabler-eye" size="20" />
            </VBtn>
            <VBtn
              icon
              variant="text"
              size="small"
              color="primary"
              @click="$emit('edit', p)"
              title="Tahrirlash"
            >
              <VIcon icon="tabler-edit" size="20" />
            </VBtn>
            <VBtn
              icon
              variant="text"
              size="small"
              color="error"
              @click="$emit('delete', p)"
              title="O'chirish"
            >
              <VIcon icon="tabler-trash" size="20" />
            </VBtn>
          </div>
        </td>
      </tr>
      <tr v-if="payments.length === 0">
        <td colspan="5" class="text-center py-4 text-disabled">
          To'lovlar tarixi bo'sh
        </td>
      </tr>
    </tbody>
  </VTable>
</template>
