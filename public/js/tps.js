// 处理组件tps-detail的事件
// Path: public/js/tps-detail.js

// 获取平均TPS的函数
function get_avg_tps() {
    // 显示加载图标
    document.getElementById('tps-detail-loading').style.display = 'block';
    // 隐藏错误图标
    document.getElementById('tps-detail-error').style.display = 'none';

    // 获取用户选择的模型名称和时间长度
    const model = document.getElementById('tps-detail-model-input').value;
    const timeLength = document.getElementById('tps-count-time-length').value;

    // 构造URL
    const url = `/api/tps/avg_tps?model=${encodeURIComponent(model)}&timeLength=${encodeURIComponent(timeLength)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // 隐藏加载图标
            document.getElementById('tps-detail-loading').style.display = 'none';
            updateChart(data);
        })
        .catch(error => {
            console.error('Error fetching average TPS:', error);
            document.getElementById('tps-detail-loading').style.display = 'none';
            document.getElementById('tps-detail-error').style.display = 'block';
        });
}

function updateChart(data) {
    // 准备图表数据
    const channelNames = data.map(item => item.channel_name);
    const avgTpsValues = data.map(item => item.avg_tps);

    // 获取canvas元素
    const canvas = document.getElementById('tps-detail-chart');
    const ctx = canvas.getContext('2d');

    // 清除现有的图表实例
    if (window.myBarChart) {
        window.myBarChart.destroy();
    }

    // 创建新的图表实例
    window.myBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: channelNames,
            datasets: [{
                label: '平均TPS',
                data: avgTpsValues,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}