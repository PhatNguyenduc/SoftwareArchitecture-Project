// Mảng để lưu trữ thời gian phản hồi cho mỗi container
const responseTimeDataContainer1 = [];
const responseTimeDataContainer2 = [];
const responseTimeLabelsContainer1 = [];
const responseTimeLabelsContainer2 = [];

// Tạo biểu đồ cho Container 1 (Exchange Rate API)
const responseTimeChartContext1 = document
  .getElementById("trafficChart1")
  .getContext("2d");

const responseTimeChart1 = new Chart(responseTimeChartContext1, {
  type: "line",
  data: {
    labels: responseTimeLabelsContainer1,
    datasets: [
      {
        label: "Exchange Rate API Response Time (ms)",
        data: responseTimeDataContainer1,
        borderColor: "rgba(147, 250, 165, 1)",
        backgroundColor: "rgba(147, 250, 165, 0.2)",
        fill: true,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Response Time (ms)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Time",
        },
      },
    },
  },
});

// Tạo biểu đồ cho Container 2 (Gold Price API)
const responseTimeChartContext2 = document
  .getElementById("trafficChart2")
  .getContext("2d");

const responseTimeChart2 = new Chart(responseTimeChartContext2, {
  type: "line",
  data: {
    labels: responseTimeLabelsContainer2,
    datasets: [
      {
        label: "Gold Price API Response Time (ms)",
        data: responseTimeDataContainer2,
        borderColor: "rgba(147, 250, 165, 1)",
        backgroundColor: "rgba(147, 250, 165, 0.2)",
        fill: true,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Response Time (ms)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Time",
        },
      },
    },
  },
});

// Hàm lấy trạng thái sức khỏe từ server và tính thời gian phản hồi
async function fetchHealthStatus() {
  const startTime = Date.now(); // Bắt đầu đo thời gian phản hồi

  try {
    const healthData = await $.get("http://localhost:8020/api/health");
    const responseTime = Date.now() - startTime; // Thời gian phản hồi
    const currentTime = new Date().toLocaleTimeString();

    // Kiểm tra tình trạng của từng API và cập nhật biểu đồ
    if (healthData.exchangeRateApi.status === "UP") {
      responseTimeDataContainer1.push(responseTime);
      responseTimeLabelsContainer1.push(currentTime);

      if (responseTimeDataContainer1.length > 720) {
        responseTimeDataContainer1.shift();
        responseTimeLabelsContainer1.shift();
      }

      responseTimeChart1.update();
    }

    if (healthData.goldApi.status === "UP") {
      responseTimeDataContainer2.push(responseTime);
      responseTimeLabelsContainer2.push(currentTime);

      if (responseTimeDataContainer2.length > 720) {
        responseTimeDataContainer2.shift();
        responseTimeLabelsContainer2.shift();
      }

      responseTimeChart2.update();
    }

    // Cập nhật trạng thái sức khỏe và tài nguyên trong giao diện
    $("#health-status").html(`
      <h3>API Health</h3>
      <p>Exchange Rate API: ${healthData.exchangeRateApi.status}</p>
      <p>Gold Price API: ${healthData.goldApi.status}</p>
    `);

    $("#resources").html(`
      <h3>Memory Usage</h3>
      <p>Exchange Rate API Memory Usage: ${healthData.exchangeRateApi.data.memoryUsageInMB} MB / ${healthData.exchangeRateApi.data.totalMemory}</p>
      <p>Gold Price API Memory Usage: ${healthData.goldApi.data.memoryUsageInMB} MB / ${healthData.goldApi.data.totalMemory}</p>
    `);

    $("#container-status").html(`
      <h3>Container Status</h3>
      <p>Exchange Rate API Container Status: ${healthData.exchangeRateApi.data.containerStatus}</p>
      <p>Gold Price API Container Status: ${healthData.goldApi.data.containerStatus}</p>
    `);

  } catch (error) {
    console.error("Error fetching health status:", error);
    $("#health-status").html("<p>Error fetching health status.</p>");
  }
}

// Gọi hàm lấy dữ liệu mỗi 10 giây
setInterval(fetchHealthStatus, 5000);
fetchHealthStatus();
