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