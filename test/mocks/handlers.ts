import { rest } from 'msw'
export const handlers = [
  rest.get('https://axues.io/delay/2', (req, res, ctx) => {
    return res(
      ctx.delay(2000),
      // ctx.status(200),
      ctx.json({ test: 1 })
    )
  }),
  rest.get('https://axues.io/get', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ test: 1 }))
  })
]
