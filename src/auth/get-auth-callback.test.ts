import {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Callback,
  Context,
} from 'aws-lambda'
import { warn } from 'lesslog'
import { getOAuthClient, Provider } from '../utils/get-oauth-client'
import { getScript } from '../utils/get-script'
import { handler } from './get-auth-callback'

jest.mock('lesslog')
jest.mock('../utils/get-oauth-client')
jest.mock('../utils/get-script')

const context = { awsRequestId: 'jest' } as Context
const proxyEvent = {} as APIGatewayProxyEventV2

describe('handler', () => {
  afterEach(() => {
    ;(getOAuthClient as jest.Mock).mockReset()
  })

  it('returns HTTP 200 response with auth script snippet', async (done) => {
    const token = 'unit-test'
    const getToken = jest
      .fn()
      // eslint-disable-next-line camelcase
      .mockResolvedValueOnce({ token: { access_token: token } })
    ;(getOAuthClient as jest.Mock).mockResolvedValueOnce({ getToken })

    const script = 'success'
    ;(getScript as jest.Mock).mockReturnValueOnce(script)

    const provider = Provider.GITHUB
    const code = '1234567890'
    const domainName = 'auth.example.com'
    const path = '/auth'
    const event = {
      ...proxyEvent,
      pathParameters: { provider },
      queryStringParameters: { code },
      requestContext: {
        ...proxyEvent.requestContext,
        domainName,
        http: {
          ...proxyEvent.requestContext?.http,
          path,
        },
      },
    }

    const callback: Callback<APIGatewayProxyResultV2> = (e, result) => {
      expect(e).toBeNull()

      expect(result).toStrictEqual(
        expect.objectContaining({
          body: script,
          headers: { 'Content-Type': 'text/html' },
          statusCode: 200,
        })
      )

      expect(getOAuthClient).toHaveBeenCalledTimes(1)
      expect(getOAuthClient).toHaveBeenCalledWith(provider)

      expect(getToken).toHaveBeenCalledTimes(1)
      expect(getToken).toHaveBeenCalledWith({
        code,
        // eslint-disable-next-line camelcase
        redirect_uri: `https://${domainName}${path}`,
      })

      done()
    }

    expect(handler(event, context, callback)).toBeUndefined()
  })

  it('returns HTTP 200 response with error script snippet on error getting token', async (done) => {
    const error = Object.assign(new Error('‾\\_(ツ)_/‾'), {
      details: {
        cause: 'Invalid code',
      },
    })
    const getToken = jest.fn().mockRejectedValueOnce(error)
    ;(getOAuthClient as jest.Mock).mockResolvedValueOnce({ getToken })

    const script = 'error'
    ;(getScript as jest.Mock).mockReturnValueOnce(script)

    const provider = Provider.GITHUB
    const code = '1234567890'
    const domainName = 'auth.example.com'
    const path = '/auth'
    const event = {
      ...proxyEvent,
      pathParameters: { provider },
      queryStringParameters: { code },
      requestContext: {
        ...proxyEvent.requestContext,
        domainName,
        http: {
          ...proxyEvent.requestContext?.http,
          path,
        },
      },
    }

    const callback: Callback<APIGatewayProxyResultV2> = (e, result) => {
      expect(e).toBeNull()

      expect(result).toStrictEqual(
        expect.objectContaining({
          body: script,
          headers: { 'Content-Type': 'text/html' },
          statusCode: 200,
        })
      )

      expect(getOAuthClient).toHaveBeenCalledTimes(1)
      expect(getOAuthClient).toHaveBeenCalledWith(provider)

      expect(getToken).toHaveBeenCalledTimes(1)
      expect(getToken).toHaveBeenCalledWith({
        code,
        // eslint-disable-next-line camelcase
        redirect_uri: `https://${domainName}${path}`,
      })

      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith(
        'Could not get token from OAuth provider',
        {
          error: {
            details: error.details,
            message: error.message,
            stack: error.stack,
          },
        }
      )

      done()
    }

    expect(handler(event, context, callback)).toBeUndefined()
  })
})
