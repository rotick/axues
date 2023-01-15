import { rest } from 'msw'
export const handlers = [
  rest.get('https://axues.io/get', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ test: 1 }))
  }),
  rest.get('https://axues.io/getError', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ test: 1 }))
  }),
  rest.get('https://axues.io/getWithParams/:payload', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        params: req.params.payload,
        query: Object.fromEntries(req.url.searchParams)
      })
    )
  }),
  rest.post('https://axues.io/postWithJsonData', async (req, res, ctx) => {
    let body = {}
    try {
      body = await req.json()
    } catch (err) {}
    // eslint-disable-next-line
    return res(
      ctx.status(200),
      ctx.json({
        body,
        headers: Object.fromEntries(req.headers)
      })
    )
  })
]
