const tf = require('@tensorflow/tfjs-node'); // Memasukkan TensorFlow.js untuk Node.js
const path = require('path');
const { Storage } = require('@google-cloud/storage'); // Library untuk mengakses Google Cloud Storage

// Tentukan path untuk bucket dan model yang disimpan di Cloud Storage
const bucketName = 'my-cancer-models'; // Ganti dengan nama bucket Anda
const modelPath = 'my-cancer-models/submissions-model'; // Ganti dengan path model di Cloud Storage

// Inisialisasi Google Cloud Storage
const storage = new Storage();
const bucket = storage.bucket(my-cancer-models);

// Variabel untuk menyimpan model TensorFlow
let model = null;

// Fungsi untuk memuat model
async function loadModel() {
  try {
    // Ambil model dari Cloud Storage
    const file = bucket.file(modelPath);
    const tempLocalPath = path.join('/tmp', 'model.json');
    
    // Periksa apakah file sudah ada, jika belum unduh
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('Model tidak ditemukan di Cloud Storage!');
    }
    
    // Unduh model ke direktori sementara
    await file.download({ destination: tempLocalPath });

    // Muat model dari file yang telah diunduh
    model = await tf.loadLayersModel(`file://${tempLocalPath}`);
    console.log('Model berhasil dimuat');
  } catch (error) {
    console.error('Gagal memuat model:', error);
    throw error; // Lempar error agar bisa ditangani di bagian lain
  }
}

// Fungsi untuk melakukan prediksi
async function predict(imageBuffer) {
  if (!model) {
    console.error('Model belum dimuat!');
    return { status: 'fail', message: 'Model tidak ditemukan' };
  }

  try {
    // Pra-proses gambar (ubah ukuran dan normalisasi)
    const imageTensor = tf.node.decodeImage(imageBuffer, 3); // 3 untuk RGB
    const resizedImage = tf.image.resizeBilinear(imageTensor, [224, 224]); // Ubah ukuran gambar
    const normalizedImage = resizedImage.div(tf.scalar(255.0)); // Normalisasi gambar

    // Lakukan prediksi
    const prediction = model.predict(normalizedImage.expandDims(0)); // Memasukkan gambar ke dalam model
    const result = prediction.dataSync()[0]; // Ambil hasil prediksi

    // Tentukan hasil prediksi (Cancer atau Non-cancer)
    const resultClass = result > 0.5 ? 'Cancer' : 'Non-cancer';
    const suggestion = result > 0.5 ? 'Segera periksa ke dokter!' : 'Penyakit kanker tidak terdeteksi.';

    return {
      status: 'success',
      message: 'Model is predicted successfully',
      data: {
        id: generateUniqueId(), // ID unik untuk hasil prediksi
        result: resultClass,
        suggestion: suggestion,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Gagal melakukan prediksi:', error);
    return { status: 'fail', message: 'Terjadi kesalahan dalam melakukan prediksi' };
  }
}

// Fungsi untuk menghasilkan ID unik (misalnya menggunakan UUID atau sejenisnya)
function generateUniqueId() {
  return 'xxxx-xxxx-xxxx'.replace(/[x]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    return r.toString(16);
  });
}

// Export fungsi-fungsi agar bisa digunakan di server.js
module.exports = {
  loadModel,
  predict,
};
