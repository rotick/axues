<template>
  <div class="flex">
    <div class="w-[240px] bg-white/10 dark:bg-white/5 flex-shrink-0">
      <router-link to="/" class="block h-11 flex items-center px-6 border-main border-b"> simple request </router-link>
      <router-link to="/overlay" class="block h-11 flex items-center px-6 border-main border-b"> overlay components </router-link>
      <router-link to="/restful" class="block h-11 flex items-center px-6 border-main border-b"> restful </router-link>
      <router-link to="/crud" class="block h-11 flex items-center px-6 border-main border-b"> form CRUD </router-link>
      <router-link to="/pagination" class="block h-11 flex items-center px-6 border-main border-b"> pagination </router-link>
    </div>
    <div class="p-6">
      <router-view />
    </div>
  </div>
</template>
