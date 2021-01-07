import { AuthorizationCode } from 'simple-oauth2'
import { getOAuthClient, Provider } from './get-oauth-client'
import { getSecret } from './get-secret'

jest.mock('simple-oauth2')
jest.mock('./get-secret')

describe('getOAuthClient', () => {
  afterEach(() => {
    ;(AuthorizationCode as jest.MockedClass<
      typeof AuthorizationCode
    >).mockClear()
  })

  it.each([
    [
      'bitbucket',
      {
        authorizePath: '/site/oauth2/authorize',
        tokenHost: 'https://bitbucket.org',
        tokenPath: '/site/oauth2/access_token',
      },
    ],
    [
      'github',
      {
        authorizePath: '/login/oauth/authorize',
        tokenHost: 'https://github.com',
        tokenPath: '/login/oauth/access_token',
      },
    ],
  ] as [Provider, Record<string, string>][])(
    'returns a pre-initialized OAuth client for given provider `%s`',
    async (provider, auth) => {
      const client = {
        id: '',
        token: '',
      }

      ;(getSecret as jest.Mock).mockResolvedValueOnce({ [provider]: client })

      await expect(getOAuthClient(provider)).resolves.toBeInstanceOf(
        AuthorizationCode
      )

      expect(AuthorizationCode).toHaveBeenCalledTimes(1)
      expect(AuthorizationCode).toHaveBeenCalledWith({ auth, client })
    }
  )
})
