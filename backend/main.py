from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import boto3
import json
import os
import base64
from dotenv import load_dotenv
import asyncio
import uuid
import time

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AWS Bedrock client
bedrock = boto3.client(
    service_name='bedrock-runtime',
    region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

class PromptRequest(BaseModel):
    prompt: str
    platform: str = "web"  # Default to web, options: mobile, desktop, web
    style_preset: str = "photographic"  # Default style preset
    num_images: int = 4  # Default to 4 images

    @property
    def validate_num_images(self):
        if self.num_images < 1:
            raise ValueError("Number of images must be at least 1")
        if self.num_images > 100:
            raise ValueError("Number of images cannot exceed 100")
        return self.num_images

class VideoPromptRequest(BaseModel):
    prompt: str
    duration: int = 5  # Duration in seconds, default 5 seconds
    style_preset: str = "photographic"  # Default style preset

# Store for video generation jobs
video_jobs = {}

def generate_single_image(prompt: str, seed: int, platform: str = "web", style_preset: str = "photographic") -> dict:
    try:
        # Validate prompt length
        if len(prompt) > 1000:
            raise ValueError("Prompt is too long. Maximum length is 1000 characters.")
        
        # Set dimensions based on platform
        # AWS Bedrock SDXL supports dimensions between 512x512 and 1024x1024
        if platform == "mobile":
            # For mobile, use a portrait orientation
            width, height = 768, 1024  # Portrait orientation for mobile
        elif platform == "desktop":
            # For desktop, use a landscape orientation
            width, height = 1024, 768  # Landscape orientation for desktop
        else:  # web or default
            width, height = 1024, 1024  # Square for web
        
        request_body = {
            "text_prompts": [
                {
                    "text": prompt,
                    "weight": 1.0
                }
            ],
            "cfg_scale": 8.0,
            "steps": 50,
            "width": width,
            "height": height,
            "seed": seed,
            "style_preset": style_preset
        }
        
        print(f"Generating image with seed {seed} for platform {platform} ({width}x{height}) with style {style_preset}")
        try:
            response = bedrock.invoke_model(
                modelId='stability.stable-diffusion-xl-v1',
                contentType="application/json",
                accept="application/json",
                body=json.dumps(request_body)
            )
            
            response_body = json.loads(response.get('body').read())
            
            if 'artifacts' in response_body and len(response_body['artifacts']) > 0:
                return {
                    "base64": response_body['artifacts'][0]['base64'],
                    "platform": platform,
                    "width": width,
                    "height": height,
                    "style_preset": style_preset
                }
            else:
                print(f"Error in response: {response_body}")
                return None
        except Exception as e:
            if "ValidationException" in str(e) and "invalid_prompts" in str(e):
                # Extract filtered words from the prompt by comparing with known filtered words
                # Note: This is a simplified approach. In production, you'd want to use AWS Bedrock's
                # actual filtered words list or a more sophisticated detection method
                words = prompt.lower().split()
                # Common categories of filtered words to check (this is a minimal example)
                potential_filtered = [word for word in words if any(category in word for category in [
                    'nude', 'naked', 'sex', 'porn', 'gore', 'blood', 'violence', 'explicit',
                    'drug', 'terrorist', 'weapon', 'kill', 'death', 'abuse'
                ])]
                
                raise ValueError(f"Filtered words detected in prompt: {', '.join(potential_filtered) if potential_filtered else 'Content not allowed by safety system'}")
            raise
    except Exception as e:
        print(f"Error in generate_single_image: {str(e)}")
        raise

async def generate_video_frames(prompt: str, duration: int, style_preset: str) -> list:
    """Generate a sequence of images to create a video effect"""
    try:
        # Calculate number of frames based on duration (assuming 10 fps)
        fps = 10
        num_frames = duration * fps
        
        # Limit to a reasonable number of frames
        num_frames = min(num_frames, 30)
        
        print(f"Generating {num_frames} frames for video with prompt: {prompt}")
        
        # Generate frames in parallel
        tasks = []
        for i in range(num_frames):
            # Use different seeds for each frame to create variation
            seed = i * 100
            tasks.append(asyncio.to_thread(generate_single_image, prompt, seed, "desktop", style_preset))

        
        # Wait for all frames to be generated
        frames = []
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                print(f"Error generating frame: {str(result)}")
                continue
            if result:
                frames.append(result)
        
        if not frames:
            raise Exception("No frames were generated for the video")
        
        return frames
    except Exception as e:
        print(f"Error generating video frames: {str(e)}")
        raise

def check_filtered_words(prompt: str) -> tuple[bool, list[str]]:
    """Check if the prompt contains any filtered words and return them"""
    words = prompt.lower().split()
    filtered_categories = [
        'nude', 'naked', 'sex', 'porn', 'gore', 'blood', 'violence', 'explicit',
        'drug', 'terrorist', 'weapon', 'kill', 'death', 'abuse', 'child', 'children'
    ]
    potential_filtered = [word for word in words if any(category in word for category in filtered_categories)]
    return bool(potential_filtered), potential_filtered

@app.post("/generate-images")
async def generate_images(request: PromptRequest):
    try:
        # Validate number of images first
        try:
            num_images = request.validate_num_images
        except ValueError as ve:
            raise HTTPException(
                status_code=400,
                detail=str(ve)
            )

        # Check for filtered words before starting image generation
        has_filtered, filtered_words = check_filtered_words(request.prompt)
        if has_filtered:
            raise HTTPException(
                status_code=400,
                detail=f"Your prompt contains filtered words that are not allowed: {', '.join(filtered_words)}. Please modify your prompt to avoid inappropriate or sensitive content."
            )

        # Use the prompt directly without t-shirt enhancement
        enhanced_prompt = request.prompt
        
        print(f"Generating {num_images} images for prompt: {enhanced_prompt} for platform: {request.platform} with style: {request.style_preset}")
        
        tasks = []
        for i in range(num_images):
            tasks.append(asyncio.to_thread(generate_single_image, enhanced_prompt, i*100, request.platform, request.style_preset))
        
        # Wait for all images to be generated
        images = []
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                error_str = str(result)
                print(f"Error generating image: {error_str}")
                # Still check for other types of errors
                if "ValidationException" in error_str and "invalid_prompts" in error_str:
                    # If somehow a filtered word was missed in our pre-check
                    raise HTTPException(
                        status_code=400,
                        detail="Additional content filtering applied by the AI system. Please modify your prompt."
                    )
                continue
            if result:
                images.append(result)
        
        if not images:
            raise HTTPException(
                status_code=500,
                detail="No images were generated. Please try again with a different prompt."
            )
        
        return {"images": images}
    
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=400,
            detail=str(ve)
        )
    except Exception as e:
        error_message = str(e)
        print(f"Error generating images: {error_message}")
        
        if "AccessDeniedException" in error_message:
            raise HTTPException(
                status_code=403,
                detail="AWS Bedrock access denied. Please check your credentials and permissions."
            )
        elif "ValidationException" in error_message and "invalid_prompts" in error_message:
            # Try to extract filtered words if they weren't caught in the pre-check
            _, filtered_words = check_filtered_words(request.prompt)
            error_detail = "Your prompt contains filtered words that are not allowed"
            if filtered_words:
                error_detail += f": {', '.join(filtered_words)}"
            error_detail += ". Please modify your prompt to avoid inappropriate or sensitive content."
            
            raise HTTPException(
                status_code=400,
                detail=error_detail
            )
        elif "ValidationException" in error_message:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid request parameters: {error_message}"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating images: {error_message}"
            )

