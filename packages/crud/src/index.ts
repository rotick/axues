import { inject } from 'vue'
import { key } from './create'
import { CRUDInput, CRUDOutput, IO } from './types'

export function useCRUD<TI extends object, TO extends object> (
  options: CRUDInput<TI, TO>
): CRUDOutput<TO> {
  const CRUD = inject(key) as IO
  return CRUD(options)
}
export { request, createCRUD } from './create'
