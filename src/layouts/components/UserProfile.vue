<script setup>
import {computed, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {useAuthStore} from "@/stores/auth";

const authStore = useAuthStore();
const router = useRouter();

// Foydalanuvchi ma'lumotlari
const userData = computed(() => authStore.currentUser);

// Role mapping
const roleMap = {
  ADMIN: "Administrator",
  TEACHER: "O'qituvchi",
  STUDENT: "O'quvchi",
  USER: "Foydalanuvchi",
};

const userRoleLabel = computed(() => {
  const role = userData.value?.userType || "USER";
  return roleMap[role] || role;
});

// User initials (first letter of first and last name)
const userInitials = computed(() => {
  const firstName = userData.value?.firstName || "";
  const lastName = userData.value?.lastName || "";
  const username = userData.value?.username || "";

  // If we have first and last name, use first letters
  if (firstName || lastName) {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return (firstInitial + lastInitial).trim() || "U";
  }

  // Otherwise use first two letters of username
  if (username) {
    return username.substring(0, 2).toUpperCase();
  }

  return "U";
});

// Debug: Log userData to see what's available
watchEffect(() => {
  if (userData.value) {
    console.log("UserProfile userData:", userData.value);
  }
});

// Logout funksiyasi
const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};
</script>

<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    bordered
    color="success"
  >
    <VAvatar class="cursor-pointer" color="primary" variant="tonal">
      <template v-if="userData?.avatar">
        <VImg :src="userData.avatar" />
      </template>
      <template v-else>
        <span class="text-h5">{{ userInitials }}</span>
      </template>

      <!-- SECTION Menu -->
      <VMenu activator="parent" width="230" location="bottom end" offset="14px">
        <VList>
          <!-- 👉 User Avatar & Name -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar color="primary" variant="tonal">
                    <template v-if="userData?.avatar">
                      <VImg :src="userData.avatar" />
                    </template>
                    <template v-else>
                      <span class="text-h6">{{ userInitials }}</span>
                    </template>
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{
                userData?.firstName || userData?.lastName
                  ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
                  : userData?.username || "Foydalanuvchi"
              }}
            </VListItemTitle>
            <VListItemSubtitle>{{ userRoleLabel }}</VListItemSubtitle>
          </VListItem>

          <VDivider class="my-2" />

          <!-- 👉 Profile -->
          <VListItem :to="{name: 'profile'}">
            <template #prepend>
              <VIcon class="me-2" icon="tabler-user" size="22" />
            </template>

            <VListItemTitle>Profil</VListItemTitle>
          </VListItem>

          <!-- Divider -->
          <VDivider class="my-2" />

          <!-- 👉 Logout -->
          <VListItem @click="handleLogout">
            <template #prepend>
              <VIcon class="me-2" icon="tabler-logout" size="22" />
            </template>

            <VListItemTitle>Chiqish</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
