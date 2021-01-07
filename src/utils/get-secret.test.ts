import { AWSError, Request, SecretsManager } from 'aws-sdk'
import { GetSecretValueRequest } from 'aws-sdk/clients/secretsmanager'
import { getSecret } from './get-secret'

jest.mock('aws-sdk', () => ({
  SecretsManager: jest.fn().mockImplementationOnce(() => ({
    getSecretValue: jest.fn(() => ({
      promise: jest.fn(() => ({ SecretString: '' })),
    })),
  })),
}))

describe('getSecret', () => {
  const secretsManager = ((SecretsManager as unknown) as jest.MockedClass<
    typeof SecretsManager
  >).mock.results[0].value as jest.Mocked<SecretsManager>

  it('resolves a secret string by ARN in environment variable', async () => {
    const secret = { jest: 'unit-test' }
    const secretString = JSON.stringify(secret)

    secretsManager.getSecretValue.mockReturnValueOnce(({
      promise: jest.fn().mockResolvedValueOnce({ SecretString: secretString }),
    } as unknown) as Request<GetSecretValueRequest, AWSError>)

    await expect(getSecret()).resolves.toStrictEqual(secret)
  })

  it('throws if secret string could not be resolved', async () => {
    secretsManager.getSecretValue.mockReturnValueOnce(({
      promise: jest.fn().mockResolvedValueOnce({}),
    } as unknown) as Request<GetSecretValueRequest, AWSError>)

    await expect(getSecret()).rejects.toThrow(
      'Could not resolve OAuth provider secret'
    )
  })
})
