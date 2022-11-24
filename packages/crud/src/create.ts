import axios from 'axios'
import type { App } from 'vue'
import type { AxiosResponse } from 'axios'
import { CreateCRUDOptions } from './types'

export const key = Symbol('')

export function request ({
  baseURL = '',
  timeout = '',
  method = 'get',
  url = '',
  params = {},
  contentType = '',
  responseHandle = undefined
}: any) {
  return new Promise((resolve, reject) => {
    axios({
      baseURL,
      timeout,
      method,
      url,
      data: params,
      headers: {
        'Content-Type': contentType
      }
    })
      .then((response: AxiosResponse) => {
        const res = responseHandle?.(response.data) || response.data
        if (res instanceof Error) {
          reject(res)
        } else {
          resolve(res)
        }
      })
      .catch(reject)
  })
}

export function createCRUD (
  options: CreateCRUDOptions = {
    baseURL: '',
    timeout: 0,
    loadingDelay: 300,
    debounceTime: 500
  }
) {
  return {
    install (app: App) {
      app.provide(key, () => {})
    }
  }
}
