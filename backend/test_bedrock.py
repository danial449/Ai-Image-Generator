import boto3
import os
from dotenv import load_dotenv

def test_bedrock_connection():
    load_dotenv()
    
    print("Testing AWS Bedrock connection...")
    
    try:
        # Initialize AWS Bedrock client
        bedrock = boto3.client(
            service_name='bedrock-runtime',
            region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        
        # List available models
        print("Listing available models...")
        bedrock_client = boto3.client('bedrock')
        models = bedrock_client.list_foundation_models()
        
        print("\nAvailable models:")
        for model in models.get('modelSummaries', []):
            print(f"- {model.get('modelId')}: {model.get('modelName')}")
        
        print("\nAWS Bedrock connection successful!")
        return True
        
    except Exception as e:
        print(f"\nError connecting to AWS Bedrock: {str(e)}")
        return False

if __name__ == "__main__":
    test_bedrock_connection() 