/* eslint-disable import/no-extraneous-dependencies */
const Koa = require('koa');

const { log } = console;
const app = new Koa();

app.use(async (ctx) => {
  const reqPath = ctx.path;
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Content-Type', 'application/json');
  switch (reqPath) {
    case 200:
      ctx.status = 200;
      ctx.body = {
        errno: '0',
        errmsg: '',
        data: '请求成功',
      };
      break;
    // set status by request path
    default:
      ctx.status = Number(reqPath.split('/')[1]) || 200;
      break;
  }
});

app.on('error', (err) => {
  log('server error', err);
});

app.listen(3000);
