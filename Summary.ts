import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AiSummaryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const LambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    LambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
  

    );
    LambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    );

    const Lambda = new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      code: lambda.Code.fromAsset(path.resolve(__dirname,'lambda')),
      handler: 'index.lambda_handler',
      role: LambdaRole,
      timeout: cdk.Duration.seconds(70),
    });

    const apigateways = new api.RestApi(this, 'ApiGateway', {
      restApiName: 'AiSummary',
      deployOptions: {
        stageName: 'prod',
      },
    });

    const moviePosterDesignResource = apigateways.root.addResource('demoManufacturing');


   

    const PostMethod = moviePosterDesignResource.addMethod(
      'POST',
      new api.LambdaIntegration(Lambda, {
        proxy: false, // Turn off Lambda proxy integration
        requestTemplates: {
          'application/json': '{ "prompt" : "$input.params(\'prompt\')" }',
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': '$input.json("$.body")', // Update this based on your Lambda function response
            },
          },
        ],
      }),
      {
        requestParameters: {
          'method.request.querystring.prompt': true,
        },
        requestValidatorOptions: {
          requestValidatorName: 'Validate query string parameters and headers',
          validateRequestParameters: true,
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      }
    );



    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'AiSummaryQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
