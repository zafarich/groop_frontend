# Query Parameters Sync Guide

This guide explains how to sync filters and pagination with URL query parameters using the `useQueryParams` composable.

## Features

- **Persistent State**: Filters and pagination are saved in URL query params
- **Shareable URLs**: Users can share URLs with specific filters applied
- **Back/Forward Navigation**: Browser back/forward buttons work with filters
- **Page Refresh**: Filters persist across page refreshes

## Usage

### Basic Setup

```javascript
import {useQueryParams} from "@/composables/useQueryParams";

// Define your refs
const searchQuery = ref("");
const statusFilter = ref("");
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

// Initialize the composable
useQueryParams({
  filters: {
    search: searchQuery,
    status: statusFilter,
  },
  pagination: pagination,
  fetchData: fetchYourData,
  defaultFilters: {
    search: "",
    status: "",
  },
});
```

### Parameters

- **filters**: Object containing your filter refs
  ```javascript
  filters: {
    search: searchQuery,      // ref
    status: statusFilter,     // ref
    category: categoryFilter, // ref
  }
  ```

- **pagination**: Pagination ref with page and limit
  ```javascript
  pagination: ref({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  ```

- **fetchData**: Function to call when params change
  ```javascript
  fetchData: async () => {
    // Your data fetching logic
  }
  ```

- **defaultFilters**: Default values for filters (optional)
  ```javascript
  defaultFilters: {
    search: "",
    status: "",
    category: "all",
  }
  ```

### What's Automatic

The composable handles:
1. Reading query params on page load
2. Updating query params when filters change
3. Updating query params when pagination changes
4. Calling `fetchData()` when params change

### What You Still Handle

1. **Debounced Search**: Keep your debounce logic for search inputs
   ```javascript
   const searchTimeout = ref(null);
   const onSearch = () => {
     if (searchTimeout.value) {
       clearTimeout(searchTimeout.value);
     }
     searchTimeout.value = setTimeout(() => {
       pagination.value.page = 1; // Reset to first page
     }, 500);
   };
   ```

2. **Data Fetching**: Your `fetchData` function remains unchanged

3. **Event Handlers**: Remove `fetchData()` calls from handlers since the composable calls it automatically

### Template Updates

In your template, remove `@update:model-value` handlers that call `fetchData`:

**Before:**
```vue
<VTextField
  v-model="searchQuery"
  @update:model-value="onSearch"
/>

<VSelect
  v-model="statusFilter"
  @update:model-value="onStatusChange"
/>
```

**After:**
```vue
<VTextField
  v-model="searchQuery"
  @update:model-value="onSearch"  <!-- Keep for debounce -->
/>

<VSelect
  v-model="statusFilter"  <!-- No handler needed -->
/>
```

## URL Format

Filters and pagination appear in the URL as:
```
/groups?search=math&status=ACTIVE&page=2&limit=20
```

## Migration Checklist

- [ ] Import `useQueryParams`
- [ ] Remove manual `onMounted` fetch call
- [ ] Remove `fetchData()` calls from filter/pagination handlers
- [ ] Initialize composable with your filters and pagination
- [ ] Test: Filter, refresh page, verify filter persists
- [ ] Test: Change page, refresh, verify page number persists
- [ ] Test: Back/forward navigation works
- [ ] Test: URL can be shared with filters applied

## Examples

See these pages for complete examples:
- `/pages/groups/index.vue`
- `/pages/students/index.vue`
- `/pages/payments/index.vue`
- `/pages/teachers/index.vue`
