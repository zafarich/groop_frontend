import {$api} from "@/utils/api";

export const useDashboard = () => {
  const stats = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const fetchStats = async (filters = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await $api(`/v1/dashboard/stats?${params.toString()}`);
      if (response.success) {
        stats.value = response.data.data || response.data;
      } else {
        error.value = response.message || "Failed to fetch dashboard stats";
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      error.value =
        err.message || "An error occurred while fetching dashboard stats";
    } finally {
      loading.value = false;
    }
  };

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};
