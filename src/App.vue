<template>
  <div id="app">
    <nav>
      <router-link to="/">首頁</router-link> |
      <router-link to="/pet-upload">寵物上架</router-link> |
      <router-link to="/filter">條件篩選</router-link> |
      <router-link to="/login">使用者資料登入</router-link> |
      <router-link to="/nearby">鄰近站點搜尋</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
};
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

nav {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

nav a {
  margin: 0 10px;
  text-decoration: none;
  color: #42b983;
  font-weight: bold;
}

nav a.router-link-active {
  color: #2c3e50;
}
</style>
