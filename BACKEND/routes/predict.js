const tf = require('@tensorflow/tfjs-node');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const uuid = require('uuid');
const { firestore, storageBucket } = require('../config/config');
const admin = require('firebase-admin');

// Initialize Google Cloud Storage
const storage = new Storage();
const bucket = storage.bucket(storageBucket);

// Initialize Firestore
const db = admin.firestore();

let model;

// Load model from Cloud Storage
const loadModel = async () => {
  if (!model) {
    const modelPath = `gs://${storageBucket}/model/model.json`;
    model = await tf.loadLayersModel(modelPath);
    console.log('Model loaded successfully!');
  }
};

// Predict the uploaded image
const predictImage = async (req, res) => {
  try {
    // Load the model once
    await loadModel();

    // Get image from the request
    const imagePath = path.join(__dirname, '../uploads', uuid.v4() + path.extname(req.file.originalname));
    
    // Upload the image to the temporary location
    await fs.promises.rename(req.file.path, imagePath);

    // Preprocess the image (resize and normalize)
    const imageBuffer = await fs.promises.readFile(imagePath);
    const imageTensor = tf.node.decodeImage(imageBuffer);
    const resizedImage = tf.image.resizeBilinear(imageTensor, [224, 224]);
    const normalizedImage = resizedImage.div(tf.scalar(255));

    // Make prediction
    const prediction = model.predict(normalizedImage.expandDims(0));
    const result = prediction.dataSync()[0] > 0.5 ? 'Cancer' : 'Non-cancer';
    const suggestion = result === 'Cancer' ? 'Segera periksa ke dokter!' : 'Penyakit kanker tidak terdeteksi.';

    // Save to Firestore
    const predictionId = uuid.v4();
    await db.collection('predictions').doc(predictionId).set({
      id: predictionId,
      result,
      suggestion,
      createdAt: new Date().toISOString()
    });

    // Respond with prediction
    res.json({
      status: 'success',
      message: 'Model is predicted successfully',
      data: {
        id: predictionId,
        result,
        suggestion,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error during prediction:', error);
    res.status(400).json({
      status: 'fail',
      message: 'Terjadi kesalahan dalam melakukan prediksi'
    });
  }
};

module.exports = { predictImage };
