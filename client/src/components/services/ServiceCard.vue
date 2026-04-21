<template>
  <n-card class="service-card" :bordered="true" hoverable>
    <template #header>
      <div class="service-header">
        <n-text strong class="service-type-title">
          {{ props.service_type }}
        </n-text>
      </div>
    </template>
    <template #cover>
      <div class="service-image-container">
        <img
          :src="imageUrl"
          :alt="props.service_type"
          class="service-image"
        />
      </div>
    </template>

    <div class="service-content">
      <n-button
        type="primary"
        block
        size="large"
        :loading="ordering"
        @click="goToOrder(props.service_type)"
      >
        Заказать
      </n-button>
    </div>
  </n-card>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { computed } from 'vue';
import { NCard, NButton} from 'naive-ui';


const props = defineProps({
  service_type: {
    type: String,
    required: true,
  },
});

const router = useRouter()
const defaultImage = '/images/default.jpg';

const imageUrl = computed(() => {
  console.log(`/images/${props.service_type}.png`)
  return `/images/${props.service_type}.png`;
  
});

const emit = defineEmits(['order-success']);

const goToOrder = (serviceType) => {
  console.log('Выбрана услуга:', serviceType)
  router.push(`/order/new/${serviceType}`)
}
</script>

<style scoped>
.service-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  background: var(--secondary-color);
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow)
}

.service-image-container {
  height: 200px;
  overflow: hidden;
}

.service-header {
  text-align: center;
  width: 100%;
  font-size: 1.5rem;
  font-weight: 700;
}

.service-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 15px;
  transition: transform 0.3s ease;
}

.service-card:hover .service-image {
  transform: scale(1.05);
}

.service-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>