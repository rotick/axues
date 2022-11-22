// import type { RequestMethod } from 'hooks'
// export interface UserProfile {
//   isLogin: boolean
//   userId: number
//   username: string
//   avatar: string
// }
// export function useUserProfile (request: RequestMethod) {
//   let pending: Promise<UserProfile> | null
//   const defaultUserProfile: UserProfile = {
//     isLogin: false,
//     userId: 0,
//     username: '',
//     avatar: ''
//   }
//   let userProfile: UserProfile
//   function getUserProfile (reset?: boolean): Promise<UserProfile> {
//     if (userProfile && !reset) {
//       return pending instanceof Promise ? pending : Promise.resolve(userProfile)
//     }
//
//     pending = new Promise((resolve) => {
//       request('/api/getUserProfile/v1').then((res: any) => {
//         userProfile = {
//           isLogin: !!res?.userId,
//           userId: res?.userId,
//           username: res?.username,
//           avatar: res?.avatar
//         }
//         pending = null
//         resolve(userProfile)
//       })
//     })
//
//     return pending
//   }
//   function clearUserProfile () {
//     userProfile = defaultUserProfile
//   }
//
//   return { getUserProfile, clearUserProfile }
// }