@app.post("/generate-video")
async def generate_video(request: VideoPromptRequest):
    try:
        # Create a unique job ID
        job_id = str(uuid.uuid4())
        
        # Initialize job status
        video_jobs[job_id] = {
            "status": "processing",
            "progress": 0,
            "frames": [],
            "error": None
        }
        
        # Start the video generation process in the background
        asyncio.create_task(process_video_generation(job_id, request))
        
        return {"job_id": job_id, "status": "processing"}
    
    except Exception as e:
        error_message = str(e)
        print(f"Error initiating video generation: {error_message}")
        raise HTTPException(
            status_code=500,
            detail=f"Error initiating video generation: {error_message}"
        )

async def process_video_generation(job_id: str, request: VideoPromptRequest):
    try:
        # Update job status
        video_jobs[job_id]["status"] = "processing"
        video_jobs[job_id]["progress"] = 10
        
        # Generate frames for the video
        frames = await generate_video_frames(request.prompt, request.duration, request.style_preset)
        
        # Update job status
        video_jobs[job_id]["progress"] = 50
        video_jobs[job_id]["frames"] = frames
        
        # Simulate video processing (in a real implementation, you would use a video processing library)
        # For now, we'll just return the frames as a sequence
        video_jobs[job_id]["status"] = "completed"
        video_jobs[job_id]["progress"] = 100
        
    except Exception as e:
        error_message = str(e)
        print(f"Error in video generation process: {error_message}")
        video_jobs[job_id]["status"] = "failed"
        video_jobs[job_id]["error"] = error_message

@app.get("/video-status/{job_id}")
async def get_video_status(job_id: str):
    if job_id not in video_jobs:
        raise HTTPException(
            status_code=404,
            detail="Video job not found"
        )
    
    job = video_jobs[job_id]
    
    if job["status"] == "completed":
        return {
            "status": "completed",
            "progress": 100,
            "frames": job["frames"]
        }
    elif job["status"] == "failed":
        return {
            "status": "failed",
            "error": job["error"]
        }
    else:
        return {
            "status": "processing",
            "progress": job["progress"]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 