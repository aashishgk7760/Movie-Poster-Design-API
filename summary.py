import boto3
import json

client = boto3.client('bedrock-runtime')

def lambda_handler(event, context):

    input_prompt = event['prompt']
    print(input_prompt)

    client_bedrock = client.invoke_model(
        contentType="application/json",
        accept="application/json",
        modelId="cohere.command-light-text-v14",
        body=json.dumps({
        "prompt": input_prompt,
        "temperature": 0.9,
        "p": 0.75,
        "k": 0,
        "max_tokens": 2000,
})
    )

    # print(client_bedrock)

    clinet_bedrock_byte = client_bedrock['body'].read()
    print(clinet_bedrock_byte)
    clinet_bedrock_json = json.loads(clinet_bedrock_byte)
    print(clinet_bedrock_json)
    generated_text = clinet_bedrock_json['generations'][0]['text']
    print(generated_text)





    # Create a DynamoDB resource
    

    # Return the response
    return {
        'statusCode': 200,
        'body': json.dumps(generated_text)
    }
