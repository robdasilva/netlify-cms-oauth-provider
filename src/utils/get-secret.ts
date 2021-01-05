import { SecretsManager } from 'aws-sdk'
import { Provider } from './get-oauth-client'

const secretsManager = new SecretsManager()

interface IOAuthProviderSecret {
  id: string
  secret: string
}

export async function getSecret(): Promise<
  Record<Provider, IOAuthProviderSecret>
> {
  const { SecretString: secretString } = await secretsManager
    .getSecretValue({
      SecretId: process.env.OAUTH_PROVIDER_SECRET_ARN!,
    })
    .promise()

  if (!secretString) {
    throw new Error('Could not resolve OAuth provider secret')
  }

  return JSON.parse(secretString)
}
