import axios from 'axios';
import merge from 'lodash/merge';
import validator from './validator';
import { ERROR_MESSAGE_MAPS, REQUEST_TYPE } from './const';
import { isFunction, inBrowser } from './util';

export const originalAxios = axios;

export default class VeryAxios {
  constructor(options = {}, axiosConfig = {}) {
    if (validator(options)) return;
    const {
      // whether or not show tips when error ocurrs
      tip = true,
      // how to show tips
      tipFn,
      errorHandlers = {
        // support 400/401/403/404/405/413/414/500/502/504/any other cutom errorno
      },
      // error msg language: 'zh-cn'/'en'
      lang = 'zh-cn',
      // some operation before request send
      beforeHook,
      // some operation after response is recieved
      afterHook,
      // function to get errno in response
      getResStatus,
      // function to get err message in response
      getResErrMsg,
      // function to get data in response
      getResData,
      // function to validate res status, true is success
      validateStatus,

      // whether to cancel a duplicated request
      cancelDuplicated = false,

      // how to generate the duplicated key
      duplicatedKeyFn,
    } = options;
    // stores the identity and cancellation function for each request
    this.pendingAjax = new Map();

    this.tip = tip && isFunction(tipFn);
    this.tipFn = tipFn;
    this.errorHandlers = errorHandlers;
    this.lang = lang;
    this.cancelDuplicated = cancelDuplicated;

    // these follow options cannot valid by JSON schema
    // if option is not a function, set as the default value
    this.beforeHook = isFunction(beforeHook) ? beforeHook : () => {};
    this.afterHook = isFunction(afterHook) ? afterHook : () => {};
    this.getResStatus = isFunction(getResStatus) ? getResStatus : (res) => res.errno;
    this.getResErrMsg = isFunction(getResErrMsg) ? getResErrMsg : (res) => res.errmsg;
    this.getResData = isFunction(getResData) ? getResData : (res) => res.data;
    this.duplicatedKeyFn = isFunction(duplicatedKeyFn) ? duplicatedKeyFn : (config) => `${config.method}${config.url}`;

    const defaultValidateStatus = (status) => status === 0 || (status >= 200 && status < 300);
    this.validateStatus = isFunction(validateStatus) ? validateStatus : defaultValidateStatus;

    // default axios config
    this.defaultAxiosConfig = {
      timeout: 20000,
      responseType: 'json',
      headers: {
        'content-type': 'application/json',
      },
    };
    this.config = merge(this.defaultAxiosConfig, axiosConfig);

    this.createAxios();
    this.interceptors();
  }

  createAxios() {
    this.axios = axios.create(this.config);
  }

  interceptors() {
    // intercept response
    this.axios.interceptors.request.use((config) => {
      // check the previous request for cancellation before the request starts
      this.removePendingAjax(config);
      // add the current request to pendingAjax
      this.addPendingAjax(config);
      const { veryConfig: { disableHooks, disableTip } = {} } = config;
      const disableBefore = disableHooks === true || (disableHooks && disableHooks.before);
      if (!disableBefore) {
        try {
          this.beforeHook(config);
        } catch (e) {
          const message = `beforeHook内部错误：${e.message}`;
          if (this.tip && !disableTip) this.tipFn(message);
          // 和response不一样，无需返回一个promise
        }
      }
      return config;
    });

    // intercept response
    this.axios.interceptors.response.use(
      // success handler
      // Any status code that lie within the range of 2xx cause this function to trigger
      (res) => {
        this.removePendingAjax(res.config);
        const { config: { veryConfig: { disableHooks, disableTip } = {} } } = res;
        const disableAfter = disableHooks === true || (disableHooks && disableHooks.after);

        if (!disableAfter) {
          try {
            this.afterHook(res);
          } catch (e) {
            const message = `afterHook内部错误：${e.message}`;
            if (this.tip && !disableTip) this.tipFn(message);
            return Promise.reject(message);
          }
        }

        return new Promise((resolve, reject) => {
          if (!res || !res.data) resolve();
          const resData = res.data;
          const status = +this.getResStatus(resData);
          if (!this.validateStatus(status)) {
            const errmsgMaps = ERROR_MESSAGE_MAPS[this.lang];
            const message = this.getResErrMsg(resData) || errmsgMaps[status] || errmsgMaps.DEFAULT;
            if (this.tip && !disableTip) this.tipFn(message);
            const errorHandler = this.errorHandlers[status];
            if (isFunction(errorHandler)) errorHandler();
            reject(message);
          }

          const data = this.getResData(resData);
          return resolve(data);
        });
      },
      // error handler
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      (error) => {
        const config = error.config || {};

        // when erroe is requested, remove the request
        this.removePendingAjax(config);
        const { veryConfig: { disableHooks, disableTip } = {} } = config;
        const disableAfter = disableHooks === true || (disableHooks && disableHooks.after);

        if (!disableAfter) {
          try {
            this.afterHook(error, true);
          } catch (e) {
            const message = `afterHook内部错误：${e.message}`;
            if (this.tip && !disableTip) this.tipFn(message);
            return Promise.reject(message);
          }
        }

        const errmsgMaps = ERROR_MESSAGE_MAPS[this.lang];
        let errmsg = errmsgMaps.DEFAULT;
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const { status } = error.response;
          // TODO:临时去除window
          // if (inBrowser && !window.navigator.onLine) errmsg = errmsgMaps.OFFLINE;
          // else
          errmsg = errmsgMaps[status] || error.message;
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
        // whether is the type of duplicated request
        let isDuplicatedType;
        try {
          const errorType = (JSON.parse(error.message) || {}).type;
          isDuplicatedType = errorType === REQUEST_TYPE.DUPLICATED_REQUEST;
        } catch (e) {
          isDuplicatedType = false;
        }
        if (isDuplicatedType) return Promise.reject(errmsgMaps.DUPLICATED_CANCELED);
        if (this.tip && !disableTip) this.tipFn(errmsg);
        return Promise.reject(errmsg);
      },
    );
  }

