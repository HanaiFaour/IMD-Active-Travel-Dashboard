var map = L.map('map').setView([51.805, -1.29], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var polygonLayer;

function getColor(index_of_1) {
  var colorScale = chroma.scale(['#084081', '#b5d4e9']).domain([1, 10]).mode('lch');
  return colorScale(index_of_1).hex();
}

function styleFeature(feature) {
  var index_of_1 = feature.properties.Index_of_1;
  return {
    fillColor: getColor(index_of_1),
    weight: 1,
    opacity: 1,
    color: 'white',
    fillOpacity: 0.7
  };
}

function updateFeatureDataPanel(feature) {
  var featureDataDiv = document.getElementById('feature-data');
  var content = '';

  for (var prop in feature.properties) {
    content += '<strong>' + prop + ':</strong> ' + feature.properties[prop] + '<br>';
  }

  featureDataDiv.innerHTML = content;
}

// Global variable to keep track of the previously clicked feature
var previouslyClickedFeature = null;
var previouslyClickedLayer = null;
function onEachFeature(feature, layer) {
  layer.on({
    click: function (e) {
      if (previouslyClickedLayer) {
        polygonLayer.resetStyle(previouslyClickedLayer);
      }
      var sindex_of_1 = feature.properties.Index_of_1;
      var snormalized = feature.properties.Normalized;
      var snormalize2 = feature.properties.Normaliz_1;
      console.log('Feature Data:', feature.properties);
      updateFeatureDataPanel(feature);
      highlightPointInScatter(sindex_of_1, snormalized);
      highlightPointInScatter2(sindex_of_1, snormalize2);

      // Create a column chart
      createColumnChart(feature);
      createColumnChart2(feature);

      // Change the style for the clicked layer (transparent red)
      layer.setStyle({
        fillColor: 'red',
        fillOpacity: 0.5
      });

      // Update the previously clicked layer
      previouslyClickedLayer = layer;

    },
    mouseover: function (e) {
      if (previouslyClickedLayer !== layer) {
        // Change the style for hover (transparent red)
        layer.setStyle({
          weight: 5,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.7
        });
      }
    },
    mouseout: function (e) {
      if (previouslyClickedLayer !== layer) {
        // Reset style on mouseout
        polygonLayer.resetStyle(layer);
      }
    }
  });
}



function handleShapefileUpload(event) {
  var file = event.target.files[0];
  if (file) {
    var reader = new FileReader();

    reader.onload = function(e) {
      var arrayBuffer = e.target.result;
      shp(arrayBuffer).then(function(data) {
        if (polygonLayer) {
          map.removeLayer(polygonLayer);
        }

        // Create a GeoJSON layer and assign the shapefile data to it
        polygonLayer = L.geoJSON(data, {
          style: styleFeature,
          onEachFeature: onEachFeature
        });

        // Access the features
        var features = polygonLayer.toGeoJSON().features;

        // Extract the relevant attributes for the correlation calculation
        var attributes = ['Index_of_1', 'F2011_Male', 'F2011_Ma_1', 'F2011_Fema', 'F2011_Fe_1'];
        var attributeLabels = {
          'Index_of_1': 'IMD',
          'F2011_Male': 'M. Bicycle',
          'F2011_Ma_1': 'M. On Foot',
          'F2011_Fema': 'F. Bicycle',
          'F2011_Fe_1': 'F. On Foot'
        };
        // Update x-axis and y-axis labels based on the defined attribute labels
        var xLabels = attributes.map(attr => attributeLabels[attr]);
        var yLabels = attributes.map(attr => attributeLabels[attr]);

        var attributes2 = ['Index_of_1','Normalized','Normaliz_1'];

        // Initialize an empty array to hold the attribute values for each feature
        var values = attributes.map(attr => []);
        var values2 = attributes2.map(attr => []);

        // Iterate through the features and extract the values for each attribute
        features.forEach(function(feature) {
          var properties = feature.properties;
          attributes.forEach(function(attr, index) {
            values[index].push(properties[attr]);
          });
        });

        features.forEach(function(feature) {
          var properties = feature.properties;
          attributes2.forEach(function(attr, index) {
            values2[index].push(properties[attr]);
          });
        });

        // Calculate correlations
        var correlations = [];
        for (var i = 0; i < values.length; i++) {
          correlations.push([]);
          for (var j = 0; j < values.length; j++) {
            correlations[i].push(
              pearsonCorrelation(values[i], values[j]).toFixed(2)
            );
          }
        }

        // Create a Plotly plot for the heatmap
        var heatmapLayout = {
          title: {text: 'Correlation Coefficient Heatmap',
          font: {size: 14}
        },
          xaxis: { title: '', tickvals: [...Array(attributes.length).keys()], ticktext: xLabels },
          yaxis: { title: '', tickvals: [...Array(attributes.length).keys()], ticktext: yLabels }
        };


        // Customize the heatmap
        var heatmapData = {
          z: correlations,
          x: attributes.map(attr => {
            switch (attr) {
              case 'Index_of_1':
              return 'IMD';
              case 'F2011_Male':
              return 'M. Bicycle';
              case 'F2011_Ma_1':
              return 'M. On Foot';
              case 'F2011_Fema':
              return 'F. Bicycle';
              case 'F2011_Fe_1':
              return 'F. On Foot';
              default:
              return attr;
            }
          }),
          y: attributes.map(attr => {
            switch (attr) {
              case 'Index_of_1':
              return 'IMD';
              case 'F2011_Male':
              return 'M. Bicycle';
              case 'F2011_Ma_1':
              return 'M. On Foot';
              case 'F2011_Fema':
              return 'F. Bicycle';
              case 'F2011_Fe_1':
              return 'F. On Foot'
              default:
              return attr;
            }
          }),
          type: 'heatmap',
          colorscale: [
            [0, 'rgba(0, 0, 255, 1.0)'],
            [0.5, 'rgba(255, 255, 255, 1.0)'],
            [1, 'rgba(255, 0, 0, 1.0)']
          ],
          zmin: -1,
          zmax: 1
        };

        // Create the heatmap plot using Plotly
        Plotly.newPlot('heatmapContainer', [heatmapData], heatmapLayout);

        //extract the scatter values for cycling:
        var normalized_values = values2[1];
        var index_of_1_values = values2[0];
        var normalized_values2 = values2[2];

        // Generate scatter plot data
        var scatterData = generateScatterData(normalized_values, index_of_1_values);
        var scatterData2 = generateScatterData2(normalized_values2, index_of_1_values);



        // Recreate the scatter plot
        recreateScatterPlot('scatterContainer', scatterData);
        recreateScatterPlot2('scatterContainer2', scatterData2);

        // Add the GeoJSON layer to the map
        polygonLayer.addTo(map);

        map.fitBounds(polygonLayer.getBounds());

        createLegend();
      });
    };

    reader.readAsArrayBuffer(file);
  }
}

function generateScatterData(xValues, yValues) {
  return [{
    x: xValues,
    y: yValues,
    mode: 'markers',
    type: 'scatter',
    marker: {
      color: 'rgba(0, 0, 235, 0.5)',
      size: 10
    }
  }];
}

function generateScatterData2(xValues, yValues) {
  return [{
    x: xValues,
    y: yValues,
    mode: 'markers',
    type: 'scatter',
    marker: {
      color: 'rgba(0, 0, 235, 0.5)',
      size: 10
    }
  }];
}

function recreateScatterPlot(containerId, data) {
  // scatter layout
  var scatter1layout = {
    title: {text:'IMD vs 2011 Male/Female Cycling Pattern',
    font: {size: 14}
  },
    xaxis: {title: '2011 Cycling Pattern'},
    yaxis: {title: 'IMD'},
  };
  Plotly.newPlot(containerId, data, scatter1layout);
}

function recreateScatterPlot2(containerId, data) {
  // scatter layout
  var scatter1layout = {
    title: {text: 'IMD vs 2011 Male/Female Walking Pattern',
    font: {size: 14}
  },
    xaxis: {title: '2011 Walking Pattern'},
    yaxis: {title: 'IMD'},
  };
  Plotly.newPlot(containerId, data, scatter1layout);
}

function highlightPointInScatter(sindex_of_1, snormalized) {
  var scatterPlot = document.getElementById('scatterContainer');

  if (!scatterPlot || !scatterPlot.data || scatterPlot.data.length === 0) {
    console.error('Scatter plot or data not found.');
    return;
  }

  var currentData = scatterPlot.data[0];

  // Ensure the data arrays are of the same length
  if (currentData.x.length !== currentData.y.length) {
    console.error('Data arrays have different lengths.');
    return;
  }

  // Find the index of the point with the provided x and y coordinates
  var pointIndex = currentData.x.findIndex(function (x, index) {
    return parseFloat(x) === parseFloat(snormalized) && parseFloat(currentData.y[index]) === parseFloat(sindex_of_1);
  });

  if (pointIndex !== -1) {
    // Create a new color array with the same length as the current data
    var colors = new Array(currentData.x.length).fill('rgba(0, 0, 235, 0.5)');
    // Create a new size array with the same length as the current data
    var sizes = new Array(currentData.x.length).fill(10);  // Set the default size

    // Change the color for the matching point
    colors[pointIndex] = 'red';  // Change to red for the matching point
    // Change the size for the matching point
    sizes[pointIndex] = 15;  // Change to the size you want for the matching point

    // Update the color and size of the corresponding point in the scatter plot
    Plotly.update(scatterPlot, {
      'marker.color': [colors],  // Update the color array for the scatter plot
      'marker.size': [sizes]     // Update the size array for the scatter plot
    });
  } else {
    console.log('Point with specified coordinates not found.');
  }
}

function highlightPointInScatter2(sindex_of_1, snormalized2) {
  var scatterPlot = document.getElementById('scatterContainer2');

  if (!scatterPlot || !scatterPlot.data || scatterPlot.data.length === 0) {
    console.error('Scatter plot or data not found.');
    return;
  }

  var currentData = scatterPlot.data[0];

  // Ensure the data arrays are of the same length
  if (currentData.x.length !== currentData.y.length) {
    console.error('Data arrays have different lengths.');
    return;
  }

  // Find the index of the point with the provided x and y coordinates
  var pointIndex = currentData.x.findIndex(function (x, index) {
    return parseFloat(x) === parseFloat(snormalized2) && parseFloat(currentData.y[index]) === parseFloat(sindex_of_1);
  });

  if (pointIndex !== -1) {
    // Create a new color array with the same length as the current data
    var colors = new Array(currentData.x.length).fill('rgba(0, 0, 235, 0.5)');
    // Create a new size array with the same length as the current data
    var sizes = new Array(currentData.x.length).fill(10);  // Set the default size

    // Change the color for the matching point
    colors[pointIndex] = 'red';  // Change to red for the matching point
    // Change the size for the matching point
    sizes[pointIndex] = 15;  // Change to the size you want for the matching point

    // Update the color and size of the corresponding point in the scatter plot
    Plotly.update(scatterPlot, {
      'marker.color': [colors],  // Update the color array for the scatter plot
      'marker.size': [sizes]     // Update the size array for the scatter plot
    });
  } else {
    console.log('Point with specified coordinates not found.');
  }
}


function clearShapefile() {
  if (polygonLayer) {
    map.removeLayer(polygonLayer);
    polygonLayer = null;
    clearLegend();
  }
}

function createLegend() {
  var legend = L.control({ position: 'topright' });

  legend.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'info legend');

    var gradientBar = '<div class="gradient-bar" style="background: linear-gradient(to right, #084081, #b5d4e9); height: 20px;"></div>';

    var labels = [];
    labels.push('<div class="legend-title"><strong>Index of Multiple Deprivation</strong></div>');
    labels.push('<div class="labels-container"><span class="label-smaller">Most Deprived</span><span class="label-smaller">Least Deprived</span></div>');

    div.innerHTML = labels.join('') + gradientBar;
    return div;
  };

  legend.addTo(map);
}

