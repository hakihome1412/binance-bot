import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { BINANCE_APIKEY } from '../constants';

// Create Axios instance with baseURL
const axiosInstance = axios.create({
    baseURL: 'https://fapi.binance.com',
    timeout: 30000,
});

// config request interceptor for all request APIs
axiosInstance.interceptors.request.use(
    async (config: AxiosRequestConfig) => {

        const headers = {
            'Content-Type': 'application/json',
            'X-MBX-APIKEY': BINANCE_APIKEY,
            'Acccept': '*/*'
        }
        config.headers = headers;

        return config;
    },
    (error: any) => {
        Promise.reject(error);
    },
);

// config response interceptor for all response from APIs
axiosInstance.interceptors.response.use(
    (response: any) => {
        return response;
    },
    async (error: any) => {
        return Promise.reject(error);
    },
);

/**
 * API GET method
 * @param url string
 * @returns Promise type any
 */
const get = async <Response>(url: string): Promise<{ response?: Response; error?: any }> => {
    return await axiosInstance
        .get(url)
        .then((res: AxiosResponse) => {
            const body = res.data;
            // console.log(url);

            return {
                response: body,
            };
        })
        .catch((error: AxiosError) => {
            const responseData = error.response?.data || error;

            return {
                error: responseData,
            };
        });
};

const AxiosService = {
    get
}

export default AxiosService;