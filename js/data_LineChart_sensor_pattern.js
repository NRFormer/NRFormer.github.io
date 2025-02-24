var chartDom = document.getElementById('chart-container');
var myChart = echarts.init(chartDom);
var rawData; // 存储原始数据

// 从服务器获取数据
$.get('json/data_LineChart_sensor_pattern/1D-data_line_pattern_data.json', function (_rawData) {
    rawData = _rawData; // 保存原始数据
    updateChart(); // 初始图表渲染
});

$(document).ready(function() {
    $('#controls input[type="checkbox"]').change(function() {
        updateChart();
    });
});

function updateChart() {
    var selectedCountries = $('#controls input[type="checkbox"]:checked').map(function() {
        return this.value;
    }).get();

    run(rawData, selectedCountries);
}

function run(_rawData, selectedCountries) {
    const datasetWithFilters = [];
    const seriesList = [];

    echarts.util.each(selectedCountries, function (area) {
        var datasetId = 'dataset_' + area;
        datasetWithFilters.push({
            id: datasetId,
            fromDatasetId: 'dataset_raw',
            transform: {
                type: 'filter',
                config: {
                    and: [
                        { dimension: 'time', gte: 2021 },
                        { dimension: 'area', '=': area },
                        // { dimension: 'value', '!=': 0 } // 过滤掉值为0的数据
                    ]
                }
            }
        });
        seriesList.push({
            type: 'line',
            datasetId: datasetId,
            showSymbol: false,
            name: area,
            lineStyle: {
                width: 1 // 线条粗细
            },
            endLabel: {
                show: true,
                formatter: function (params) {
                    return params.value[2] + ': ' + params.value[0];
                }
            },
            labelLayout: {
                moveOverlap: 'shiftY'
            },
            emphasis: {
                focus: 'series'
            },
            encode: {
                x: 'time',
                y: 'value',
                label: ['area', 'value'],
                itemName: 'time',
                tooltip: ['value']
            }
        });
    });

    var option = {
        animationDuration: 10000,
        dataset: [
            {
                id: 'dataset_raw',
                source: _rawData
            },
            ...datasetWithFilters
        ],
        title: {
            text: 'Radiation Patterns Across Different Prefectures',
            subtext: 'Average radiation values across all monitoring stations within each prefecture',

            left: 'center',
            textStyle: {
                fontSize: 22,
                fontWeight: "bold",
                color: "#464646"
            },
        },
        tooltip: {
            order: 'valueDesc',
            trigger: 'axis',
        },
        xAxis: {
            type: 'category',
            nameLocation: 'middle',
        },
        yAxis: {
            name: 'Radiation',
            left: 1400,
            min: 15
        },
        grid: {
            left: '7%',
            right: '12%',
            containLabel: true
        },
        series: seriesList
    };

    myChart.setOption(option, true); // 确保图表正确更新
}