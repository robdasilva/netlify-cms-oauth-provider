import middy from '@middy/core'
import httpCors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import httpEventNormalizer from '@middy/http-event-normalizer'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import validator from '@middy/validator'
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { randomBytes } from 'crypto'
import log from 'middy-lesslog'
import 'source-map-support/register'
import { URL } from 'url'
import { getOAuthClient, Provider } from '../utils/get-oauth-client'
import schema from './get-auth.schema.json'

interface IGetAuthEvent extends APIGatewayProxyEvent {
  queryStringParameters: {
    provider: Provider
    scope: string
  }
}

async function main({
  queryStringParameters: { provider, scope },
  requestContext: { domainName, path },
}: IGetAuthEvent): Promise<APIGatewayProxyResult> {
  const url = new URL(`${path}/${provider}`, `https://${domainName}`)

  const client = await getOAuthClient(provider)
  const authUrl = client.authorizeURL({
    // eslint-disable-next-line camelcase
    redirect_uri: url.toString(),
    scope,
    state: randomBytes(32).toString('hex'),
  })

  return {
    body: '',
    headers: {
      Location: authUrl,
    },
    statusCode: 302,
  }
}

export const handler = middy(main)
  .use(log())
  .use(httpErrorHandler())
  .use(httpEventNormalizer())
  .use(httpHeaderNormalizer())
  .use(validator({ ...schema, ajvPlugins: {} }))
  .use(httpCors())
