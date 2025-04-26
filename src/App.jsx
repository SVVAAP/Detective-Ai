import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // set backend to webgl
import Loader from "./components/loader";
import ButtonHandler from "./components/btn-handler";
import { detect, detectVideo } from "./utils/detect";
import "./style/App.css";

const App = () => {
  const [loading, setLoading] = useState({ loading: true, progress: 0 }); // loading state
  const [model, setModel] = useState({
    net: null,
    inputShape: [1, 0, 0, 3],
  }); // init model & input shape
  const [activeTab, setActiveTab] = useState("image"); // track active tab

  // references
  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // model configs
  const modelName = "yolov8n";

  // Inline styles
  const styles = {
    app: {
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      backgroundColor: "#f8f9fa",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    },
    header: {
      textAlign: "center",
      padding: "30px 0",
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      marginBottom: "30px"
    },
    title: {
      fontSize: "32px",
      color: "#1a1a2e",
      margin: "0 0 15px 0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px"
    },
    titleIcon: {
      fontSize: "36px"
    },
    subtitle: {
      fontSize: "18px",
      color: "#4b5563",
      margin: "0 0 10px 0"
    },
    codeSpan: {
      fontFamily: "monospace",
      backgroundColor: "#e2e8f0",
      padding: "3px 6px",
      borderRadius: "4px",
      fontSize: "14px"
    },
    modelInfo: {
      display: "inline-flex",
      alignItems: "center",
      background: "#f1f5f9",
      padding: "8px 16px",
      borderRadius: "20px",
      marginTop: "10px"
    },
    modelBadge: {
      background: "#22c55e",
      color: "white",
      fontSize: "12px",
      padding: "4px 8px",
      borderRadius: "12px",
      marginLeft: "8px",
      fontWeight: "bold"
    },
    tabContainer: {
      display: "flex",
      borderBottom: "1px solid #e5e7eb",
      marginBottom: "20px"
    },
    tab: {
      padding: "12px 24px",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer",
      border: "none",
      background: "none",
      color: "#6b7280",
      transition: "all 0.3s ease"
    },
    activeTab: {
      color: "#2563eb",
      borderBottom: "2px solid #2563eb"
    },
    content: {
      position: "relative",
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      marginBottom: "30px",
      height: "450px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden"
    },
    contentItem: {
      maxWidth: "100%",
      maxHeight: "100%",
      display: "none",
      objectFit: "contain"
    },
    activeContentItem: {
      display: "block"
    },
    canvas: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%"
    },
    featureSection: {
      padding: "30px 0",
      marginBottom: "30px"
    },
    sectionTitle: {
      fontSize: "24px",
      color: "#1a1a2e",
      textAlign: "center",
      marginBottom: "30px"
    },
    featureGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "20px"
    },
    featureCard: {
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      padding: "20px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease"
    },
    featureIcon: {
      fontSize: "32px",
      marginBottom: "15px"
    },
    featureTitle: {
      fontSize: "18px",
      color: "#1a1a2e",
      marginBottom: "10px"
    },
    featureDesc: {
      fontSize: "14px",
      color: "#4b5563"
    },
    footer: {
      marginTop: "auto",
      textAlign: "center",
      padding: "20px 0",
      borderTop: "1px solid #e5e7eb",
      color: "#6b7280"
    },
    loaderContainer: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000
    },
    progressContainer: {
      width: "300px",
      height: "8px",
      backgroundColor: "#e5e7eb",
      borderRadius: "4px",
      marginBottom: "16px",
      overflow: "hidden"
    },
    progressBar: {
      height: "100%",
      backgroundColor: "#2563eb",
      borderRadius: "4px",
      transition: "width 0.3s ease"
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "center",
      gap: "20px",
      marginBottom: "30px",
      flexWrap: "wrap"
    },
    button: {
      padding: "12px 24px",
      borderRadius: "8px",
      border: "none",
      color: "white",
      fontWeight: "500",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "16px",
      transition: "background-color 0.3s ease"
    },
    primaryButton: {
      backgroundColor: "#2563eb"
    },
    uploadInput: {
      display: "none"
    }
  };

  useEffect(() => {
    tf.ready().then(async () => {
      try {
        const yolov8 = await tf.loadGraphModel(
          `${window.location.href}/${modelName}_web_model/model.json`,
          {
            onProgress: (fractions) => {
              setLoading({ loading: true, progress: fractions }); // set loading fractions
            },
          }
        ); // load model

        // warming up model
        const dummyInput = tf.ones(yolov8.inputs[0].shape);
        const warmupResults = yolov8.execute(dummyInput);

        setLoading({ loading: false, progress: 1 });
        setModel({
          net: yolov8,
          inputShape: yolov8.inputs[0].shape,
        }); // set model & input shape

        tf.dispose([warmupResults, dummyInput]); // cleanup memory
      } catch (error) {
        console.error("Error loading model:", error);
        setLoading({ loading: false, progress: 0 });
      }
    });
  }, []);

  // Function to handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageRef.current.src = e.target.result;
      };
      reader.readAsDataURL(file);
      setActiveTab("image");
    }
  };

  // Function to handle camera activation
  const handleCameraStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      cameraRef.current.srcObject = stream;
      setActiveTab("camera");
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check your permissions.");
    }
  };

  // Function to handle video upload
  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      videoRef.current.src = url;
      setActiveTab("video");
    }
  };

  return (
    <div style={styles.app}>
      {loading.loading && (
        <div style={styles.loaderContainer}>
          <div style={styles.progressContainer}>
            <div 
              style={{
                ...styles.progressBar,
                width: `${loading.progress * 100}%`
              }}
            ></div>
          </div>
          <p>Loading model... {(loading.progress * 100).toFixed(1)}%</p>
        </div>
      )}
      
      <header style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titleIcon}>🔍</span>
          ObjectSense<span style={{color: "#4f46e5"}}>AI</span>
        </h1>
        <p style={styles.subtitle}>
          Enterprise-grade object detection powered by TensorFlow.js
        </p>
        <div style={styles.modelInfo}>
          <span>Model: </span>
          <span style={styles.codeSpan}>{modelName}</span>
          <span style={styles.modelBadge}>Active</span>
        </div>
      </header>

      <div style={styles.tabContainer}>
        <button 
          style={{
            ...styles.tab,
            ...(activeTab === 'image' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('image')}
        >
          Image Analysis
        </button>
        <button 
          style={{
            ...styles.tab,
            ...(activeTab === 'camera' ? styles.activeTab : {})
          }}
          onClick={() => handleCameraStart()}
        >
          Live Camera
        </button>
        <button 
          style={{
            ...styles.tab,
            ...(activeTab === 'video' ? styles.activeTab : {})
          }}
          onClick={() => document.getElementById('videoUpload').click()}
        >
          Video Processing
        </button>
      </div>

      <div style={styles.content}>
        <img
          src="#"
          alt="Detection result"
          ref={imageRef}
          onLoad={() => detect(imageRef.current, model, canvasRef.current)}
          style={{
            ...styles.contentItem,
            ...(activeTab === 'image' ? styles.activeContentItem : {})
          }}
        />
        <video
          autoPlay
          muted
          ref={cameraRef}
          onPlay={() => detectVideo(cameraRef.current, model, canvasRef.current)}
          style={{
            ...styles.contentItem,
            ...(activeTab === 'camera' ? styles.activeContentItem : {})
          }}
        />
        <video
          autoPlay
          muted
          ref={videoRef}
          onPlay={() => detectVideo(videoRef.current, model, canvasRef.current)}
          style={{
            ...styles.contentItem,
            ...(activeTab === 'video' ? styles.activeContentItem : {})
          }}
        />
        <canvas 
          width={model.inputShape[1]} 
          height={model.inputShape[2]} 
          ref={canvasRef}
          style={styles.canvas}
        />
      </div>

      <div style={styles.buttonContainer}>
        <input
          type="file"
          id="imageUpload"
          accept="image/*"
          onChange={handleImageUpload}
          style={styles.uploadInput}
        />
        <button 
          style={{...styles.button, ...styles.primaryButton}}
          onClick={() => document.getElementById('imageUpload').click()}
        >
          <span>📷</span> Upload Image
        </button>
        
        <input
          type="file"
          id="videoUpload"
          accept="video/*"
          onChange={handleVideoUpload}
          style={styles.uploadInput}
        />
        <button 
          style={{...styles.button, backgroundColor: "#10b981"}}
          onClick={() => document.getElementById('videoUpload').click()}
        >
          <span>🎬</span> Upload Video
        </button>
        
        <button 
          style={{...styles.button, backgroundColor: "#3b82f6"}}
          onClick={handleCameraStart}
        >
          <span>📹</span> Start Camera
        </button>
      </div>

      <div style={styles.featureSection}>
        <h2 style={styles.sectionTitle}>Advanced Features</h2>
        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⚡</div>
            <h3 style={styles.featureTitle}>Real-time Processing</h3>
            <p style={styles.featureDesc}>Detect objects in milliseconds with optimized inference technology.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🔒</div>
            <h3 style={styles.featureTitle}>Privacy-Focused</h3>
            <p style={styles.featureDesc}>All processing happens locally in your browser with no data sent to servers.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🎯</div>
            <h3 style={styles.featureTitle}>High Accuracy</h3>
            <p style={styles.featureDesc}>Powered by YOLOv8, a state-of-the-art object detection model.</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📱</div>
            <h3 style={styles.featureTitle}>Cross-Device Compatible</h3>
            <p style={styles.featureDesc}>Works seamlessly across desktop, tablet, and mobile devices.</p>
          </div>
        </div>
      </div>

      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} ObjectSenseAI. All rights reserved.</p>
        <p style={{margin: "10px 0"}}>Tech Stack: TensorFlow.js, YOLOv8, React</p>
        <p>Powered by <strong>Svvaap Innovations</strong> & <strong>21xEngineers</strong></p>
      </footer>
    </div>
  );
};

export default App;