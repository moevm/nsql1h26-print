<template>
  <div class="order-page">

    <div v-if="orderLoading">Загрузка...</div>
    <div v-else-if="orderError">{{ orderError }}</div>

    <div v-else-if="order">

      <h1>{{ order.number }}</h1>

      <p><strong>Статус:</strong> {{ order.statusText }}</p>
      <p><strong>Итого:</strong> {{ order.total }} руб</p>

      <hr />

      <p><strong>Тип:</strong> {{ order.type }}</p>
      <p><strong>Файл:</strong> {{ order.file }}</p>
      <p><strong>Формат:</strong> {{ order.format }}</p>
      <p><strong>Комментарий:</strong> {{ order.comment }}</p>
      <p><strong>Тип бумаги:</strong> {{ order.paperType }}</p>
      <p><strong>Цветность:</strong> {{ order.color }}</p>
      <p><strong>Постпечатная обработка:</strong> {{ order.postProcessing }}</p>
      <p><strong>Количество:</strong> {{ order.quantity }}</p>

    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useOrderStore } from "@/stores/orderStore";

const route = useRoute();
const orderStore = useOrderStore();

const order = computed(() => orderStore.currentOrder);
const orderLoading = computed(() => orderStore.orderLoading);
const orderError = computed(() => orderStore.orderError);

onMounted(() => {
  orderStore.fetchOrderById(route.params.id);
});
</script>

<style scoped>
.order-page {
  display: flex;
  padding: 10px;
}

</style>
