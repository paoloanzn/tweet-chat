<script setup lang="ts">
import Home from "./components/Home.vue";
import { version, name } from "../package.json";

const msg = `${name}-v${version}`;
</script>

<template>
  <Home :msg="msg" />
</template>
