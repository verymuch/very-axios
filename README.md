# very-axios

[README in English](./README.en.md)

基于 axios 进行二次封装，更简单、更统一地使用 axios。

## 功能列表

- 封装调用方式统一的 `GET/POST/PUT/DELETE/FORMDATA` 方法
- 自定义接口调用失败时如何处理错误提示（可开关）
- 常见 HTTP 状态码的中英文提示 `400/401/403/404/405/413/414/500/502/504`
- 自定义错误处理函数，可以根据状态码指定不同错误类型的自定义操作：如 403 跳转到指定页面
- `hooks` 方法
  - `beforeHook(config)` 接口请求前自定义操作：如可以在请求时给页面添加蒙层，加载中效果
  - `afterHook(responce/error, isError)` 接口返回后自定义操作：如取消 loading 效果、处理返回数据的数据结构等
- 兼容错误信息在 `200` 请求情况
  - 指定获取状态码函数 `getResStatus(resData)`，获取 response 中的错误码
  - 指定获取错误消息函数 `getResErrMsg(resData)`，获取 response 中的错误消息
  - 指定获取返回最终数据函数 `getResData(resData)`，获取 response 中的返回数据

## 基础用法

### 安装

```cmd
npm install -S very-axios
```

### 使用

可以通过以下方法 `new` 一个 VeryAxios 的实例，第一个参数 `veryAxiosConfig` 为 `very-axios` 的配置，第二个参数 `axiosConfig` 为 axios 所支持的配置。

```JS
// request.js
import VeryAxios from 'very-axios'
// 此处 veryAxiosConfig, axiosConfig 未定义，下面会详细介绍 veryAxiosConfig
const request = new VeryAxios(veryAxiosConfig, axiosConfig)

export default {
  list: (params) => request.GET('/user', params),
  add: (params) => request.POST('/user', params),
  update: (id, params) => request.PUT(`/user/${id}`, params),
  delete: (id) => request.DELETE(`/user/${id}`),
  deletes: (params) => request.DELETE(`/user/`, params),
  upload: (params) => request.FORMDATA(`/user/`, params),
}
```

`veryAxiosConfig` 支持以下配置：

```JS
{
  // 发生错误时，是否显示提示
  tip: true, // default

  // 如何显示提示，可以传入显示message的方法
  tipFn: (message) => {},

  errorHandlers: {
    // 支持 400/401/403/404/405/413/414/500/502/504/任意其他 errno
    // 401: () => {}
    // 403: () => {}
    // ...
  },

  // 内置错误提示语言: 'zh-cn'/'en'
  lang: 'zh-cn', // default

  // 请求前的自定义操作
  beforeHook: (config) => {},

  // 请求后的自定义操作
  afterHook: (responce|error, isError) => {},

  // 从请求响应中获取错误状态，默认取errno
  // 如果传入的不是一个函数也会使用默认值
  getResStatus: (resData) => resData.errno, // default

  // 从请求响应中获取错误消息，默认取errmsg
  // 如果传入的不是一个函数也会使用默认值
  getResErrMsg: (resData) => resData.errmsg, // default

  // 从请求响应中获取返回数据，默认取data
  // 如果传入的不是一个函数也会使用默认值
  getResData: (resData) => resData.data, // default
}
```

VeryAxios 实例支持 GET/POST/PUT/DELETE/FORMDATA实例方法，并且调用方式统一。

* `request.GET(path, params, config)`
* `request.POST(path, params, config)`
* `request.PUT(path, params, config)`
* `request.DELETE(path, params, config)`
* `request.FORMDATA(path, params, config)`

`path` 为请求路径；

`params` 为请求参数，GET/FORMDATA 的参数也不用特殊处理，very-axios 会统一处理，其中FORMDATA的 `Content-Type` 为 `multipart/form-data;charset=UTF-8`

`config` 为 axios 配置，内部新增了 `veryConfig` 字段用于 VeryAxios 调用实例方法时传入配置，后续会介绍