// Function to calculate Pearson's correlation coefficient
function pearsonCorrelation(x, y) {
  var sumX = 0;
  var sumY = 0;
  var sumXY = 0;
  var sumXSquare = 0;
  var sumYSquare = 0;
  var n = x.length;

  for (var i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumXSquare += x[i] * x[i];
    sumYSquare += y[i] * y[i];
  }

  var numerator = sumXY - (sumX * sumY) / n;
  var denominator = Math.sqrt((sumXSquare - (sumX * sumX) / n) * (sumYSquare - (sumY * sumY) / n));

  if (denominator === 0) {
    return 0;  // To handle division by zero
  }

  return numerator / denominator;
}


//create the chart
function createColumnChart(feature) {
    var percentageMale = parseFloat(feature.properties.Percentage);
    var percentageFemale = parseFloat(feature.properties.Percenta_2);

    var data = [{
        x: ['Male', 'Female'],
        y: [percentageMale, percentageFemale],
        type: 'bar',
        marker: {
            color: ['blue', 'pink']  // Set colors for male and female columns
        }
    }];

    var layout = {
        title: {text: '% of Cycling (Male vs Female)',
        font: {size: 14, weight: 'bold'}
      },
        xaxis: {
            title: 'Gender',
        },
        yaxis: {
            title: 'Percentage',
        }
    };

    // Update the existing chart or create a new one
    Plotly.newPlot('chart1', data, layout);
}

function createColumnChart2(feature) {
    var percentageMale = parseFloat(feature.properties.Percenta_1);
    var percentageFemale = parseFloat(feature.properties.Percenta_3);

    var data = [{
        x: ['Male', 'Female'],
        y: [percentageMale, percentageFemale],
        type: 'bar',
        marker: {
            color: ['blue', 'pink']  // Set colors for male and female columns
        }
    }];

    var layout = {
        title: {
          text: '% of Walking (Male vs Female)',
        font: {size: 14, bold: true}
      },
        xaxis: {
            title: 'Gender',
        },
        yaxis: {
            title: 'Percentage',
        }
    };

    // Update the existing chart or create a new one
    Plotly.newPlot('chart2', data, layout);
}

// Add this function to your script.js file
function captureImage() {
    // Capture the entire body content
    html2canvas(document.body).then(function(canvas) {
        // Convert the canvas to a data URL
        var imageDataUrl = canvas.toDataURL();

        // Create a link element and trigger a download
        var link = document.createElement('a');
        link.href = imageDataUrl;
        link.download = 'dashboard_image.png';
        link.click();
    });
}
