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
    $.get('json/map_sensor_forecasting/1D-data_sensor_forecasting.json', function (nodeData) {
        originalNodeData = nodeData; // 保存原始节点数据

        // 对每个节点数据进行处理，设置颜色和状态
        const processedNodeData = nodeData.map(node => {
            const value = node.pre; // 获取节点的值
            const isAbnormal = value.some(value => value > 200);
            return {
                ...node,
                itemStyle: {
                    color: isAbnormal ? '#FF1517' : '#3960FF', // 设置颜色为红色或蓝色
                },
            };
        });

        // 默认设置 zoom 和 center
        myChart.setOption(getMapOption(processedNodeData, 2, [139, 38]));

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
    const greaterThanData = nodeData.filter(item => item.pre.some(value => value > 200));
    const lessThanOrEqualData = nodeData.filter(item => item.pre.some(value => value <= 200));

    return {
        title: {
            text: 'Real-time Radiation Forecasting System',
            left: 'center'
        },
        textStyle: {
            color: '#4a4e52',
            fontFamily: 'Georgia, JiZiJingDianDaBiaoSongJianFan, FangSong, STFangsong, sans-serif'
        },
        legend: {
            data: ['Elevated RadNodes', 'Low RadNodes'],
            show: true,
            textStyle: {
                fontSize: 15,
                fontWeight: "bold",
                color: "#464646"
            },
            left: 'left',
            top: 30,
            padding: [20, 0, 0, 0],
            orient: 'horizontal',
        },
        geo: {
            map: 'Japan',
            roam: true,
            zoom: zoom,
            center: center,
            label: {
                show: false
            }
        },
        series: [
            {
                name: 'Elevated RadNodes',
                type: 'scatter',
                coordinateSystem: 'geo',
                data: greaterThanData,
                symbolSize: 6,
                zIndex: 99999,
                zlevel: 10,
                label: {
                    formatter: '{b}',
                    position: 'right',
                    show: false
                },
                itemStyle: {
                    color: '#FF1517',
                    shadowBlur: 0,
                    shadowColor: '#333'
                }
            },
            {
                name: 'Low RadNodes',
                type: 'scatter',
                coordinateSystem: 'geo',
                data: lessThanOrEqualData,
                symbolSize: 6,
                zIndex: 1,
                zlevel: 5,
                label: {
                    formatter: '{b}',
                    position: 'right',
                    show: false
                },
                itemStyle: {
                    color: '#3960FF',
                    shadowBlur: 0,
                    shadowColor: '#333'
                }
            }
        ]
    };
}

// 更新折线图的数据显示
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
            subtext: '0.001μSv/h',
            textStyle: {
                fontSize: 16,
                fontWeight: 'normal',
                color: '#333'
            },
            subtextStyle: {
                fontSize: 14,
                color: '#333',
                fontWeight: 'normal'
            }
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

// 更新折线图位置
function updateLineChartPosition(x, y) {
    var chartPosition = container.getBoundingClientRect();
    var offsetX = 20;
    var offsetY = 20;

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
    const filteredData = {
        time: convertAllDates(data.time),
        pre: data.pre,
        name: data.name,
    };
    updateLineChart(filteredData);
}

// ================= 修改的日期处理部分 =================
// 日期格式转换
function convertAllDates(dateArray) {
    return dateArray.map(convertDateFormat);
}

function convertDateFormat(dateStr) {
    const dateObject = new Date(dateStr);
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0');
    const day = String(dateObject.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// ================= 修改结束 =================