<template>
  <div class="compass-app compass-app2" id="content-box" name="test">
    当前Key:
    <input v-model="currentKey" />
    <br/>
    当前值:
    <input v-model="currentValue" />
    <br/>
    <button @click="setStorage">设置存储</button>
    <button @click="getStorage">获取存储</button>
    <button @click="removeStorage">删除存储</button>
    <button @click="clearStorage">清空存储</button>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import {Locker} from "@compass-aiden/locker";
import LockerLocalStorageProcessor from "@compass-aiden/locker-localstorage-processor";
import LockerMemoryStorageProcessor from "@compass-aiden/locker-memory-processor";
import LockerIndexDBStorageProcessor from "@compass-aiden/locker-indexdb-processor";

const currentKey = ref('')
const currentValue = ref('')

const locker = new Locker({
  lockerKey: 'example',
  processor: [
    new LockerIndexDBStorageProcessor(),
    new LockerLocalStorageProcessor(),
    new LockerMemoryStorageProcessor(),
  ],
  maximum: 0.001,
  clearGarbageInterval: 10000,
  autoReadRefresh: true,
  debug: true,
})

function setStorage() {
  locker.setItem(currentKey.value, currentValue.value, { expires: 1000 * 60 * 5 })
}
async function getStorage() {
  console.log(await locker.getItem(currentKey.value))
}
function removeStorage() {
  locker.removeItem(currentKey.value)
}
function clearStorage() {
  locker.clear();
}

onBeforeUnmount(() => locker.destroy());
</script>

<style scoped lang="stylus">
.compass-app
  color $font-color
  height 3000px
</style>
