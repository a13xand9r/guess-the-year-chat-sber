// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { handleNlpRequest } from '../../src/scenario'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    console.log('api/hook request')
    if (req.method === 'POST'){
        res.status(200).json(await handleNlpRequest(req.body))
      }
}
