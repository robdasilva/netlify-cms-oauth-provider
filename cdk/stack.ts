import { DomainName, HttpApi, HttpMethod } from '@aws-cdk/aws-apigatewayv2'
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations'
import { DnsValidatedCertificate } from '@aws-cdk/aws-certificatemanager'
import { Runtime } from '@aws-cdk/aws-lambda'
import {
  LogLevel,
  NodejsFunction,
  NodejsFunctionProps,
} from '@aws-cdk/aws-lambda-nodejs'
import { ARecord, HostedZone, RecordTarget } from '@aws-cdk/aws-route53'
import { ApiGatewayv2Domain } from '@aws-cdk/aws-route53-targets'
import { Secret } from '@aws-cdk/aws-secretsmanager'
import { App, CfnOutput, Duration, Stack, StackProps } from '@aws-cdk/core'

interface INetlifyCMSOAuthProviderProps extends StackProps {
  allowOrigins: string[]
  hostedZoneId?: string
  subdomain: string
  zoneName?: string
}

export default class NetlifyCMSOAuthProvider extends Stack {
  private domainName?: DomainName

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
    super(app, id, props)

    const secret = new Secret(this, id + 'Secret', {
      secretName: `${this.stackName}-secret`,
    })

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

    secret.grantRead(getAuth)
    secret.grantRead(getAuthCallback)

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

      this.domainName = new DomainName(this, id + 'ApiDomain', {
        certificate,
        domainName,
      })

      new ARecord(this, id + 'RestApiAliasRecord', {
        recordName: domainName,
        target: RecordTarget.fromAlias(new ApiGatewayv2Domain(this.domainName)),
        zone: hostedZone,
      })
    }

    const apiName = `${this.stackName}-api`
    const api = new HttpApi(this, id + 'Api', {
      apiName,
      corsPreflight: {
        allowMethods: [HttpMethod.GET],
        allowOrigins,
      },
      ...(this.domainName && {
        defaultDomainMapping: {
          domainName: this.domainName,
        },
      }),
    })

    api.addRoutes({
      integration: new LambdaProxyIntegration({
        handler: getAuth,
      }),
      methods: [HttpMethod.GET],
      path: '/auth',
    })

    api.addRoutes({
      integration: new LambdaProxyIntegration({
        handler: getAuthCallback,
      }),
      methods: [HttpMethod.GET],
      path: '/auth/{provider}',
    })

    new CfnOutput(this, id + 'ApiEndpointUrl', {
      value: api.apiEndpoint,
    })
  }
}
