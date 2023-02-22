<template>
  <main ref="player" class="player"></main>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Player } from "./player";
import { CodecType, MediaFormat } from "./player/abstraction";

const player = ref<HTMLElement>();

const sPlayer = new Player();

const rtsp = "rtsp://admin:LH123456@172.16.3.229:554/h264/ch49/sub/av_stream";
const server = "ws://localhost:3000";
const url = `${server}/rtsp/mpeg?url=${rtsp}`;

onMounted(() => {
  sPlayer.mount(player.value!).load({
    url,
    format: MediaFormat.MPEG_TS,
    videoCodec: CodecType.MPEG1,
    audioCodec: CodecType.ACC,
  });
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
