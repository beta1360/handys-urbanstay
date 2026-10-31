import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";

const axiosInstance = axios.create();

export function http<T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> {
  return axiosInstance<T>({ ...config, ...options }).then(({ data }) => data);
}

export type ErrorType<ErrorData> = AxiosError<ErrorData>;

export type BodyType<BodyData> = BodyData;
