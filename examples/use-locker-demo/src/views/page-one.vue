<template>
  <div>
    Page 1<br/>
    <button @click="back">返回</button>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
function back() {
  router.back();
}
</script>
