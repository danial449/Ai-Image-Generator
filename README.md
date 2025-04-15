# T-Shirt Design Generator

An AI-powered t-shirt design generator using AWS Bedrock and React. This application allows users to generate unique t-shirt designs by providing text prompts.

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- AWS Account with Bedrock access
- AWS Access Key ID and Secret Access Key

## Setup

1. Clone the repository
2. Set up the backend:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the backend directory with your AWS credentials:

   ```
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

4. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

## Running the Application

1. Start the backend server:

   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. Start the frontend development server:

   ```bash
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter a description of the t-shirt design you want to generate
2. Click "Generate Designs"
3. Wait for the AI to generate 10 unique designs
4. Browse through the generated designs

## Features

- Modern, responsive UI
- Real-time image generation
- Error handling and loading states
- Grid layout for displaying multiple designs
- AWS Bedrock integration for high-quality image generation

## Security Notes

- Never commit your AWS credentials to version control
- In production, implement proper authentication and authorization
- Use environment variables for sensitive information
