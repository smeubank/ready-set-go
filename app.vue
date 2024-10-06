<template>
  <div>
    <div class="poll-intro">
      Vote for this week's poll or see results
    </div>
    <div
      class="strawpoll-embed"
      id="strawpoll_XOgOVeN60n3"
      style="height: 1248px; max-width: 640px; width: 100%; margin: 0 auto; display: flex; flex-direction: column;"
    >
      <iframe
        title="StrawPoll Embed"
        id="strawpoll_iframe_XOgOVeN60n3"
        :src="pollUrl"
        style="position: static; visibility: visible; display: block; width: 100%; flex-grow: 1;"
        frameborder="0"
        allowfullscreen
        allowtransparency
      >Loading...</iframe>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const pollUrl = ref('');

onMounted(() => {
  // Set the poll URL dynamically
  pollUrl.value = 'https://strawpoll.com/embed/XOgOVeN60n3'; // Replace with the actual poll URL

  // Dynamically load the StrawPoll widget script
  const script = document.createElement('script');
  script.src = 'https://cdn.strawpoll.com/dist/widgets.js';
  script.async = true;
  script.charset = 'utf-8';
  document.body.appendChild(script);
});
</script>

<style scoped>
.poll-intro {
  font-size: 18px;
  margin-bottom: 20px;
  text-align: center;
}
</style>
