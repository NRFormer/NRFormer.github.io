$(document).ready(function () {
    renderHeatmap($("#csvSelector").val());
});

// 监听下拉框更改事件
$("#csvSelector").on("change", function () {
    renderHeatmap($(this).val());
});

var heatmapChart = echarts.init(document.getElementById('heatmapChart')); // 只初始化一次

// 渲染热力图
function renderHeatmap(csvFile) {
    $.ajax({
        type: "GET",
        url: csvFile,
        dataType: "text",
        success: function (data) {
            console.log("CSV 文件加载成功:", csvFile);
            processData(data, csvFile);
        },
        error: function () {
            console.error("CSV 文件加载失败:", csvFile);
        }
    });
}

// 处理CSV数据
function processData(csvData, csvFileName) {
    var lines = csvData.split("\n").filter(line => line.trim() !== ""); // 过滤空行
    var header = lines[0].split(",");

    var result = [];

    for (var i = 1; i < lines.length; i++) {
        var currentLine = lines[i].split(",");
        if (currentLine.length === header.length) {
            var yearMonth = currentLine[5]; // 年-月
            var day = parseInt(currentLine[4], 10); // 日期
            var average = parseFloat(currentLine[1]); // 平均值
            if (!isNaN(average)) {
                result.push([yearMonth, day, average.toFixed(2)]); // 保留两位小数
            }
        }
    }

    console.log("处理后的数据:", result);
    generateHeatmap(result, csvFileName);
}

// 生成热力图
function generateHeatmap(data, csvFileName) {
    var months = [...new Set(data.map(item => item[0]))]; // 获取唯一月份
    var days = [...new Set(data.map(item => item[1]))].sort((a, b) => a - b); // 获取唯一日期，并按升序排序

    var heatmapData = data.map(item => [
        months.indexOf(item[0]), // x 轴索引（月份）
        days.indexOf(item[1]),   // y 轴索引（日期）
        parseFloat(item[2])      // 颜色映射的值
    ]);

    // 计算非零的最小值
    var nonZeroValues = heatmapData.map(item => item[2]).filter(value => value !== 0);
    var minValue = nonZeroValues.length ? Math.min(...nonZeroValues) : 0;
    var maxValue = Math.max(...heatmapData.map(item => item[2]));

    console.log("Min:", minValue, "Max:", maxValue, "Days:", days, "Months:", months);

    var option = {
        title: {
            text: "Heatmap: " + csvFileName.split('/').pop(),
            left: "center",
            textStyle: {
                fontSize: 16,
                fontWeight: "bold"
            }
        },
        tooltip: {
            position: 'top',
            formatter: function (params) {
                var yearMonth = months[params.data[0]];
                var day = days[params.data[1]];
                var value = params.data[2];
                return `Date: ${yearMonth}-${day} <br>Average: ${value}`;
            }
        },
        grid: {
            height: '50%',
            y: '10%'
        },
        xAxis: {
            type: 'category',
            data: months,
            splitArea: { show: true }
        },
        yAxis: {
            type: 'category',
            data: days,
            splitArea: { show: true }
        },
        visualMap: {
            min: minValue,  // 计算动态最小值（避免 0 被忽略）
            max: maxValue,
            calculable: true,
            orient: 'vertical',
            left: 'right',
            bottom: 200,
            color: ['#d94e5d', '#eac736', '#50a3ba']
        },
        series: [{
            name: 'Average Radiation',
            type: 'heatmap',
            data: heatmapData,
            label: { show: false },
            itemStyle: {
                emphasis: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };

    heatmapChart.setOption(option);
    heatmapChart.resize(); // 确保窗口调整时图表自适应
}
