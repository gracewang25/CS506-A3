# kmeans.py
import numpy as np

class KMeansClustering:
    def __init__(self, k, init_method='random', manual_centroids=None):
        self.k = k
        self.init_method = init_method
        self.manual_centroids = manual_centroids
        self.centroids = None
        self.history = []

    def initialize_centroids(self, X):
        if self.init_method == 'random':
            indices = np.random.choice(range(len(X)), self.k, replace=False)
            self.centroids = X[indices]
        elif self.init_method == 'farthest_first':
            self.centroids = self.farthest_first_initialization(X)
        elif self.init_method == 'kmeans++':
            self.centroids = self.kmeans_plus_plus_initialization(X)
        elif self.init_method == 'manual':
            self.centroids = np.array(self.manual_centroids)
        else:
            raise ValueError("Unknown initialization method.")

    def qfarthest_first_initialization(self, X):
        centroids = [X[np.random.randint(len(X))]]
        for _ in range(1, self.k):
            distances = np.array([min([np.linalg.norm(x - c) for c in centroids]) for x in X])
            next_centroid = X[np.argmax(distances)]
            centroids.append(next_centroid)
        return np.array(centroids)

    def kmeans_plus_plus_initialization(self, X):
        centroids = [X[np.random.randint(len(X))]]
        for _ in range(1, self.k):
            distances = np.array([min([np.linalg.norm(x - c)**2 for c in centroids]) for x in X])
            probabilities = distances / distances.sum()
            cumulative_probabilities = probabilities.cumsum()
            r = np.random.rand()
            for idx, cumulative_probability in enumerate(cumulative_probabilities):
                if r < cumulative_probability:
                    centroids.append(X[idx])
                    break
        return np.array(centroids)

    def fit(self, X):
        self.initialize_centroids(X)
        for iteration in range(100): 
            labels = self.assign_clusters(X)
            new_centroids = np.array([
                X[labels == i].mean(axis=0) if len(X[labels == i]) > 0 else self.centroids[i]
                for i in range(self.k)
            ])
            if np.allclose(self.centroids, new_centroids):
                self.centroids = new_centroids
                self.history.append({
                    'centroids': self.centroids.tolist(),
                    'labels': labels.tolist()
                })
                break
            self.centroids = new_centroids
            self.history.append({
                'centroids': self.centroids.tolist(),
                'labels': labels.tolist()
            })
        return self.history

    def assign_clusters(self, X):
        distances = np.array([np.linalg.norm(X - centroid, axis=1) for centroid in self.centroids])
        labels = distances.argmin(axis=0)
        return labels