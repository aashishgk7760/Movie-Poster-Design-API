import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path'

export class MoviePosterDesignStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const movieBucket = new s3.Bucket(this, 'moviePosterdesignfortest', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaRole = new iam.Role(this, 'lambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess')

      ],
    });

    const functionw = new lambda.Function(this, 'MoviePosterDesign', {
      runtime: lambda.Runtime.PYTHON_3_11,
      role: lambdaRole,
      memorySize: 4096,
      code: lambda.Code.fromAsset(path.resolve(__dirname,'lambda')),
      handler: 'lambda.lambda_handler',
      timeout: cdk.Duration.seconds(70),
      environment: {
        BUCKET: movieBucket.bucketName
      },

    });
    const apiv1 = new api.RestApi(this, 'MoviePosterDesignAPI', {
      restApiName: 'MoviePosterDesignAPI',
      description: 'API for movie poster design',
      deployOptions: {
        stageName: 'prod',
      },
    });

    // Create the Resource
    const moviePosterDesignResource = apiv1.root.addResource('MoviePosterDesignAPI');

const getMethod = moviePosterDesignResource.addMethod(
  'GET',
  new api.LambdaIntegration(functionw, {
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


  }
}
