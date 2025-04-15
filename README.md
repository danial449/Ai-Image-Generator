# AI Image Generator

An AI-powered image generator using AWS Bedrock and React. This application allows users to generate unique images by providing text prompts.

## Features

- Text-to-image generation using AWS Bedrock's Stable Diffusion model
- Real-time image generation
- Multiple style presets
- Support for different image dimensions (web, mobile, desktop)
- Modern React frontend with Material-UI
- FastAPI backend
- Error handling and validation
- Download generated images

## Prerequisites

- Python 3.8+
- Node.js 14+
- AWS account with Bedrock access
- AWS credentials configured

## Installation

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv env
```

3. Activate the virtual environment:

- Windows:

```bash
.\env\Scripts\activate
```

- Unix/MacOS:

```bash
source env/bin/activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

## Usage

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

## How to Use

1. Enter a description of the image you want to generate
2. Select your preferred style preset and platform
3. Choose the number of images to generate
4. Click "Generate Images"
5. Wait for the AI to generate your images
6. Browse through the generated images
7. Download any images you like

## Technical Details

### Backend

- FastAPI for the REST API
- AWS Bedrock for AI image generation
- Async/await for efficient request handling
- Error handling and input validation

### Frontend

- React for the UI framework
- Material-UI for components
- Responsive design
- Grid layout for displaying multiple images
- Error handling and loading states

## Environment Variables

Create a `.env` file in the backend directory with:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=your_region
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
