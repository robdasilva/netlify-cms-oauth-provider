import {
  LambdaIntegration,
  MockIntegration,
  RestApi,
} from '@aws-cdk/aws-apigateway'
import { DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager'
import { Runtime } from '@aws-cdk/aws-lambda'
import {
  LogLevel,
  NodejsFunction,
  NodejsFunctionProps,
} from '@aws-cdk/aws-lambda-nodejs'
import { ARecord, HostedZone, RecordTarget } from '@aws-cdk/aws-route53'
import { ApiGateway } from '@aws-cdk/aws-route53-targets'
import { Secret } from '@aws-cdk/aws-secretsmanager'
import { App, Duration, Stack, StackProps } from '@aws-cdk/core'

interface INetlifyCMSOAuthProviderProps extends StackProps {
  allowOrigins: string[]
  hostedZoneId?: string
  subdomain: string
  zoneName?: string
}

export default class NetlifyCMSOAuthProvider extends Stack {
  constructor(
    app: App,
    id: string,
    {
      allowOrigins,
      hostedZoneId,
      subdomain,
      zoneName,
      ...props
    }: INetlifyCMSOAuthProviderProps
  ) {
    super(app, 'NetlifyCMSOAuthProvider', props)

    const restApiName = `${this.stackName}-rest-api`
    const restApi = new RestApi(this, id + 'RestApi', {
      defaultCorsPreflightOptions: {
        allowMethods: ['GET'],
        allowOrigins,
      },
      deployOptions: {
        stageName: 'auth',
      },
      endpointExportName: `${restApiName}-url`,
      restApiName,
    })

    const secret = new Secret(this, id + 'Secret', {
      secretName: `${this.stackName}-secret`,
    })

    if (zoneName) {
      const hostedZone = hostedZoneId
        ? HostedZone.fromHostedZoneAttributes(
            this,
            id + 'PreExistingHostedZone',
            {
              hostedZoneId,
              zoneName,
            }
          )
        : new HostedZone(this, id + 'HostedZone', {
            zoneName,
          })

      const domainName = `${subdomain}.${hostedZone.zoneName}`

      const certificate = new DnsValidatedCertificate(
        this,
        id + 'Certificate',
        {
          domainName,
          hostedZone,
        }
      )

      restApi.addDomainName(id + 'RestApiDomainName', {
        certificate,
        domainName,
      })

      new ARecord(this, id + 'RestApiAliasRecord', {
        recordName: domainName,
        target: RecordTarget.fromAlias(new ApiGateway(restApi)),
        zone: hostedZone,
      })
    }

    const defaultLambdaProps: NodejsFunctionProps = {
      bundling: {
        logLevel: LogLevel.ERROR, // Remove to see warnings when debugging
        sourceMap: true,
      },
      environment: {
        OAUTH_PROVIDER_SECRET_ARN: secret.secretArn,
        ORIGINS: allowOrigins.join(','),
      },
      logRetention: 7,
      memorySize: 128,
      runtime: Runtime.NODEJS_12_X,
      timeout: Duration.seconds(30),
    }

    const getAuth = new NodejsFunction(this, id + 'GetAuth', {
      ...defaultLambdaProps,
      entry: 'src/auth/get-auth.ts',
      functionName: this.stackName + '-http-get-auth',
    })

    const getAuthCallback = new NodejsFunction(this, id + 'GetAuthCallback', {
      ...defaultLambdaProps,
      entry: 'src/auth/get-auth-callback.ts',
      functionName: this.stackName + '-http-get-auth-callback',
    })

    const restApiRouteAuth = zoneName
      ? restApi.root.addResource('auth')
      : restApi.root
    const restApiRouteAuthCallback = restApiRouteAuth.addResource('{provider}')
    const restApiRouteAuthSuccess = restApiRouteAuth.addResource('success')

    restApiRouteAuth.addMethod('GET', new LambdaIntegration(getAuth))
    restApiRouteAuthCallback.addMethod(
      'GET',
      new LambdaIntegration(getAuthCallback)
    )
    restApiRouteAuthSuccess.addMethod(
      'GET',
      new MockIntegration({ integrationResponses: [{ statusCode: '204' }] })
    )

    secret.grantRead(getAuth)
    secret.grantRead(getAuthCallback)
  }
}
