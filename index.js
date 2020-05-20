import axios from 'axios';
import validator from './validator';
import { ERROR_MESSAGE_MAPS } from './const';
import { isFunction } from './util';


export default class VeryAxios {
  constructor(options = {}, axiosConfig) {
    if (validator(options)) return;

    const {
      // whether or not show tips when error ocurrs
      tip = true,
      // how to show tips
      tipFn,
      errorHandlers = {
        // 支持 400/401/403/404/405/413/414/500/502/504
      },
      // error msg language: 'zh-cn'/'en'
      lang = 'zh-cn',
      // some op before request send
      beforeHook,
      // some op after response is recieved
      afterHook,
      // function to get errno in response
      getResStatus,
      // function to get err message in response
      getResErrMsg = (res) => res.errmsg,
      // function to get data in response
      getResData = (res) => res.data,
    } = options;

    this.tip = tip && isFunction(tipFn);
    this.tipFn = tipFn;
    this.errorHandlers = errorHandlers;
    this.lang = lang;
    this.beforeHook = isFunction(beforeHook) ? beforeHook : () => {};
    this.afterHook = isFunction(afterHook) ? afterHook : () => {};
    this.getResStatus = isFunction(getResStatus) ? getResStatus : (res) => res.errno;
    this.getResErrMsg = isFunction(getResErrMsg) ? getResErrMsg : (res) => res.errmsg;
    this.getResData = isFunction(getResData) ? getResData : (res) => res.data;

    // default axios config
    this.defaultAxiosConfig = {
      timeout: 20000,
      responseType: 'json',
      headers: {
        'content-type': 'application/json',
      },
    };
    this.config = { ...this.defaultAxiosConfig, ...axiosConfig };

    this.createAxios();
    this.interceptors();
  }

  createAxios() {
    this.axios = axios.create(this.config);
  }

  interceptors() {
    // intercept response
    this.axios.interceptors.request.use((config) => {
      const { veryAxiosConfig } = config;
      const disableHooks = veryAxiosConfig && veryAxiosConfig.disableHooks;
      const disableBefore = disableHooks === true || (disableHooks && disableHooks.before);
      if (!disableBefore) this.beforeHook();
      return config;
    });

    // intercept response
    this.axios.interceptors.response.use(
      // success handler
      // Any status code that lie within the range of 2xx cause this function to trigger
      (res) => {
        const { config: { veryAxiosConfig } } = res;
        const disableHooks = veryAxiosConfig && veryAxiosConfig.disableHooks;
        const disableAfter = disableHooks === true || (disableHooks && disableHooks.after);
        if (!disableAfter) this.afterHook();

        return new Promise((resolve, reject) => {
          if (!res || !res.data) resolve();
          const resData = res.data;
          const status = this.getResStatus(resData);
          const message = this.getResErrMsg(resData) || ERROR_MESSAGE_MAPS[this.lang].DEFAULT;
          const data = this.getResData(resData);
          // status not equal to '0' means error
          if (String(status) !== '0') {
            if (this.tip) this.tipFn(message);
            const errorHandler = this.errorHandlers[status];
            if (isFunction(errorHandler)) errorHandler();
            reject(message);
          }
          return resolve(data);
        });
      },
      // error handler
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      (error) => {
        const { config: { veryAxiosConfig } } = error;
        const disableHooks = veryAxiosConfig && veryAxiosConfig.disableHooks;
        const disableAfter = disableHooks === true || (disableHooks && disableHooks.after);
        if (!disableAfter) this.afterHook();

        const errmsgMaps = ERROR_MESSAGE_MAPS[this.lang];
        let errmsg = errmsgMaps.DEFAULT;
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const { status } = error.response;
          if (window && !window.navigator.onLine) errmsg = errmsgMaps.OFFLINE;
          else errmsg = errmsgMaps[status] || error.message;
          // run relative error handler
          const errorHandler = this.errorHandlers[status];
          if (isFunction(errorHandler)) errorHandler();
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          // return value is a error instance
          errmsg = error.message;
        } else {
          // Something happened in setting up the request that triggered an Error
          errmsg = error.message;
        }

        if (this.tip) this.tipFn(errmsg);
      },
    );
  }

  /**
   *
   * @param {String} type   [请求类型]
   * @param {String} path   [请求地址]
   * @param {Object} param  [附带参数]
   */
  fetch(type, path, param = {}, config = {}) {
    return new Promise((resolve, reject) => {
      this.axios[type](path, param, config)
        .then((response) => resolve(response))
        .catch((err) => reject(err));
    });
  }

  /**
   *
   * @param {String} path   [请求地址]
   * @param {Object} param  [附带参数]
   * @param {Object} options  [请求时的单独配置，可以用于禁用hooks]
   */
  GET(path, param = {}, options = {}) {
    return this.fetch('get', path, { params: param, veryAxiosConfig: options });
  }

  /**
   *
   * @param {String} path   [请求地址]
   * @param {Object} param  [附带参数]
   * @param {Object} options  [请求时的单独配置，可以用于禁用hooks]
   */
  POST(path, param = {}, options = {}) {
    return this.fetch('post', path, param, { veryAxiosConfig: options });
  }

  /**
   *
   * @param {String} path   [请求地址]
   * @param {Object} param  [附带参数]
   * @param {Object} options  [请求时的单独配置，可以用于禁用hooks]
   */
  PUT(path, param = {}, options = {}) {
    return this.fetch('put', path, param, { veryAxiosConfig: options });
  }

  /**
   *
   * @param {String} path   [请求地址]
   * @param {Object} param  [附带参数]
   * @param {Object} options  [请求时的单独配置，可以用于禁用hooks]
   */
  DELETE(path, param = {}, options = {}) {
    return this.fetch('delete', path, param, { veryAxiosConfig: options });
  }

  /**
   * 上传表单方法
   * @param {*} path
   * @param {*} formdata
   */
  FORMDATA(path, formdata) {
    return new Promise((resolve, reject) => {
      this.axios(path, {
        method: 'post',
        data: formdata,
        headers: {
          'content-type': 'multipart/form-data;charset=UTF-8',
        },
      }).then((response) => resolve(response))
        .catch((err) => reject(err));
    });
  }
}
