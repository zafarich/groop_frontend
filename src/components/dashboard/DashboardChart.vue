<script setup>
import {computed} from "vue";

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
    // Expected format: [{ date: '2023-01-01', amount: 100 }, ...]
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const series = computed(() => [
  {
    name: "Tushum",
    data: props.data.map((item) => item.amount),
  },
]);

const chartOptions = computed(() => ({
  chart: {
    type: "area",
    toolbar: {show: false},
    fontFamily: "inherit",
    zoom: {enabled: false},
  },
  dataLabels: {enabled: false},
  stroke: {curve: "smooth", width: 2},
  xaxis: {
    categories: props.data.map((item) => item.date),
    axisBorder: {show: false},
    axisTicks: {show: false},
    labels: {
      style: {fontSize: "12px", colors: "rgba(var(--v-theme-on-surface), 0.6)"},
    },
  },
  yaxis: {
    labels: {
      style: {fontSize: "12px", colors: "rgba(var(--v-theme-on-surface), 0.6)"},
      formatter: (value) => {
        return new Intl.NumberFormat("uz-UZ", {
          notation: "compact",
          compactDisplay: "short",
        }).format(value);
      },
    },
  },
  grid: {
    borderColor: "rgba(var(--v-theme-on-surface), 0.1)",
    strokeDashArray: 4,
    padding: {top: -20, bottom: -10},
  },
  theme: {
    mode: "light",
    monochrome: {
      enabled: true,
      color: "#7367F0", // Primary color
      shadeTo: "light",
      shadeIntensity: 0.65,
    },
  },
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [50, 100],
    },
  },
  tooltip: {
    y: {
      formatter: function (val) {
        return new Intl.NumberFormat("uz-UZ").format(val) + " so'm";
      },
    },
  },
}));
</script>

<template>
  <VCard title="Tushumlar statistikasi">
    <VCardText>
      <div
        v-if="loading"
        class="d-flex justify-center align-center"
        style="height: 300px"
      >
        <VProgressCircular indeterminate color="primary" size="40" />
      </div>
      <div
        v-else-if="!data || data.length === 0"
        class="d-flex justify-center align-center text-medium-emphasis"
        style="height: 300px"
      >
        Ma'lumot topilmadi
      </div>
      <VueApexCharts
        v-else
        type="area"
        height="300"
        :options="chartOptions"
        :series="series"
      />
    </VCardText>
  </VCard>
</template>
