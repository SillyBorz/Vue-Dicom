import Vue from 'vue'
import Router from 'vue-router'
// import HelloWorld from '@/components/HelloWorld'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      redirect: '/viewer'
    },{
      path: '/viewer',
      name: 'viewer',
      component: r => require(['@/views/Viewer'],r)
    }
  ]
})
