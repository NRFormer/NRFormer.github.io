// 初始化地图 ECharts 实例
var container = document.getElementById('chart-container');
var myChart = echarts.init(container);

// 初始化折线图 ECharts 实例
var lineChartContainer = document.getElementById('line-chart-container');
var lineChart = echarts.init(lineChartContainer);

// 当前选中的节点数据
var currentNodeData = null;
var originalNodeData = []; // 用于存储原始节点数据

// 显示地图的加载动画
myChart.showLoading();

// 获取地图数据并注册地图
$.get('json/japan.geojson', function (geoJson) {
    myChart.hideLoading();
    echarts.registerMap('Japan', geoJson);

    // 加载节点数据
    $.get('json/map_node_forecasting/NRFormer_1D-data-v2-3841_test_Sample1_PreGraph_xlx.json', function (nodeData) {
        originalNodeData = nodeData; // 保存原始节点数据

        myChart.setOption(getMapOption(nodeData));

        // 当点击地图节点时的处理逻辑
        myChart.on('click', function (event) {
            if (event.componentType === 'series' && event.componentSubType === 'scatter') {
                currentNodeData = event.data; // 保存当前节点的数据
                applyFilter(currentNodeData); // 直接更新折线图
                updateLineChartPosition(event.event.offsetX, event.event.offsetY); // 更新折线图位置
                lineChartContainer.style.display = 'block'; // 显示折线图
            }
        });

        // 点击非节点区域隐藏折线图
        myChart.getZr().on('click', function (event) {
            if (!event.target) {
                lineChartContainer.style.display = 'none';
            }
        });
    });
});

// 监听地图缩放和平移事件
myChart.on('geoRoam', function () {
    var option = myChart.getOption();
    var zoom = option.geo[0].zoom;
    var center = option.geo[0].center;

    // 重新设置地图选项以更新节点位置
    myChart.setOption(getMapOption(originalNodeData, zoom, center));
});

function getMapOption(nodeData, zoom, center) {
    return {
        title: {
            text: 'Radiation Forecasting of each Monitoring Station.',
            left: 'center'
        },
        textStyle: {
            color:'#4a4e52',
            fontFamily: 'Georgia, JiZiJingDianDaBiaoSongJianFan, FangSong, STFangsong, sans-serif' // 设置主标题整体字体
        },
        legend: {
            orient: 'horizontal',
            top: 20,
        },
        geo: {
            map: 'Japan',
            roam: true,
            zoom: zoom || 2,
            center: center || [139, 38]
        },
        series: [
            {
                // name: '节点',
                type: 'scatter',
                coordinateSystem: 'geo',
                data: nodeData,
                symbolSize: 6
            }
        ]
    };
}

function updateLineChart(data) {
    lineChart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(32, 33, 36,.7)',
            borderColor: 'rgba(32, 33, 36,0.20)',
            borderWidth: 1,
            textStyle: {
                color: '#fff',
                fontSize: '12'
            },
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: '#6a7985'
                }
            },
        },
        title: {
            text: data.name,
        },
        xAxis: {
            type: 'category',
            data: convertAllDates(data.time),
            axisLabel: {
                interval: 'auto',
                rotate: 45
            }
        },
        yAxis: {
            scale: true,
            type: 'value',
            axisLabel: {
                interval: 'auto',
            }
        },
        legend: {
            data: ['Prediction'],
            left: 'right',
        },
        series: [
            {
                name: 'Prediction',
                type: 'line',
                data: data.pre,
            }
        ]
    });

    lineChartContainer.style.display = 'block';
}

function updateLineChartPosition(x, y) {
    // 更新折线图的位置
    var chartPosition = container.getBoundingClientRect();
    var offsetX = 20; // 横向偏移量
    var offsetY = 20; // 纵向偏移量

    lineChartContainer.style.left = chartPosition.left + x + offsetX + 'px';
    lineChartContainer.style.top = chartPosition.top + y + offsetY + 'px';
}

// 新增拖拽功能
function makeDraggable(element) {
    var isMouseDown = false;
    var mouseX, mouseY, elemX, elemY;

    element.addEventListener('mousedown', function (e) {
        isMouseDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
        elemX = element.offsetLeft;
        elemY = element.offsetTop;
    });

    document.addEventListener('mousemove', function (e) {
        if (isMouseDown) {
            var deltaX = e.clientX - mouseX;
            var deltaY = e.clientY - mouseY;
            element.style.left = elemX + deltaX + 'px';
            element.style.top = elemY + deltaY + 'px';
        }
    });

    document.addEventListener('mouseup', function () {
        isMouseDown = false;
    });
}

// 使折线图容器可拖拽
makeDraggable(lineChartContainer);

function applyFilter(data) {
    // 直接更新折线图，无需依赖时间选择
    const filteredData = {
        time: convertAllDates(data.time),
        pre: data.pre,
        name: data.name,
    };
    updateLineChart(filteredData);
}

// 日期格式转换
function convertAllDates(dateArray) {
    return dateArray.map(convertDateFormat);
}

function convertDateFormat(dateStr) {
    const dateObject = new Date(dateStr);
    return (dateObject.getMonth() + 1) + '-' + dateObject.getDate();
}
