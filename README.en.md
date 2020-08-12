# very-axios

[中文 README](./README.md)

A convinient and uniform way to code with axios.

## Features

* provide instace methods `GET/POST/PUT/DELETE/FORMDATA` with uniform params
* custom error handler function when request is failed（switchable）
* error tips of `400/401/403/404/405/413/414/500/502/504` in both English and Chinese
* `hooks`
  * `beforeHook(config)` for custom operations before request, such as adding a loading div
  * `afterHook(responce/error, isError)` for custom operations after response：such as canceling loading, process response
* custom error handlers by status: such as redirecting to specific page when 403
* error info in `200` response data
  * specify `getResStatus(resData)` to get status
  * specify `getResErrMsg(resData)` to get error message
  * specify `getResData(resData)` to get true response data

* configure to cancel duplicate requests
  * in the `new VeryAxios` instance, configure `cancelDuplicated: true` to enable cancellation of duplicate requests
  * in the `new VeryAxios` instance, configure `duplicatedKeyFn` function to generate a duplicate key
  * customize the duplicate key `duplicatedKey` of a single request when requesting

## 基础用法

可以通过以下方法`new`一个VeryAxios的实例，第一个参数`veryAxiosConfig`为`very-axios`的配置，第二个参数`axiosConfig`为axios所支持的配置。

```
// request.js
const request = new VeryAxios(veryAxiosConfig, axiosConfig)
```

`veryAxiosConfig` 支持以下配置：

```javascript
{
  // whether or not show tips when error ocurrs
  tip: true, // default
  // how to show tips
  tipFn: () => {},
  errorHandlers: {
    // support 400/401/403/404/405/413/414/500/502/504/any other cutom errorno
  },
  // error msg language: 'zh-cn'/'en'
  lang: 'zh-cn', // default
  // some operation before request send
  beforeHook: (config) => {},
  // some operation after response is recieved
  afterHook: (responce/error, isError) => {},
  // function to get errno in response
  getResStatus: (res) => res.errno, // default
  // function to get err message in response
  getResErrMsg: (res) => res.errmsg, // default
  // function to get data in response
  getResData: (res) => res.data, // default
  // whether to enable cancellation of duplicate requests
  cancelDuplicated: false, // default
  // function of how to generate a duplicate key
  duplicatedKeyFn: (config) => `${config.method}${config.url}` // default
}
```