## 自定义错误提示函数

当接口报错时，我们通常会对错误信息进行提示。VeryAxios 提供了统一的方式来处理错误消息。在 VeryAxiosConfig 中指定 `tipFn(errmsg)` 可以指定错误消息的处理方式，指定 `tip`（布尔值）可以开关是否执行错误提示。

如下，我们可以将 `tipFn` 指定为 `alert`，则错误信息会使用 `alert` 函数弹出提醒。

```JS
// request.js
import VeryAxios from 'very-axios'
const request = new VeryAxios({
  tipFn: () => alert
})
```

VeryAxios 内置了常见 HTTP 错误的中英文提示，如 `401` 对应 “未授权，请确认是否登录” / “Unauthorized”。可以通过配置中的 `lang` 指定提示的语言。

## 自定义错误处理函数

使用 `axios` 进行接口请求发生错误时，一般会有两种，一种是 `validateStatus` 不通过时（默认是 `2xx` 通过） ，另一种是所有接口错误信息都由 `200` 状态返回，返回结果中带有固定字段表示，如 `errno/errmsg`。

在接口请求的过程中，我们有时会需要对于对某些特殊的错误进行一些额外的操作，如 `403` 的时候跳转到无权限的错误提示页。

这时候，我们可以在配置中添加相应的错误处理函数`errorHandlers`，可以给不同的错误码指定不同的处理函数，并且支持自定义的 `errno`。

```JS
// request.js
import VeryAxios from 'very-axios'
const request = new VeryAxios({
  errorHandlers: {
    // 支持 400/401/403/404/405/413/414/500/502/504/任意其他 errno
    401: () => {}
    403: () => {}
    // 任意自定义errno
    1002: () => {}
  },
})
```

## Hooks

VeryAxios 在请求前和请求后都留了钩子，以备需要在这两个时机进行特殊的处理。

* beforeHook(config) 接口请求前的钩子函数

  在接口请求前触发，可以在请求时给页面添加蒙层，加载中效果。`config`参数是最后发送请求时的配置。

  > config 为引用传值，可以对该引用的值进行修改，修改后会影响提交的配置

* afterHook(responce/error, isError) 接口返回后钩子函数

  在接口请求返回后触发，可以进行取消 loading 效果、处理返回的数据结构等操作。其中第一个参数在请求成功时是接口返回的响应`response`，在接口失败时，是返回的错误对象。第二个参数标识是否是错误返回。

  > response 为引用传值，可以对该引用的值进行修改，如对返回的数据结构进行调整

通常我们会在实例化时进行通用的钩子函数定义。但可能存在某些特殊的请求，不需要执行 hooks，这时候我们可以在单独的请求中，指定是否禁用 hooks 以及禁用哪一个 hooks。

```JS
// 禁用全部 hooks
request.GET(path, params, { veryConfig: { disableHooks: true } })

// 禁用 before hooks
request.GET(path, params, { veryConfig: { disableHooks: { before: true } } })

// 禁用 afater hooks
request.GET(path, params, { veryConfig: { disableHooks: { after: true } } })
```

## 自定义错误信息及数据的获取

前面提到，接口在返回错误时有两种常见方案，其中一种是全部 `200` 返回，通过特定字段标识是否是错误，如 `errno` 表示错误号，非 0 则为错误；`errmsg` 表示错误信息；`data` 为返回的数据。这也是 VeryAxios 的默认值。

当然，有些时候，接口并非我们预想的这样统一，我们可以通过以下三个函数分别指定如何从 reponse data 中获取上述的三个值。

* getResStatus(resData)，获取 response 中的错误码，默认值 `(resData) => resData.errno`
* getResErrMsg(resData)，获取 response 中的错误消息，默认值 `(resData) => resData.errmsg`
* getResData(resData)，获取 response 中的返回数据，默认值 `(resData) => resData.data`





