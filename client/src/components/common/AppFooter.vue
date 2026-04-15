<template>
  <footer class="footer">
    <span>г. Санкт-Петербург</span>
    <span>|</span>
    <a href="tel:+78120702256">+7 (812) 070-22-56</a>
    <span>|</span>
    <a href="mailto:info@print-center.ru">info@print-center.ru</a>
  </footer>
</template>

<style scoped>
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background-color: var(--secondary-color);
  min-height: 6vh;
  gap: 12px;
  color: #333;
  font-size: 1rem;
}

.footer a {
  color: #333;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

</style>