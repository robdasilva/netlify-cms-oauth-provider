import middy from '@middy/core'
import httpCors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import httpEventNormalizer from '@middy/http-event-normalizer'
import httpHeaderNormalizer from '@middy/http-header-normalizer'
import validator from '@middy/validator'
import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda'
import { warn } from 'lesslog'
import log from 'middy-lesslog'
import 'source-map-support/register'
import { URL } from 'url'
import { getOAuthClient, Provider } from '../utils/get-oauth-client'
import { getScript } from '../utils/get-script'
import schema from './get-auth-callback.schema.json'

interface IGetAuthCallbackEvent extends APIGatewayProxyEventV2 {
  pathParameters: {
    provider: Provider
  }
  queryStringParameters: {
    code: string
  }
}

async function main({
  pathParameters: { provider },
  queryStringParameters: { code },
  requestContext: {
    domainName,
    http: { path },
  },
}: IGetAuthCallbackEvent): Promise<APIGatewayProxyResult> {
  const url = new URL(`${path}`, `https://${domainName}`)

  let token: string | undefined

  try {
    const client = await getOAuthClient(provider)
    ;({
      token: { access_token: token },
    } = await client.getToken({
      code,
      // eslint-disable-next-line camelcase
      redirect_uri: url.toString(),
    }))
  } catch (error) {
    const { message, stack, ...details } = error

    warn('Could not get token from OAuth provider', {
      error: { ...details, message, stack },
    })
  } finally {
    // eslint-disable-next-line no-unsafe-finally
    return {
      body: getScript(provider, token),
      headers: { 'Content-Type': 'text/html' },
      statusCode: 200,
    }
  }
}

export const handler = middy(main)
  .use(log())
  .use(httpErrorHandler())
  .use(httpEventNormalizer())
  .use(httpHeaderNormalizer())
  .use(validator({ ...schema, ajvPlugins: {} }))
  .use(httpCors())
