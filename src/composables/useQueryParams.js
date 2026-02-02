import {watch, nextTick, onMounted, computed} from "vue";
import {useRoute, useRouter} from "vue-router";

/**
 * Composable for syncing filters and pagination with URL query parameters
 */
export function useQueryParams({
  filters = {},
  pagination = null,
  fetchData = null,
  defaultFilters = {},
  debounceTime = 300,
  defaultLimit = 10,
}) {
  const route = useRoute();
  const router = useRouter();

  let isInitialized = false;
  let debounceTimer = null;

  // Build current params as a serialized string for comparison
  const buildParamsString = () => {
    const parts = [];
    Object.keys(filters).forEach((key) => {
      const value = filters[key].value;
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== defaultFilters[key]
      ) {
        parts.push(`${key}=${value}`);
      }
    });
    if (pagination) {
      parts.push(`page=${pagination.value.page}`);
      parts.push(`limit=${pagination.value.limit}`);
    }
    return parts.sort().join("&");
  };

  let lastParamsString = "";

  const initializeFromQuery = () => {
    const query = route.query;

    Object.keys(filters).forEach((key) => {
      const queryValue = query[key];
      if (
        queryValue !== undefined &&
        queryValue !== null &&
        queryValue !== ""
      ) {
        filters[key].value = queryValue;
      } else if (defaultFilters[key] !== undefined) {
        filters[key].value = defaultFilters[key];
      }
    });

    if (pagination) {
      pagination.value.page = parseInt(query.page) || 1;
      pagination.value.limit = parseInt(query.limit) || defaultLimit;
    }

    lastParamsString = buildParamsString();
  };

  const updateQueryParams = () => {
    const query = {};

    Object.keys(filters).forEach((key) => {
      const value = filters[key].value;
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== defaultFilters[key]
      ) {
        query[key] = String(value);
      }
    });

    if (pagination) {
      if (pagination.value.page > 1) {
        query.page = String(pagination.value.page);
      }
      if (pagination.value.limit !== defaultLimit) {
        query.limit = String(pagination.value.limit);
      }
    }

    router.replace({query}).catch(() => {});
  };

  const triggerUpdate = (resetPage = false) => {
    if (!isInitialized) return;

    const currentParams = buildParamsString();
    if (currentParams === lastParamsString && !resetPage) return;

    if (resetPage && pagination && pagination.value.page !== 1) {
      pagination.value.page = 1;
    }

    lastParamsString = buildParamsString();
    updateQueryParams();
    if (fetchData) fetchData();
  };

  const debouncedTrigger = (resetPage = false) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => triggerUpdate(resetPage), debounceTime);
  };

  // Single watcher for all filters
  Object.keys(filters).forEach((key) => {
    watch(
      () => filters[key].value,
      () => {
        if (isInitialized) debouncedTrigger(true);
      },
    );
  });

  // Single watcher for pagination
  if (pagination) {
    watch(
      () => pagination.value.page + ":" + pagination.value.limit,
      () => {
        if (isInitialized) triggerUpdate(false);
      },
    );
  }

  onMounted(async () => {
    initializeFromQuery();
    await nextTick(); // Wait for any pending watcher callbacks to complete
    isInitialized = true;
    if (fetchData) fetchData();
  });

  return {initializeFromQuery, updateQueryParams};
}
