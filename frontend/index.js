const exchangeRateStatusCounts = { up: 0, down: 0, partial: 0 };
const goldStatusCounts = { up: 0, down: 0, partial: 0 };

// Tạo biểu đồ cho Exchange Rate API
const exchangeRatePieCtx = document
  .getElementById("exchangeRatePieChart")
  .getContext("2d");
const exchangeRatePieChart = new Chart(exchangeRatePieCtx, {
  type: "doughnut",
  data: {
    labels: ["Up", "Down", "Partially Up"],
    datasets: [
      {
        data: [
          exchangeRateStatusCounts.up,
          exchangeRateStatusCounts.down,
          exchangeRateStatusCounts.partial,
        ],
        backgroundColor: ["#4caf50", "#f44336", "#ffeb3b"],
      },
    ],
  },
  options: {
    plugins: {
      title: {
        display: true,
        text: "Exchange Rate API Status",
        position: "bottom",
        padding: 20,
        font: {
          size: 16,
          weight: "bold",
        },
      },
      legend: {
        position: "right",
        labels: {
          generateLabels: function (chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, index) => {
                const value = data.datasets[0].data[index];
                return {
                  text: `${label}: ${value}`,
                  fillStyle: data.datasets[0].backgroundColor[index],
                  strokeStyle: data.datasets[0].backgroundColor[index],
                  lineWidth: 0,
                  hidden: false,
                  index: index,
                };
              });
            }
            return [];
          },
        },
      },
    },
  },
});

