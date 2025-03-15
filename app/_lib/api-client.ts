import axios, { AxiosRequestConfig } from 'axios';
import useSWR, { SWRConfiguration } from 'swr';

// 创建axios实例
const api = axios.create({
    baseURL: '/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器
api.interceptors.request.use(
    (config) => {
        // 从localStorage获取token
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // 处理401错误（未授权）
        if (error.response && error.response.status === 401) {
            // 清除本地存储的token
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            // 重定向到登录页
            window.location.href = '/auth/login';
        }
        return Promise.reject(error);
    }
);

// 定义通用的API响应类型
export interface ApiResponse<T = any> {
    code: number;
    msg: string;
    data?: T;
    token?: string;
}

// 为SWR创建fetcher函数
const fetcher = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
        const response = await api.get<ApiResponse<T>>(url, config);
        if (response.data.code !== 0) {
            throw new Error(response.data.msg || '请求失败');
        }
        return response.data.data as T;
    } catch (error) {
        throw error;
    }
};

// 使用SWR的自定义Hook
export function useApi<T>(url: string, config?: AxiosRequestConfig, swrConfig?: SWRConfiguration) {
    const { data, error, mutate, isLoading, isValidating } = useSWR<T>(
        url,
        () => fetcher<T>(url, config),
        swrConfig
    );

    return {
        data,
        error,
        mutate,
        isLoading,
        isValidating,
    };
}

// 直接使用axios的方法
export const apiClient = {
    get: async <T>(url: string, config?: AxiosRequestConfig) => {
        const response = await api.get<ApiResponse<T>>(url, config);
        return response.data;
    },
    post: async <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
        const response = await api.post<ApiResponse<T>>(url, data, config);
        return response.data;
    },
    put: async <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
        const response = await api.put<ApiResponse<T>>(url, data, config);
        return response.data;
    },
    delete: async <T>(url: string, config?: AxiosRequestConfig) => {
        const response = await api.delete<ApiResponse<T>>(url, config);
        return response.data;
    },
};

export default api;