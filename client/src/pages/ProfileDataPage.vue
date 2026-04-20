<template>
  <div class="profile-page">
    <div class="profile-layout">
      <div class="sidebar-wrapper">
        <ProfileSidebar active-tab="data" />
      </div>

      <div class="content-wrapper">
        <PersonalDataCard />
      </div>
    </div>
  </div>
</template>

<script setup>
import ProfileSidebar from '../components/profile/Sidebar.vue';
import PersonalDataCard from '../components/profile/PersonalDataCard.vue';
</script>

<style scoped>
.profile-page {
  padding: 32px;
  min-height: calc(100vh - 160px);
  box-sizing: border-box;
  padding-bottom: 0;
}

.profile-layout {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
  align-items: stretch;
}

.sidebar-wrapper {
  width: 30%;
}

.content-wrapper {
  flex: 1;
}
</style>
