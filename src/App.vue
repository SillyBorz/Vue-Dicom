<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style lang="less">
body{
  color: #fff;
}
#app{
  border: 6px solid #111;
}
.line{
  display: block;
  height: 6px;
  background: #111;
  margin: 0 8px;
  border-radius: 3px;
}
.hide{
  display: none;
}
</style>

