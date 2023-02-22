const Koa = require('koa');
const websockify = require('koa-websocket');
const router = require('./router.js');

const app = websockify(new Koa());

app.ws.use(router.routes());

app.listen(3000,()=>{
  console.log('listen on 3000!');
});
