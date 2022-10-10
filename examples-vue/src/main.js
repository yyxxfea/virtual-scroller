import '@yyxxfe/common/style/base.less';
import './style/index.less';

import Vue from 'vue';
import App from './app.vue';
import router from './router';

Vue.config.productionTip = false;

new Vue({
    router,
    render: h => h(App)
}).$mount('#app');
