import { AuthorizationCode } from 'simple-oauth2'
import { getSecret } from './get-secret'

export enum Provider {
  BITBUCKET = 'bitbucket',
  GITHUB = 'github',
}

const config = {
  [Provider.BITBUCKET]: {
    authorizePath: '/site/oauth2/authorize',
    tokenHost: 'https://bitbucket.org',
    tokenPath: '/site/oauth2/access_token',
  },
  [Provider.GITHUB]: {
    authorizePath: '/login/oauth/authorize',
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
  },
}

export async function getOAuthClient(
  provider: Provider
): Promise<AuthorizationCode> {
  const secret = await getSecret()

  return new AuthorizationCode({
    auth: config[provider],
    client: secret[provider],
  })
}
