<template>
  <main ref="player" class="player"></main>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { SkyPlayer } from "./sky-player";

const player = ref<HTMLElement>();

const skyPlayer = new SkyPlayer();

const rtsp = "rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4";
// const rtsp= "rtsp://admin:LH123456@hzlinker.synology.me/ch44/main/av_stream"
const server = "ws://localhost:3000";
const url = `${server}/rtsp/mpeg?url=${rtsp}`;

onMounted(() => {
  skyPlayer.mount(player.value!);
  skyPlayer.play({ url });
});
</script>

<style scoped>
.player {
  width: 800px;
  height: 600px;
  background-color: lavenderblush;

  transform: translateY(-24%);
}
</style>
