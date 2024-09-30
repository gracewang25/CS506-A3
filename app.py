from flask import Flask, render_template, request, jsonify
from kmeans import KMeansClustering
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate_dataset', methods=['POST'])
def generate_dataset():
    num_points = int(request.form.get('num_points', 100))
    dataset = np.random.rand(num_points, 2).tolist()
    return jsonify({'dataset': dataset})

@app.route('/cluster', methods=['POST'])
def cluster():
    data = request.json
    dataset = np.array(data['dataset'])
    init_method = data['init_method']
    num_clusters = int(data['num_clusters'])
    manual_centroids = data.get('manual_centroids', None)
    kmeans = KMeansClustering(num_clusters, init_method, manual_centroids)
    steps = kmeans.fit(dataset)
    return jsonify({'steps': steps})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)