  /**
   * add request to pendingAjax
   * @param {Object} config
   */
  addPendingAjax(config) {
    // if need cancel duplicated request
    if (!this.cancelDuplicated) return;
    const veryConfig = config.veryConfig || {};
    const duplicatedKey = JSON.stringify({
      duplicatedKey: veryConfig.duplicatedKey || this.duplicatedKeyFn(config),
      type: REQUEST_TYPE.DUPLICATED_REQUEST,
    });
    config.cancelToken = config.cancelToken || new axios.CancelToken((cancel) => {
      // if the current request does not exist in pendingAjax, add it
      if (duplicatedKey && !this.pendingAjax.has(duplicatedKey)) {
        this.pendingAjax.set(duplicatedKey, cancel);
      }
    });
  }

  /**
   * remove the request in pendingAjax
   * @param {Object} config
   */
  removePendingAjax(config) {
    // if need cancel duplicated request
    if (!this.cancelDuplicated) return;
    const veryConfig = config.veryConfig || {};
    const duplicatedKey = JSON.stringify({
      duplicatedKey: veryConfig.duplicatedKey || this.duplicatedKeyFn(config),
      type: REQUEST_TYPE.DUPLICATED_REQUEST,
    });
    // if the current request exists in pendingAjax, cancel the current request and remove it
    if (duplicatedKey && this.pendingAjax.has(duplicatedKey)) {
      const cancel = this.pendingAjax.get(duplicatedKey);
      cancel(duplicatedKey);
      this.pendingAjax.delete(duplicatedKey);
    }
  }

  /**
   *
   * @param {String} type   [request type]
   * @param {String} path   [request url path]
   * @param {Object} param  [request params]
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
   * @param {String} path   [request url path]
   * @param {Object} param  [request params]
   * @param {Object} config  [axios and very-axios config]
   */
  GET(path, param = {}, config = {}) {
    return this.fetch('get', path, { params: param, ...config });
  }

  /**
   *
   * @param {String} path   [request url path]
   * @param {Object} param  [request params]
   * @param {Object} config  [axios and very-axios config]
   */
  POST(path, param = {}, config = {}) {
    return this.fetch('post', path, param, config);
  }

  /**
   *
   * @param {String} path   [request url path]
   * @param {Object} param  [request params]
   * @param {Object} config  [axios and very-axios config]
   */
  PUT(path, param = {}, config = {}) {
    return this.fetch('put', path, param, config);
  }

  /**
   *
   * @param {String} path   [request url path]
   * @param {Object} param  [request params]
   * @param {Object} config  [axios and very-axios config]
   */
  DELETE(path, param = {}, config = {}) {
    return this.fetch('delete', path, param, config);
  }

  /**
   * 上传表单方法
   * @param {*} path
   * @param {*} params
   * @param {Object} config  [axios and very-axios config]
   */
  FORMDATA(path, params, config = {}) {
    const formdata = new FormData();
    Object.keys(params).forEach((key) => {
      formdata.append(key, params[key]);
    });

    const defaultFormDataConfig = {
      method: 'post',
      data: formdata,
      headers: {
        'content-type': 'multipart/form-data;charset=UTF-8',
      },
    };
    return new Promise((resolve, reject) => {
      this.axios(path, merge(defaultFormDataConfig, config)).then((response) => resolve(response))
        .catch((err) => reject(err));
    });
  }
}
