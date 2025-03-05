# Terraform AWS Deployment

This directory contains Terraform configurations for deploying the Nomad Crew frontend application to AWS using EKS (Elastic Kubernetes Service).

## Prerequisites

- AWS Account
- GitHub Repository
- Terraform installed locally (for testing)
- AWS CLI installed locally (for testing)
- kubectl installed locally (for testing)

## Setting Up GitHub Secrets

To enable GitHub Actions to deploy to AWS, you need to set up the following secrets in your GitHub repository:

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click on "New repository secret"
4. Add the following secrets:

### AWS Credentials

- `AWS_ACCESS_KEY_ID`: Your AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret access key

These credentials should belong to an IAM user with the following permissions:

- AmazonECR-FullAccess
- AmazonEKSClusterPolicy
- AmazonVPCFullAccess

### Application Secrets

- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_URL`: Your Supabase URL
- `GOOGLE_WEB_CLIENT_ID`: Your Google Web Client ID
- `GOOGLE_PLACES_API_KEY`: Your Google Places API Key

### Kubernetes Configuration

After the initial deployment, you'll need to add:

- `KUBE_CONFIG`: The base64-encoded kubeconfig file for your EKS cluster

## How to Obtain the Required Secrets

### AWS Credentials

1. Log in to the AWS Management Console
2. Navigate to IAM (Identity and Access Management)
3. Create a new IAM user or use an existing one
4. Attach the required policies (mentioned above)
5. Generate access keys for the user
6. Save the Access Key ID and Secret Access Key

### Supabase Credentials

1. Log in to your Supabase dashboard
2. Select your project
3. Go to Project Settings > API
4. Copy the "anon" key and the URL

### Google Credentials

1. Go to the Google Cloud Console
2. Navigate to APIs & Services > Credentials
3. Create or select your OAuth 2.0 Client ID for the Web Client ID
4. Create or select your API Key for the Places API
5. Copy these values

### Kubernetes Configuration

After the initial Terraform deployment:

1. Configure your local AWS CLI with your credentials:

   ```
   aws configure
   ```

2. Update your kubeconfig:

   ```
   aws eks update-kubeconfig --region us-east-1 --name nomad-crew-cluster
   ```

3. Encode your kubeconfig file to base64:

   ```
   cat ~/.kube/config | base64
   ```

4. Add this as the `KUBE_CONFIG` secret in GitHub

## Deployment Process

The GitHub Actions workflow will:

1. Validate the Terraform configuration
2. Plan the Terraform changes
3. Build and push the Docker image to ECR
4. Apply the Terraform changes to create/update the infrastructure
5. Deploy the application to Kubernetes

## Manual Testing

To test the deployment locally:

1. Initialize Terraform:

   ```
   terraform init
   ```

2. Plan the changes:

   ```
   terraform plan
   ```

3. Apply the changes:

   ```
   terraform apply
   ```

4. To destroy the infrastructure when no longer needed:

   ```
   terraform destroy
   ```

## Troubleshooting

- **Error: Unable to authenticate to AWS**: Check your AWS credentials
- **Error: EKS cluster creation fails**: Ensure your IAM user has sufficient permissions
- **Error: Kubernetes deployment fails**: Check the kubeconfig and ensure it's correctly encoded
- **Error: Docker build fails**: Verify your Dockerfile and build context

## Security Considerations

- Use IAM roles with the principle of least privilege
- Regularly rotate your AWS access keys
- Store sensitive values only in GitHub Secrets, never in code
- Consider using AWS Parameter Store or Secrets Manager for production secrets
