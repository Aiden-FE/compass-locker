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
import LockerRAMStorageProcessor from "@compass-aiden/locker-ram-processor";

const currentKey = ref('')
const currentValue = ref('')

const localLocker = new Locker({
  lockerKey: 'test',
  processor: new LockerRAMStorageProcessor(),
  maximum: 0.001,
  debug: true,
})

function setStorage() {
  localLocker.setItem(currentKey.value, currentValue.value, { autoReadRefresh: true, expires: 15000 })
}
function getStorage() {
  console.log(localLocker.getItem(currentKey.value))
}
function removeStorage() {
  localLocker.removeItem(currentKey.value)
}
function clearStorage() {
  localLocker.clear();
}
</script>

<style scoped lang="stylus">
.compass-app
  color $font-color
  height 3000px
</style>