// Tạo biểu đồ cho Gold API
const goldPieCtx = document.getElementById("goldPieChart").getContext("2d");
const goldPieChart = new Chart(goldPieCtx, {
  type: "doughnut",
  data: {
    labels: ["Up", "Down", "Partially Up"],
    datasets: [
      {
        data: [
          goldStatusCounts.up,
          goldStatusCounts.down,
          goldStatusCounts.partial,
        ],
        backgroundColor: ["#4caf50", "#f44336", "#ffeb3b"],
      },
    ],
  },
  options: {
    plugins: {
      title: {
        display: true,
        text: "Gold API Status",
        position: "bottom",
        padding: 20,
        font: {
          size: 16,
          weight: "bold",
        },
      },
      legend: {
        position: "right",
        labels: {
          generateLabels: function (chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, index) => {
                const value = data.datasets[0].data[index];
                return {
                  text: `${label}: ${value}`,
                  fillStyle: data.datasets[0].backgroundColor[index],
                  strokeStyle: data.datasets[0].backgroundColor[index],
                  lineWidth: 0,
                  hidden: false,
                  index: index,
                };
              });
            }
            return [];
          },
        },
      },
    },
  },
});
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
        // borderColor: "rgba(147, 250, 165, 1)",
        // backgroundColor: "rgba(147, 250, 165, 0.2)",
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
        // borderColor: "rgba(147, 250, 165, 1)",
        // backgroundColor: "rgba(147, 250, 165, 0.2)",
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
const API_KEY = "anhHiepDepTrai";
const CLIENT_EMAIL = "22028295@vnu.edu.vn";
async function fetchHealthStatus() {
  const startTime = Date.now();

  try {
    const healthData = await $.ajax({
      url: "http://localhost:8020/api/health",
      method: "GET",
      beforeSend: function (xhr) {
        xhr.setRequestHeader("api-key", API_KEY);
        xhr.setRequestHeader("dest-email", CLIENT_EMAIL);
      }
    });
    const responseTime = Date.now() - startTime;
    const currentTime = new Date().toLocaleTimeString();

    // Kiểm tra trạng thái Exchange Rate API
    const exchangeRateStatus =
      healthData?.exchangeRateApi?.data?.status ?? "DOWN";
    const exchangeRateEndpoint =
      healthData?.exchangeRateApi?.data?.endpointStatus ?? "DOWN";
    const exchangeRateContainer =
      healthData?.exchangeRateApi?.data?.containerStatus ?? "DOWN";
    console.log(
      exchangeRateStatus,
      exchangeRateEndpoint,
      exchangeRateContainer
    );
    // Kiểm tra chi tiết trạng thái Exchange Rate
    if (
      exchangeRateStatus === "UP" &&
      exchangeRateEndpoint === "UP" &&
      exchangeRateContainer === "UP"
    ) {
      exchangeRateStatusCounts.up++;
    } else if (exchangeRateStatus === "PARTIALLY_UP") {
      // Partially up khi endpoint down nhưng service vẫn chạy
      exchangeRateStatusCounts.partial++;
    } else if (
      exchangeRateStatus === "DOWN" ||
      exchangeRateContainer !== "UP"
    ) {
      exchangeRateStatusCounts.down++;
    }

    // Kiểm tra trạng thái Gold API
    const goldStatus = healthData?.goldApi?.data?.status ?? "DOWN";
    const goldEndpoint = healthData?.goldApi?.data?.endpointStatus ?? "DOWN";

    const goldContainer = healthData?.goldApi?.data?.containerStatus ?? "DOWN";

    // console.log(goldStatus, goldEndpoint, goldContainer);

    // Kiểm tra chi tiết trạng thái Gold
    if (
      goldStatus === "UP" &&
      goldEndpoint === "UP" &&
      goldContainer === "UP"
    ) {
      goldStatusCounts.up++;
    } else if (goldStatus === "PARTIALLY_UP") {
      goldStatusCounts.partial++;
    } else if (goldStatus === "DOWN" || goldContainer !== "UP") {
      goldStatusCounts.down++;
    }

    // Cập nhật biểu đồ tròn
    exchangeRatePieChart.data.datasets[0].data = [
      exchangeRateStatusCounts.up,
      exchangeRateStatusCounts.down,
      exchangeRateStatusCounts.partial,
    ];
    goldPieChart.data.datasets[0].data = [
      goldStatusCounts.up,
      goldStatusCounts.down,
      goldStatusCounts.partial,
    ];

    // Cập nhật biểu đồ
    exchangeRatePieChart.update();
    goldPieChart.update();


    // Exchange-rate-api graph update
    responseTimeDataContainer1.push(responseTime);
    responseTimeLabelsContainer1.push(currentTime);

    if (responseTimeDataContainer1.length > 720) {
      responseTimeDataContainer1.shift();
      responseTimeLabelsContainer1.shift();
    }

    // Cập nhật biểu đồ response time chỉ khi endpoint UP
    if (exchangeRateEndpoint === "UP") {
      responseTimeChart1.data.datasets[0].borderColor = "rgba(147, 250, 165, 1)";
      responseTimeChart1.data.datasets[0].backgroundColor = "rgba(147, 250, 165, 0.2)";
    } else if (exchangeRateEndpoint === "PARTIALLY_UP") {
      responseTimeChart1.data.datasets[0].borderColor = "rgba(255, 235, 59, 1)";
      responseTimeChart1.data.datasets[0].backgroundColor = "rgba(255, 235, 59, 0.2)";
    } else {
      responseTimeChart1.data.datasets[0].borderColor = "rgba(244, 67, 54, 1)";
      responseTimeChart1.data.datasets[0].backgroundColor = "rgba(244, 67, 54, 0.2)";
    }

    responseTimeChart1.update();

    // Gold-api graph update
    responseTimeDataContainer2.push(responseTime);
    responseTimeLabelsContainer2.push(currentTime);

      if (responseTimeDataContainer2.length > 720) {
        responseTimeDataContainer2.shift();
        responseTimeLabelsContainer2.shift();
      }

    if (goldEndpoint === "UP") {
      responseTimeChart2.data.datasets[0].borderColor = "rgba(147, 250, 165, 1)";
      responseTimeChart2.data.datasets[0].backgroundColor = "rgba(147, 250, 165, 0.2)";
    } else if (exchangeRateEndpoint === "PARTIALLY_UP") {
      responseTimeChart2.data.datasets[0].borderColor = "rgba(255, 235, 59, 1)";
      responseTimeChart2.data.datasets[0].backgroundColor = "rgba(255, 235, 59, 0.2)";
    } else {
      responseTimeChart2.data.datasets[0].borderColor = "rgba(244, 67, 54, 1)";
      responseTimeChart2.data.datasets[0].backgroundColor = "rgba(244, 67, 54, 0.2)";
    }
    
    responseTimeChart2.update();


    // Cập nhật thông tin trạng thái với thông tin chi tiết hơn
    $("#health-status").html(`
      <h3>API Health</h3>
      <p>Exchange Rate API: ${exchangeRateStatus} (Endpoint: ${exchangeRateEndpoint})</p>
      <p>Gold Price API: ${goldStatus} (Endpoint: ${goldEndpoint})</p>
    `);

    $("#resources").html(`
      <h3>Memory Usage</h3>
      <p>Exchange Rate API: ${healthData?.exchangeRateApi?.data?.memoryUsageInMB} MB / ${healthData?.exchangeRateApi?.data?.totalMemoryInMB}</p>
      <p>Gold Price API: ${healthData?.goldApi?.data?.memoryUsageInMB} MB / ${healthData?.goldApi?.data?.totalMemoryInMB}</p>
    `);

    $("#container-status").html(`
      <h3>Container Status</h3>
      <p>Exchange Rate API: ${exchangeRateContainer}</p>
      <p>Gold Price API: ${goldContainer}</p>
    `);
  } catch (error) {
    console.error("Error fetching health status:", error);
    $("#health-status").html("<p>Error fetching health status.</p>");
  }
}

// Khởi tạo và gọi hàm
setInterval(fetchHealthStatus, 5000);
fetchHealthStatus();
