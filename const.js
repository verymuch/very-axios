/* eslint-disable import/prefer-default-export */
export const ERROR_MESSAGE_MAPS = {
  'zh-cn': {
    DEFAULT: '接口请求失败',
    OFFLINE: '网络连接断开',
    400: '请求错误，请检查参数',
    401: '未授权，请确认是否登录',
    403: '无权限，禁止访问',
    404: '接口或资源不存在',
    405: '请求方式不允许',
    413: '资源过大',
    414: 'URI过长',
    500: '服务器内部错误',
    502: '网关错误',
    504: '网关超时',
  },
  en: {
    DEFAULT: 'Request Failed',
    OFFLINE: 'Network is Offline',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    504: 'Gateway Timeout',
  },
};

// 请求的类型
export const REQUEST_TYPE = {
  DUPLICATED_REQUEST: 'duplicatedRequest', // duplicated request
}
