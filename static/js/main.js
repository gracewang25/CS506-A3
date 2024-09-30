// static/js/main.js
let dataset = [];
let steps = [];
let currentStep = 0;
let initMethod = 'random';
let numClusters = 3;
let manualCentroids = [];
const colors = [
    '#1f77b4', // muted blue
    '#ff7f0e', // safety orange
    '#2ca02c', // cooked asparagus green
    '#d62728', // brick red
    '#9467bd', // muted purple
    '#8c564b', // chestnut brown
    '#e377c2', // raspberry yogurt pink
    '#7f7f7f', // middle gray
    '#bcbd22', // curry yellow-green
    '#17becf'  // blue-teal
];

document.getElementById('init_method').addEventListener('change', (e) => {
    initMethod = e.target.value;
    if (initMethod === 'manual') {
        alert('Click on the plot to select centroids.');
    }
});

document.getElementById('num_clusters').addEventListener('change', (e) => {
    numClusters = parseInt(e.target.value);
    if (isNaN(numClusters) || numClusters < 1) {
        alert('Please enter a valid number of clusters (minimum 1).');
        numClusters = 1;
        e.target.value = 1;
    }
    steps = [];
    currentStep = 0;
    isClusteringStarted = false;
    manualCentroids = [];
    if (initMethod === 'manual') {
        alert('Number of clusters changed. Please re-select centroids.');
    }
    plotData(dataset);
});

document.getElementById('generate_dataset').addEventListener('click', () => {
    fetch('/generate_dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'num_points=100'
    })
    .then(response => response.json())
    .then(data => {
        dataset = data.dataset;
        plotData(dataset);
    });
});

document.getElementById('step').addEventListener('click', () => {
    if (steps.length === 0) {
        startClustering();
    } else if (currentStep < steps.length) {
        plotClusters(steps[currentStep]);
        currentStep++;
    } else {
        alert('Algorithm has converged.');
    }
});

document.getElementById('run').addEventListener('click', () => {
    if (steps.length === 0) {
        startClustering(runToEnd=true);
    } else {
        plotClusters(steps[steps.length - 1]);
        currentStep = steps.length;
    }
});

document.getElementById('reset').addEventListener('click', () => {
    steps = [];
    currentStep = 0;
    manualCentroids = [];
    plotData(dataset);
});

function startClustering(runToEnd=false) {
    let data = {
        'dataset': dataset,
        'init_method': initMethod,
        'num_clusters': numClusters
    };
    if (initMethod === 'manual') {
        data['manual_centroids'] = manualCentroids;
    }
    fetch('/cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        steps = result.steps;
        currentStep = 0;
        if (runToEnd) {
            plotClusters(steps[steps.length - 1]);
            currentStep = steps.length;
        } else {
            plotClusters(steps[currentStep]);
            currentStep++;
        }
    });
}

function plotData(dataPoints) {
    let trace = {
        x: dataPoints.map(point => point[0]),
        y: dataPoints.map(point => point[1]),
        mode: 'markers',
        type: 'scatter',
        marker: { color: 'blue' }
    };
    let layout = {
        title: 'Dataset',
        clickmode: 'event+select'
    };
    Plotly.newPlot('plot', [trace], layout);
    if (initMethod === 'manual') {
        document.getElementById('plot').on('plotly_click', function(data){
            if (manualCentroids.length < numClusters) {
                let x = data.points[0].x;
                let y = data.points[0].y;
                manualCentroids.push([x, y]);
                plotManualCentroids();
                if (manualCentroids.length === numClusters) {
                    alert('Centroids selected. You can now run the algorithm.');
                }
            }
        });
    } else {
        document.getElementById('plot').removeAllListeners('plotly_click');
    }
}

function plotManualCentroids() {
    let centroidTrace = {
        x: manualCentroids.map(point => point[0]),
        y: manualCentroids.map(point => point[1]),
        mode: 'markers',
        type: 'scatter',
        marker: { color: 'red', symbol: 'x', size: 12 }
    };
    Plotly.addTraces('plot', centroidTrace);
}

function plotClusters(stepData) {
    let centroids = stepData.centroids;
    let labels = stepData.labels;
    let clusters = [];

    for (let i = 0; i < numClusters; i++) {
        clusters.push({
            x: [],
            y: [],
            mode: 'markers',
            type: 'scatter',
            name: `Cluster ${i + 1}`,
            marker: { color: colors[i % colors.length], size: 6 }
        });
    }

    dataset.forEach((point, index) => {
        const clusterIndex = labels[index];
        clusters[clusterIndex].x.push(point[0]);
        clusters[clusterIndex].y.push(point[1]);
    });

    let centroidTrace = {
        x: centroids.map(point => point[0]),
        y: centroids.map(point => point[1]),
        mode: 'markers',
        type: 'scatter',
        marker: { color: 'black', symbol: 'x', size: 12 },
        name: 'Centroids'
    };

    let data = clusters.concat([centroidTrace]);

    let layout = {
        title: `KMeans Clustering - Step ${currentStep}`,
        autosize: true,
        xaxis: { zeroline: false },
        yaxis: { zeroline: false },
        margin: { t: 50, l: 50, r: 50, b: 50 }
    };

    Plotly.newPlot('plot', data, layout, { responsive: true });
}