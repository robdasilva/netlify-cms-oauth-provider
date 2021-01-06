# netlify-cms-oauth-provider

Serverless external OAuth client for Netlify CMS built with AWS CDK

## Deployment

### TL;DR

```bash
$ git clone git@github.com:rschweizer/netlify-cms-oauth-provider.git

$ cd netlify-cms-oauth-provider

$ npm run deploy [-- [-c origins='https://example.com,https://www.example.com'] [-c hosted-zone-id='XXXXXXXXXXXXXXXXXXXX'] [-c subdomain='auth'] [-c zone-name='example.com'] [--profile 'your-aws-profile']]
```

### Prerequisites

In order to deploy the stack to AWS, you need to have an AWS profile configured and the CDK Toolkit must be bootstrapped in the corresponsing AWS account.

To setup you AWS profile(s) on your machine, please refer to the AWS CLI docs on [Configuring the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html).

If the CDK is not already bootstrappe in the respective AWS account, you can do so, once you have configured your AWS credentials in a configuration file, by running the following command in this repository:

```
$ npx cdk bootstrap
```

For more information please refer to the AWS CDK docs on [Getting started](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html).

### Configuration

You can pass runtime context to the `deploy` script to customize the deployment.

_Please mind the double-dash (`--`) when using `npm run` to pass the args to the underlying command and not the `run` command itself._

#### Options

##### `origins`

(Optional) Comma-separated list of allowed origins for your OAuth provider.

_Defaults to *all* origins (`'*'`)_

```bash
npm run deploy -- -c origins='https://example.com,https://www.example.com'
```

##### `hosted-zone-id`

(Optional) ID of the AWS Route53 Hosted Zone for the specified [`zone-name`](#zone-name), if already exists.

_Only valid in combination with [`zone-name`](#zone-name), ignored otherwise._

```bash
npm run deploy -- -c hosted-zone-id='XXXXXXXXXXXXXXXXXXXX' -c zone-name='example.com'
```

##### `subdomain`

(Optional) The subdomain on the specified [`zone-name`](#zone-name) to link to the deployed OAuth provider.

_Only valid in combination with [`zone-name`](#zone-name), ignored otherwise. Defaults to `'auth'`, e.g. `auth.example.com`._

```bash
npm run deploy -- -c subdomain='auth' -c zone-name='example.com'
```

##### `zone-name`

(Optional) Name of the zone, i.e. custom domain, to attach the deployed OAuth provider to.

_Use [`hosted-zone-id`](#hosted-zone-id), if you already have a AWS Route53 hosted zone for the specified `zone-name`. Otherwise a new hosted zone will be created automatically._

```bash
npm run deploy -- -c zone-name='example.com'
```

## Feedback

Feedback is welcome for this repository! If you encounter any problems or would like to raise a feature request, please feel free to open an issue to start a friendly discussion.
