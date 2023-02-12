import cookie from 'js-cookie'
import { v4 as uuidv4 } from 'uuid'
import { ref } from 'vue'

export function useTokenAndUUID (domain: string) {
  const tokenKey = 'authorization'
  const uuidKey = 'uuid'
  const token = ref(cookie.get(tokenKey) || '')
  const UUID = ref(cookie.get('uuid') || '')

  function setToken (newToken: string, expires = 30) {
    token.value = newToken
    cookie.set(tokenKey, newToken, { expires, domain }) // 时长单位：天
  }

  function removeToken () {
    token.value = ''
    cookie.remove(tokenKey, { domain })
  }

  function setUUID (uuid?: string) {
    UUID.value = uuid || uuidv4()
    cookie.set(uuidKey, UUID.value, { expires: 30, domain })
  }

  setUUID()

  return { token, UUID, setToken, removeToken }
}
