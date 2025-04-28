import { useState, useRef, useEffect } from 'react';

const ImageSketchConverter = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('outline');
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  const sketchStyles = [
    'outline',
    'line-art',
    'pencil',
    'sketch',
    'needle-pen',
    'pen',
    'soft-pen',
    'comic',
    'retro'
  ];

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const img = e.target.files[0];
      setSelectedImage(URL.createObjectURL(img));
      setResultImage(null);
    }
  };

  const processImage = () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const hiddenCanvas = hiddenCanvasRef.current;
    const hiddenCtx = hiddenCanvas.getContext('2d');
    
    const img = new Image();
    img.onload = () => {
      // Calculate proportional dimensions
      let width = img.width;
      let height = img.height;
      const maxDimension = 800;
      
      if (width > height && width > maxDimension) {
        height = (height / width) * maxDimension;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width / height) * maxDimension;
        height = maxDimension;
      }
      
      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      hiddenCanvas.width = width;
      hiddenCanvas.height = height;
      
      // Draw original image on hidden canvas
      hiddenCtx.drawImage(img, 0, 0, width, height);
      
      // Apply the selected sketch effect
      applySketchEffect(hiddenCtx, ctx, width, height, selectedStyle);
      
      // Get processed image as URL
      setResultImage(canvas.toDataURL('image/png'));
      setIsProcessing(false);
    };
    
    img.src = selectedImage;
  };

  const applySketchEffect = (sourceCtx, destCtx, width, height, style) => {
    const imageData = sourceCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    switch (style) {
      case 'outline':
        // Basic edge detection
        const outlineData = detectEdges(data, width, height, 50);
        const outlineImageData = new ImageData(outlineData, width, height);
        destCtx.putImageData(outlineImageData, 0, 0);
        break;
        
      case 'line-art':
        // Line art with thinner lines
        const lineArtData = detectEdges(data, width, height, 30);
        const lineArtImageData = new ImageData(lineArtData, width, height);
        destCtx.putImageData(lineArtImageData, 0, 0);
        break;
        
      case 'pencil':
        // Pencil sketch effect
        convertToGrayscale(data);
        applyPencilTexture(data, width, height);
        destCtx.putImageData(imageData, 0, 0);
        break;
        
      case 'sketch':
        // More detailed sketch
        convertToGrayscale(data);
        invertColors(data);
        applyBlur(data, width, height, 1);
        destCtx.putImageData(imageData, 0, 0);
        destCtx.globalCompositeOperation = 'color-dodge';
        destCtx.fillStyle = '#ffffff';
        destCtx.fillRect(0, 0, width, height);
        destCtx.globalCompositeOperation = 'source-over';
        break;
        
      case 'needle-pen':
        // Fine line needle pen style
        const needleData = detectEdges(data, width, height, 20);
        invertColors(needleData);
        const needleImageData = new ImageData(needleData, width, height);
        destCtx.putImageData(needleImageData, 0, 0);
        break;
        
      case 'pen':
        // Bold pen strokes
        const penData = detectEdges(data, width, height, 40);
        thickenLines(penData, width, height);
        invertColors(penData);
        const penImageData = new ImageData(penData, width, height);
        destCtx.putImageData(penImageData, 0, 0);
        break;
        
      case 'soft-pen':
        // Soft pen effect
        convertToGrayscale(data);
        applyBlur(data, width, height, 2);
        contrastAdjust(data, 1.2);
        destCtx.putImageData(imageData, 0, 0);
        break;
        
      case 'comic':
        // Comic book style
        convertToGrayscale(data);
        posterize(data, 4);
        const comicData = detectEdges(data, width, height, 35);
        const comicImageData = new ImageData(comicData, width, height);
        destCtx.putImageData(comicImageData, 0, 0);
        break;
        
      case 'retro':
        // Retro halftone-like effect
        convertToGrayscale(data);
        posterize(data, 3);
        destCtx.putImageData(imageData, 0, 0);
        // Apply pattern overlay
        destCtx.globalCompositeOperation = 'multiply';
        destCtx.fillStyle = createDotPattern(destCtx);
        destCtx.fillRect(0, 0, width, height);
        destCtx.globalCompositeOperation = 'source-over';
        break;
        
      default:
        destCtx.putImageData(imageData, 0, 0);
    }
  };

  // Image processing helper functions
  const detectEdges = (data, width, height, threshold) => {
    const result = new Uint8ClampedArray(data.length);
    const grayscale = new Uint8ClampedArray(data.length);
    
    // Convert to grayscale first
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      grayscale[i] = grayscale[i + 1] = grayscale[i + 2] = avg;
      grayscale[i + 3] = data[i + 3];
    }
    
    // Apply Sobel operator for edge detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Calculate gradient
        const gx = 
          -1 * grayscale[((y-1) * width + (x-1)) * 4] +
          -2 * grayscale[((y) * width + (x-1)) * 4] +
          -1 * grayscale[((y+1) * width + (x-1)) * 4] +
          1 * grayscale[((y-1) * width + (x+1)) * 4] +
          2 * grayscale[((y) * width + (x+1)) * 4] +
          1 * grayscale[((y+1) * width + (x+1)) * 4];
          
        const gy = 
          -1 * grayscale[((y-1) * width + (x-1)) * 4] +
          -2 * grayscale[((y-1) * width + (x)) * 4] +
          -1 * grayscale[((y-1) * width + (x+1)) * 4] +
          1 * grayscale[((y+1) * width + (x-1)) * 4] +
          2 * grayscale[((y+1) * width + (x)) * 4] +
          1 * grayscale[((y+1) * width + (x+1)) * 4];
          
        const g = Math.sqrt(gx * gx + gy * gy);
        
        if (g > threshold) {
          result[idx] = result[idx + 1] = result[idx + 2] = 0; // Black edge
        } else {
          result[idx] = result[idx + 1] = result[idx + 2] = 255; // White background
        }
        result[idx + 3] = 255; // Full alpha
      }
    }
    
    return result;
  };

  const convertToGrayscale = (data) => {
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = data[i + 1] = data[i + 2] = avg;
    }
  };

  const invertColors = (data) => {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  };

  const applyBlur = (data, width, height, radius) => {
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    // Simple box blur
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = (y * width + x) * 4;
        
        let r = 0, g = 0, b = 0;
        let count = 0;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const kidx = ((y + ky) * width + (x + kx)) * 4;
            r += tempData[kidx];
            g += tempData[kidx + 1];
            b += tempData[kidx + 2];
            count++;
          }
        }
        
        data[idx] = r / count;
        data[idx + 1] = g / count;
        data[idx + 2] = b / count;
      }
    }
  };

  const applyPencilTexture = (data, width, height) => {
    // Add some noise for pencil texture
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 200) { // Only apply to darker areas
        const noise = Math.random() * 30 - 15;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
    }
  };

  const thickenLines = (data, width, height) => {
    const tempData = new Uint8ClampedArray(data.length);
    
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // If any neighboring pixel is black, make this pixel black too
        if (
          tempData[idx] === 0 || 
          tempData[idx - 4] === 0 || 
          tempData[idx + 4] === 0 || 
          tempData[(y - 1) * width * 4 + x * 4] === 0 || 
          tempData[(y + 1) * width * 4 + x * 4] === 0
        ) {
          data[idx] = data[idx + 1] = data[idx + 2] = 0;
        }
      }
    }
  };

  const contrastAdjust = (data, factor) => {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.max(0, Math.min(255, ((data[i] - 128) * factor) + 128));
      data[i + 1] = Math.max(0, Math.min(255, ((data[i + 1] - 128) * factor) + 128));
      data[i + 2] = Math.max(0, Math.min(255, ((data[i + 2] - 128) * factor) + 128));
    }
  };

  const posterize = (data, levels) => {
    const step = 255 / (levels - 1);
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / step) * step;
      data[i + 1] = Math.round(data[i + 1] / step) * step;
      data[i + 2] = Math.round(data[i + 2] / step) * step;
    }
  };

  const createDotPattern = (ctx) => {
    // Create a pattern of dots for retro effect
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    patternCanvas.width = 6;
    patternCanvas.height = 6;
    
    patternCtx.fillStyle = "rgba(0, 0, 0, 0.1)";
    patternCtx.fillRect(0, 0, 6, 6);
    
    patternCtx.fillStyle = "rgba(255, 255, 255, 0.6)";
    patternCtx.beginPath();
    patternCtx.arc(3, 3, 1, 0, Math.PI * 2);
    patternCtx.fill();
    
    return ctx.createPattern(patternCanvas, 'repeat');
  };

  const downloadImage = () => {
    if (!resultImage) return;
    
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `sketch-${selectedStyle}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (selectedImage) {
      processImage();
    }
  }, [selectedImage, selectedStyle]);

  const containerStyle = {
    maxWidth: '1024px',
    margin: '0 auto',
    padding: '16px'
  };

  const headingStyle = {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    marginBottom: '24px',
    textAlign: 'center'
  };

  const uploadAreaStyle = {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#f9fafb',
    marginBottom: '24px',
    transition: 'background-color 0.2s'
  };

  const uploadIconStyle = {
    width: '48px',
    height: '48px',
    color: '#9ca3af',
    marginBottom: '12px',
    margin: '0 auto'
  };

  const uploadTextStyle = {
    fontSize: '0.875rem',
    color: '#6b7280'
  };

  const sectionStyle = {
    marginBottom: '24px'
  };

  const labelStyle = {
    display: 'block',
    color: '#374151',
    fontWeight: '500',
    marginBottom: '8px'
  };

  const styleButtonsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  };

  const styleButtonStyle = (style) => ({
    padding: '8px 16px',
    fontSize: '0.875rem',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: selectedStyle === style ? '#2563eb' : '#e5e7eb',
    color: selectedStyle === style ? 'white' : '#1f2937',
    border: 'none',
    transition: 'background-color 0.2s'
  });

  const gridContainerStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '24px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  };

  const cardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  };

  const cardTitleStyle = {
    fontSize: '1.125rem',
    fontWeight: '500'
  };

  const downloadButtonStyle = {
    backgroundColor: '#16a34a',
    color: 'white',
    padding: '4px 16px',
    borderRadius: '4px',
    fontSize: '0.875rem',
    border: 'none',
    cursor: 'pointer'
  };

  const imageStyle = {
    width: '100%',
    borderRadius: '4px'
  };

  const loadingStyle = {
    textAlign: 'center',
    padding: '24px'
  };

  const spinnerStyle = {
    display: 'inline-block',
    width: '32px',
    height: '32px',
    border: '2px solid rgba(59, 130, 246, 0.2)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const hiddenStyle = {
    display: 'none'
  };

  // Media query styles (applied via JS since we're using inline styles)
  const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);
  
    useEffect(() => {
      const media = window.matchMedia(query);
      const listener = () => setMatches(media.matches);
      
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }, [query]);
  
    return matches;
  };

  // Apply responsive styles
  const isTabletOrLarger = useMediaQuery('(min-width: 768px)');
  
  if (isTabletOrLarger) {
    gridContainerStyle.gridTemplateColumns = '1fr 1fr';
    styleButtonsContainerStyle.gridTemplateColumns = 'repeat(5, 1fr)';
  }

  return (
    <div style={containerStyle}>
      <h1 style={headingStyle}>Image to Sketch Converter</h1>
      
      <div style={sectionStyle}>
        <div 
          style={uploadAreaStyle} 
          onClick={() => document.getElementById('imageInput').click()}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        >
          <input
            type="file"
            id="imageInput"
            accept="image/*"
            style={hiddenStyle}
            onChange={handleImageChange}
          />
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <svg style={uploadIconStyle} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p style={uploadTextStyle}>Click to select or drag an image here</p>
          </div>
        </div>
      </div>
      
      <div style={sectionStyle}>
        <label style={labelStyle}>Select Sketch Style:</label>
        <div style={styleButtonsContainerStyle}>
          {sketchStyles.map((style) => (
            <button
              key={style}
              style={styleButtonStyle(style)}
              onClick={() => setSelectedStyle(style)}
              onMouseOver={(e) => {
                if (selectedStyle !== style) {
                  e.currentTarget.style.backgroundColor = '#d1d5db';
                }
              }}
              onMouseOut={(e) => {
                if (selectedStyle !== style) {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
            >
              {style.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>
      
      <div style={gridContainerStyle}>
        {selectedImage && (
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Original Image</h2>
            <img src={selectedImage} alt="Original" style={imageStyle} />
          </div>
        )}
        
        {resultImage && (
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h2 style={cardTitleStyle}>{selectedStyle.replace('-', ' ')} Style</h2>
              <button 
                style={downloadButtonStyle}
                onClick={downloadImage}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
              >
                Download
              </button>
            </div>
            <img src={resultImage} alt="Sketch" style={imageStyle} />
          </div>
        )}
      </div>
      
      {isProcessing && (
        <div style={loadingStyle}>
          <div style={{...spinnerStyle, animation: 'spin 1s linear infinite'}}></div>
          <p style={{marginTop: '8px', color: '#4b5563'}}>Processing image...</p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
      
      {/* Hidden canvases used for processing */}
      <canvas ref={canvasRef} style={hiddenStyle}></canvas>
      <canvas ref={hiddenCanvasRef} style={hiddenStyle}></canvas>
    </div>
  );
};

export default ImageSketchConverter;