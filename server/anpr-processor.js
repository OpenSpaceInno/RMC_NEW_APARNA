// ANPR Processing Module
// This module handles automatic license plate recognition from camera frames

import axios from 'axios';
import FormData from 'form-data';

class ANPRProcessor {
  constructor() {
    // Configuration for ANPR service
    this.config = {
      // Option 1: Local OpenALPR (if installed)
      localEnabled: false,
      localUrl: 'http://localhost:8080',
      
      // Option 2: Cloud ANPR API (PlateRecognizer.com - Free tier: 2500/month)
      cloudEnabled: true,
      cloudUrl: 'https://api.platerecognizer.com/v1/plate-reader/',
      apiKey: process.env.PLATERECOGNIZER_API_KEY || '', // Get free key from platerecognizer.com
      
      // Option 3: Mock mode for testing
      mockEnabled: !process.env.PLATERECOGNIZER_API_KEY,
      
      // Detection settings
      minConfidence: 0.7,
      region: 'in', // India - change to your region (us, eu, etc.)
    };
  }

  /**
   * Process image and detect license plates
   * @param {Buffer|string} imageData - Image buffer or base64 string
   * @param {string} cameraId - Camera identifier
   * @returns {Promise<Object>} Detection result
   */
  async detectPlate(imageData, cameraId) {
    try {
      if (this.config.mockEnabled) {
        return this.mockDetection(cameraId);
      }

      if (this.config.cloudEnabled && this.config.apiKey) {
        return await this.cloudDetection(imageData);
      }

      if (this.config.localEnabled) {
        return await this.localDetection(imageData);
      }

      throw new Error('No ANPR service configured');
    } catch (error) {
      console.error('ANPR detection error:', error.message);
      return {
        success: false,
        error: error.message,
        plates: [],
      };
    }
  }

  /**
   * Cloud-based detection using PlateRecognizer API
   */
  async cloudDetection(imageData) {
    const formData = new FormData();
    
    // Handle different image input types
    if (Buffer.isBuffer(imageData)) {
      formData.append('upload', imageData, { filename: 'frame.jpg' });
    } else if (typeof imageData === 'string') {
      // Base64 or URL
      if (imageData.startsWith('http')) {
        formData.append('upload', imageData);
      } else {
        const buffer = Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ''), 'base64');
        formData.append('upload', buffer, { filename: 'frame.jpg' });
      }
    }

    formData.append('regions', this.config.region);

    const response = await axios.post(this.config.cloudUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Token ${this.config.apiKey}`,
      },
      timeout: 10000,
    });

    const results = response.data.results || [];
    
    return {
      success: true,
      plates: results
        .filter(r => r.score >= this.config.minConfidence)
        .map(r => ({
          plate: r.plate.toUpperCase(),
          confidence: r.score,
          region: r.region?.code || this.config.region,
          bbox: r.box,
          vehicle: r.vehicle,
        })),
      processingTime: response.data.processing_time,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Local detection using OpenALPR
   */
  async localDetection(imageData) {
    // Implement OpenALPR local processing
    // This requires OpenALPR to be installed locally
    const response = await axios.post(`${this.config.localUrl}/recognize`, {
      image: imageData.toString('base64'),
      regions: [this.config.region],
    }, {
      timeout: 10000,
    });

    const results = response.data.results || [];
    
    return {
      success: true,
      plates: results
        .filter(r => r.confidence >= this.config.minConfidence * 100)
        .map(r => ({
          plate: r.plate.toUpperCase(),
          confidence: r.confidence / 100,
          region: r.region,
          bbox: r.coordinates,
        })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Lane-calibrated detection for testing without external API
   */
  mockDetection(cameraId) {
    return {
      success: false,
      plates: [],
      message: 'No plate recognized in image.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Extract frame from RTSP stream
   * @param {string} rtspUrl - RTSP stream URL
   * @returns {Promise<Buffer>} Image buffer
   */
  async captureFrame(rtspUrl) {
    // This would use ffmpeg to capture a frame from RTSP stream
    // For now, return null to indicate frame capture is not implemented
    // In production, use: ffmpeg -i rtsp://... -vframes 1 -f image2pipe -
    throw new Error('Frame capture not implemented - use webhook from camera');
  }

  /**
   * Validate Indian license plate format
   */
  validateIndianPlate(plate) {
    // Indian format: XX00XX0000 or XX00X0000
    // Examples: KA05AB1234, MH02C5678
    const patterns = [
      /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/,  // Standard format
      /^[A-Z]{2}\d{2}[A-Z]{3}\d{4}$/,    // New format (BH series)
    ];

    return patterns.some(pattern => pattern.test(plate));
  }

  /**
   * Format plate number to standard format
   */
  formatPlate(plate) {
    return plate
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Remove special characters
      .trim();
  }
}

export default new ANPRProcessor();
