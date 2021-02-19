import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context,
} from 'aws-lambda'
import { getOAuthClient, Provider } from '../utils/get-oauth-client'
import { handler } from './get-auth'

jest.mock('../utils/get-oauth-client')

const context = { awsRequestId: 'jest' } as Context
const proxyEvent = {} as APIGatewayProxyEventV2

describe('handler', () => {
  it('returns HTTP 302 redirect response to authorization URL', async (done) => {
    const url = 'http://auth.example.com/auth/callback'
    const authorizeURL = jest.fn().mockReturnValueOnce(url)
    ;(getOAuthClient as jest.Mock).mockResolvedValueOnce({ authorizeURL })

    const provider = Provider.GITHUB
    const event = {
      ...proxyEvent,
      queryStringParameters: { provider, scope: 'unit-test' },
      requestContext: {
        ...proxyEvent.requestContext,
        domainName: 'auth.example.com',
        http: {
          ...proxyEvent.requestContext?.http,
          path: '/auth',
        },
      },
    }

    const callback: Callback<APIGatewayProxyResultV2> = (e, result) => {
      expect(e).toBeNull()

      expect(result).toStrictEqual(
        expect.objectContaining({
          body: '',
          headers: { Location: url },
          statusCode: 302,
        })
      )

      expect(getOAuthClient).toHaveBeenCalledTimes(1)
      expect(getOAuthClient).toHaveBeenCalledWith(provider)

      done()
    }

    expect(handler(event, context, callback)).toBeUndefined()
  })
})
