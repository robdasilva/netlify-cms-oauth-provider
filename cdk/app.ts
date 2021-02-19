import { Cors } from '@aws-cdk/aws-apigateway'
import { App } from '@aws-cdk/core'
import { name } from '../package.json'
import NetlifyCMSOAuthProvider from './stack'

const app = new App()
const hostedZoneId = app.node.tryGetContext('hosted-zone-id')
const origins = app.node.tryGetContext('origins')
const region = app.node.tryGetContext('region')
const subdomain = app.node.tryGetContext('subdomain') || 'auth'
const zoneName = app.node.tryGetContext('zone-name')

const allowOrigins =
  origins?.split(',').map((origin: string) => origin.trim()) || Cors.ALL_ORIGINS

new NetlifyCMSOAuthProvider(app, 'NetlifyCMSOAuthProvider', {
  allowOrigins,
  env: { region },
  hostedZoneId,
  stackName: name,
  subdomain,
  zoneName,
})

app.synth()
