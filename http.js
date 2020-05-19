const Koa = require('koa');

const { log } = console;
const app = new Koa();

// 获取访问文件路径
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
        data: '请求充公',
      };
      break;
    default:
      ctx.status = Number(reqPath.split('/')[1]) || 200;
      break;
  }
});


// 错误处理
app.on('error', (err) => {
  log('server error', err);
});

app.listen(1030);
