<template>
  <div>
    Page 2<br/>
    <button @click="back">返回</button>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
function back() {
  router.back();
}
</script>
