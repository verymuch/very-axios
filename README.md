# very-axios

[README in English](./README.en.md)

基于axios进行二次封装，更简单、更统一地使用axios。

## 功能列表

* 封装调用方式统一的`GET/POST/PUT/DELETE/FORMDATA`方法
* 自定义接口调用失败时如何处理错误提示（可开关）
* 常见HTTP状态码的中英文提示`400/401/403/404/405/413/414/500/502/504`
* `hooks`方法
  * `beforeHook(config)`接口请求前自定义操作：如可以在请求时给页面添加蒙层，加载中效果
  * `afterHook(responce/error, isError)`接口返回后自定义操作：如取消loading效果、处理返回数据的数据结构等
* 自定义错误处理函数，可以根据状态码指定不同错误类型的自定义操作：如403跳转到指定页面
* 兼容错误信息在`200`请求情况
  * 指定获取状态码函数`getResStatus(resData)`，获取response中的错误码
  * 指定获取错误消息函数`getResErrMsg(resData)`，获取response中的错误消息
  * 指定获取返回最终数据函数`getResData(resData)`，获取response中的返回数据
