import React, { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Grid,
  Card,
  CardMedia,
  Typography,
  CircularProgress,
  Box,
  AppBar,
  Toolbar,
  Alert,
  Snackbar,
  CardActions,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  Paper,
  Tabs,
  Tab,
  Slider,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";

function App() {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("web");
  const [stylePreset, setStylePreset] = useState("photographic");
  const [numImages, setNumImages] = useState(4);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [openSuccessSnackbar, setOpenSuccessSnackbar] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Video generation states
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoStylePreset, setVideoStylePreset] = useState("photographic");
  const [videoJobId, setVideoJobId] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [videoFrames, setVideoFrames] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackInterval, setPlaybackInterval] = useState(null);

  // Available style presets with descriptions
  const stylePresets = [
    {
      value: "photographic",
      label: "Photographic",
      description: "Realistic, high-quality photos",
    },
    {
      value: "digital-art",
      label: "Digital Art",
      description: "Digital illustrations and artwork",
    },
    { value: "anime", label: "Anime", description: "Anime and manga style" },
    {
      value: "comic-book",
      label: "Comic Book",
      description: "Comic book and graphic novel style",
    },
    {
      value: "fantasy-art",
      label: "Fantasy Art",
      description: "Fantasy and imaginative artwork",
    },
    {
      value: "line-art",
      label: "Line Art",
      description: "Clean, minimalist line drawings",
    },
    {
      value: "analog-film",
      label: "Analog Film",
      description: "Vintage film photography look",
    },
    {
      value: "cinematic",
      label: "Cinematic",
      description: "Movie-like scenes and compositions",
    },
    {
      value: "3d-model",
      label: "3D Model",
      description: "3D rendered objects and scenes",
    },
    {
      value: "pixel-art",
      label: "Pixel Art",
      description: "Retro pixel art style",
    },
    {
      value: "tile-texture",
      label: "Tile Texture",
      description: "Seamless texture patterns",
    },
    {
      value: "origami",
      label: "Origami",
      description: "Paper folding and origami style",
    },
    {
      value: "watercolor",
      label: "Watercolor",
      description: "Watercolor painting style",
    },
    {
      value: "oil-painting",
      label: "Oil Painting",
      description: "Classical oil painting style",
    },
    {
      value: "sketch",
      label: "Sketch",
      description: "Hand-drawn sketch style",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setImages([]);

    try {
      const response = await axios.post(
        "http://localhost:8000/generate-images",
        {
          prompt: prompt,
          platform: platform,
          style_preset: stylePreset,
          num_images: numImages,
        }
      );

      if (response.data.images && response.data.images.length > 0) {
        setImages(response.data.images);
      } else {
        setError(
          "No images were generated because of filtered words. Please try again with a different prompt."
        );
        setOpenSnackbar(true);
      }
    } catch (err) {
      console.error("Error:", err);
      let errorMessage = "Error generating images. Please try again.";

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = err.response.data.detail || err.response.statusText;
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage =
          "No response from server. Please check if the backend is running.";
      }

      setError(errorMessage);
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleCloseSuccessSnackbar = () => {
    setOpenSuccessSnackbar(false);
  };

  const handleDownloadImage = (base64Data, index, platform, stylePreset) => {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: "image/png" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tshirt-design-${platform}-${stylePreset}-${
        index + 1
      }.png`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      setSuccessMessage(`Image ${index + 1} downloaded successfully!`);
      setOpenSuccessSnackbar(true);
    } catch (err) {
      console.error("Error downloading image:", err);
      setError("Error downloading image. Please try again.");
      setOpenSnackbar(true);
    }
  };

  const getPlatformLabel = (platform) => {
    switch (platform) {
      case "mobile":
        return "Mobile (768×1024)";
      case "desktop":
        return "Desktop (1024×768)";
      case "web":
      default:
        return "Web (1024×1024)";
    }
  };

  const getStylePresetLabel = (stylePreset) => {
    const preset = stylePresets.find((p) => p.value === stylePreset);
    return preset ? preset.label : stylePreset;
  };

  // Video generation functions
  const handleVideoSubmit = async (e) => {
    e.preventDefault();
    setVideoLoading(true);
    setVideoError("");
    setVideoFrames([]);
    setVideoStatus(null);
    setCurrentFrameIndex(0);
    setIsPlaying(false);
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }

    try {
      const response = await axios.post(
        "http://localhost:8000/generate-video",
        {
          prompt: videoPrompt,
          duration: videoDuration,
          style_preset: videoStylePreset,
        }
      );

      if (response.data.job_id) {
        setVideoJobId(response.data.job_id);
        setVideoStatus("processing");

        // Start polling for status updates
        pollVideoStatus(response.data.job_id);
      } else {
        setVideoError("Failed to start video generation. Please try again.");
        setOpenSnackbar(true);
      }
    } catch (err) {
      console.error("Error:", err);
      let errorMessage = "Error generating video. Please try again.";

      if (err.response) {
        errorMessage = `Server error: ${
          err.response.data.detail || err.response.statusText
        }`;
      } else if (err.request) {
        errorMessage =
          "No response from server. Please check if the backend is running.";
      }

      setVideoError(errorMessage);
      setOpenSnackbar(true);
      setVideoLoading(false);
    }
  };

  const pollVideoStatus = async (jobId) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/video-status/${jobId}`
      );

      if (response.data.status === "completed") {
        setVideoStatus("completed");
        setVideoFrames(response.data.frames);
        setVideoLoading(false);
      } else if (response.data.status === "failed") {
        setVideoError(response.data.error || "Video generation failed");
        setOpenSnackbar(true);
        setVideoLoading(false);
      } else {
        // Still processing, update progress and continue polling
        setVideoStatus("processing");
        setTimeout(() => pollVideoStatus(jobId), 2000);
      }
    } catch (err) {
      console.error("Error polling video status:", err);
      setVideoError("Error checking video status. Please try again.");
      setOpenSnackbar(true);
      setVideoLoading(false);
    }
  };

  const handlePlayVideo = () => {
    if (videoFrames.length === 0) return;

    setIsPlaying(true);
    const interval = setInterval(() => {
      setCurrentFrameIndex((prevIndex) => {
        if (prevIndex >= videoFrames.length - 1) {
          clearInterval(interval);
          setIsPlaying(false);
          return 0;
        }
        return prevIndex + 1;
      });
    }, 100); // 10 fps

    setPlaybackInterval(interval);
  };

  const handlePauseVideo = () => {
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
    setIsPlaying(false);
  };

  const handleFrameChange = (event, newValue) => {
    setCurrentFrameIndex(newValue);
  };

  const handleDownloadVideo = () => {
    try {
      // In a real implementation, you would combine the frames into a video
      // For now, we'll just download the current frame
      if (videoFrames.length > 0 && currentFrameIndex < videoFrames.length) {
        const currentFrame = videoFrames[currentFrameIndex];
        handleDownloadImage(
          currentFrame.base64,
          currentFrameIndex,
          "video",
          videoStylePreset
        );
      }
    } catch (err) {
      console.error("Error downloading video frame:", err);
      setError("Error downloading video frame. Please try again.");
      setOpenSnackbar(true);
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (playbackInterval) {
        clearInterval(playbackInterval);
      }
    };
  }, [playbackInterval]);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI Image Generator
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Generate AI Images
          </Typography>

          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label="Image Generation" />
            <Tab label="Video Generation" />
          </Tabs>

          {activeTab === 0 && (
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Describe your image"
                variant="outlined"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="e.g., A minimalist mountain landscape with a sunset"
                multiline
                rows={3}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Platform</InputLabel>
                    <Select
                      value={platform}
                      label="Platform"
                      onChange={(e) => setPlatform(e.target.value)}
                    >
                      <MenuItem value="web">Web (1024×1024)</MenuItem>
                      <MenuItem value="mobile">Mobile (768×1024)</MenuItem>
                      <MenuItem value="desktop">Desktop (1024×768)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Style Preset</InputLabel>
                    <Select
                      value={stylePreset}
                      label="Style Preset"
                      onChange={(e) => setStylePreset(e.target.value)}
                    >
                      {stylePresets.map((preset) => (
                        <MenuItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Number of Images</InputLabel>
                    <Select
                      value={numImages}
                      label="Number of Images"
                      onChange={(e) => setNumImages(e.target.value)}
                    >
                      {[1, 2, 4, 6, 8, 10, 20, 30, 40, 50, 75, 100].map(
                        (num) => (
                          <MenuItem key={num} value={num}>
                            {num} {num === 1 ? "image" : "images"}
                          </MenuItem>
                        )
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || !prompt.trim()}
                sx={{ mb: 2 }}
              >
                {loading ? "Generating..." : "Generate Images"}
              </Button>
            </Box>
          )}

          {activeTab === 1 && (
            <Box component="form" onSubmit={handleVideoSubmit}>
              <TextField
                fullWidth
                label="Describe your video"
                variant="outlined"
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="e.g., A scene that transitions from day to night"
                multiline
                rows={3}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Duration (seconds)</Typography>
                  <Slider
                    value={videoDuration}
                    onChange={(e, newValue) => setVideoDuration(newValue)}
                    min={1}
                    max={10}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Selected duration: {videoDuration} seconds
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="video-style-select-label">
                      Art Style
                    </InputLabel>
                    <Select
                      labelId="video-style-select-label"
                      id="video-style-select"
                      value={videoStylePreset}
                      label="Art Style"
                      onChange={(e) => setVideoStylePreset(e.target.value)}
                    >
                      {stylePresets.map((preset) => (
                        <MenuItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Selected Style:{" "}
                  <strong>{getStylePresetLabel(videoStylePreset)}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {
                    stylePresets.find((p) => p.value === videoStylePreset)
                      ?.description
                  }
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={videoLoading || !videoPrompt}
                sx={{ minWidth: 200 }}
              >
                {videoLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Generate Video"
                )}
              </Button>
            </Box>
          )}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Generating your designs... This may take a minute.
            </Typography>
          </Box>
        )}

        {activeTab === 0 && images.length > 0 && (
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
            Generated Images
          </Typography>
        )}

        {activeTab === 0 && (
          <Grid container spacing={3}>
            {images.map((image, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardMedia
                    component="img"
                    height={image.platform === "mobile" ? 400 : 300}
                    image={`data:image/png;base64,${image.base64}`}
                    alt={`Generated design ${index + 1}`}
                    sx={{
                      objectFit:
                        image.platform === "mobile" ? "contain" : "cover",
                      backgroundColor: "#f5f5f5",
                    }}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Image {index + 1}
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                    >
                      <Chip
                        label={getPlatformLabel(image.platform)}
                        size="small"
                        color="primary"
                      />
                      <Chip
                        label={getStylePresetLabel(image.style_preset)}
                        size="small"
                        color="secondary"
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mt: 1 }}
                    >
                      Resolution: {image.width}×{image.height}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      startIcon={<DownloadIcon />}
                      onClick={() =>
                        handleDownloadImage(
                          image.base64,
                          index,
                          image.platform,
                          image.style_preset
                        )
                      }
                    >
                      Download Image
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 1 && videoStatus === "processing" && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Generating your video... This may take a few minutes.
            </Typography>
          </Box>
        )}

        {activeTab === 1 &&
          videoStatus === "completed" &&
          videoFrames.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" gutterBottom>
                Generated Video Preview
              </Typography>

              <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <CardMedia
                    component="img"
                    height={400}
                    image={`data:image/png;base64,${videoFrames[currentFrameIndex].base64}`}
                    alt={`Video frame ${currentFrameIndex + 1}`}
                    sx={{
                      objectFit: "contain",
                      backgroundColor: "#f5f5f5",
                      maxWidth: "100%",
                    }}
                  />
                </Box>

                <Box sx={{ px: 2, mb: 2 }}>
                  <Slider
                    value={currentFrameIndex}
                    onChange={handleFrameChange}
                    min={0}
                    max={videoFrames.length - 1}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={isPlaying ? handlePauseVideo : handlePlayVideo}
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadVideo}
                  >
                    Download Frame
                  </Button>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Frame {currentFrameIndex + 1} of {videoFrames.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Style: {getStylePresetLabel(videoStylePreset)}
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
      </Container>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error || videoError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={openSuccessSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSuccessSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSuccessSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;
