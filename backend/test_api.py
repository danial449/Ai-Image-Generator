import requests
import json
import time
import sys

def test_api():
    # API endpoint
    url = "http://localhost:8000"
    
    # Headers
    headers = {
        "Content-Type": "application/json"
    }
    
    # Test cases for image generation
    image_test_cases = [
        {
            "prompt": "A beautiful mountain landscape with a sunset",
            "platform": "web",
            "style_preset": "photographic"
        },
        {
            "prompt": "A minimalist logo with a cat silhouette",
            "platform": "mobile",
            "style_preset": "line-art"
        },
        {
            "prompt": "A colorful abstract pattern",
            "platform": "desktop",
            "style_preset": "digital-art"
        }
    ]
    
    # Test cases for video generation
    video_test_cases = [
        {
            "prompt": "A scene that transitions from day to night",
            "duration": 3,
            "style_preset": "cinematic"
        },
        {
            "prompt": "Animated waves on a beach",
            "duration": 5,
            "style_preset": "watercolor"
        }
    ]
    
    # Test image generation
    print("\n=== Testing Image Generation ===")
    for i, test_case in enumerate(image_test_cases):
        print(f"\nTest case {i+1}:")
        print(f"Prompt: {test_case['prompt']}")
        print(f"Platform: {test_case['platform']}")
        print(f"Style: {test_case['style_preset']}")
        
        try:
            response = requests.post(
                f"{url}/generate-images",
                headers=headers,
                data=json.dumps(test_case)
            )
            
            print(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "images" in data:
                    images = data["images"]
                    print(f"Generated {len(images)} images")
                    
                    for j, image in enumerate(images):
                        base64_length = len(image["base64"])
                        width = image.get("width", "unknown")
                        height = image.get("height", "unknown")
                        style = image.get("style_preset", "unknown")
                        print(f"  Image {j+1}: Base64 length: {base64_length}, Dimensions: {width}x{height}, Style: {style}")
                else:
                    print("Unexpected response format: 'images' key not found")
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Exception: {str(e)}")
    
    # Test video generation
    print("\n=== Testing Video Generation ===")
    for i, test_case in enumerate(video_test_cases):
        print(f"\nTest case {i+1}:")
        print(f"Prompt: {test_case['prompt']}")
        print(f"Duration: {test_case['duration']} seconds")
        print(f"Style: {test_case['style_preset']}")
        
        try:
            # Start video generation
            response = requests.post(
                f"{url}/generate-video",
                headers=headers,
                data=json.dumps(test_case)
            )
            
            print(f"Status code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if "job_id" in data:
                    job_id = data["job_id"]
                    print(f"Job ID: {job_id}")
                    
                    # Poll for status updates
                    max_attempts = 10
                    attempt = 0
                    
                    while attempt < max_attempts:
                        time.sleep(2)  # Wait 2 seconds between polls
                        
                        status_response = requests.get(
                            f"{url}/video-status/{job_id}",
                            headers=headers
                        )
                        
                        if status_response.status_code == 200:
                            status_data = status_response.json()
                            status = status_data.get("status")
                            progress = status_data.get("progress", 0)
                            
                            print(f"Status: {status}, Progress: {progress}%")
                            
                            if status == "completed":
                                frames = status_data.get("frames", [])
                                print(f"Video generation completed with {len(frames)} frames")
                                
                                for j, frame in enumerate(frames[:3]):  # Show details for first 3 frames
                                    base64_length = len(frame["base64"])
                                    width = frame.get("width", "unknown")
                                    height = frame.get("height", "unknown")
                                    style = frame.get("style_preset", "unknown")
                                    print(f"  Frame {j+1}: Base64 length: {base64_length}, Dimensions: {width}x{height}, Style: {style}")
                                
                                if len(frames) > 3:
                                    print(f"  ... and {len(frames) - 3} more frames")
                                break
                            elif status == "failed":
                                error = status_data.get("error", "Unknown error")
                                print(f"Video generation failed: {error}")
                                break
                        
                        attempt += 1
                    
                    if attempt >= max_attempts:
                        print("Timed out waiting for video generation to complete")
                else:
                    print("Unexpected response format: 'job_id' key not found")
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Exception: {str(e)}")

if __name__ == "__main__":
    test_api() 