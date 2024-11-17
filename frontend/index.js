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
const responseTimeColorsContainer1 = [];
const responseTimeColorsContainer2 = [];
const responseTimeBgColorsContainer1 = [];
const responseTimeBgColorsContainer2 = [];

function getColorForStatus(status, isBackground = false) {
  if (status === "DOWN") {
    return isBackground ? "rgba(255, 0, 0, 0.2)" : "rgba(255, 0, 0, 1)";
  } else if (status === "PARTIALLY_UP") {
    return isBackground ? "rgba(255, 255, 0, 0.2)" : "rgba(255, 255, 0, 1)";
  } else {
    return isBackground ? "rgba(0, 255, 0, 0.2)" : "rgba(0, 255, 0, 1)";
  }
}
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
        borderColor: function (context) {
          const index = context.dataIndex;
          return responseTimeColorsContainer1[index];
        },
        backgroundColor: function (context) {
          const index = context.dataIndex;
          return responseTimeBgColorsContainer1[index];
        },
        fill: true,
        segment: {
          borderColor: function (context) {
            const index = context.p0DataIndex;
            return responseTimeColorsContainer1[index];
          },
          backgroundColor: function (context) {
            const index = context.p0DataIndex;
            return responseTimeBgColorsContainer1[index];
          },
        },
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
        borderColor: function (context) {
          const index = context.dataIndex;
          return responseTimeColorsContainer2[index];
        },
        backgroundColor: function (context) {
          const index = context.dataIndex;
          return responseTimeBgColorsContainer2[index];
        },
        fill: true,
        segment: {
          borderColor: function (context) {
            const index = context.p0DataIndex;
            return responseTimeColorsContainer2[index];
          },
          backgroundColor: function (context) {
            const index = context.p0DataIndex;
            return responseTimeBgColorsContainer2[index];
          },
        },
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

function updateChartData(container, time, responseTime, status) {
  if (container === 1) {
    responseTimeLabelsContainer1.push(time);
    responseTimeDataContainer1.push(responseTime);
    responseTimeColorsContainer1.push(getColorForStatus(status));
    responseTimeBgColorsContainer1.push(getColorForStatus(status, true));
    responseTimeChart1.update();
  } else if (container === 2) {
    responseTimeLabelsContainer2.push(time);
    responseTimeDataContainer2.push(responseTime);
    responseTimeColorsContainer2.push(getColorForStatus(status));
    responseTimeBgColorsContainer2.push(getColorForStatus(status, true));
    responseTimeChart2.update();
  }
}

// Hàm lấy trạng thái sức khỏe từ server và tính thời gian phản hồi
const API_KEY = "anhHiepDepTrai";
async function fetchHealthStatus() {
  const startTime = Date.now();

  try {
    const healthData = await $.ajax({
      url: "http://localhost:8020/api/health",
      method: "GET",
      beforeSend: function (xhr) {
        xhr.setRequestHeader("api-key", API_KEY);
      },
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

    updateChartData(1, currentTime, responseTime, exchangeRateContainer);
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

    // console.log(
    //   exchangeRateContainer,
    //   exchangeRateEndpoint,
    //   exchangeRateStatus
    // );

    updateChartData(2, currentTime, responseTime, goldContainer);
    // console.log(goldContainer, goldEndpoint, goldStatus);

    // console.log(responseTimeColorsContainer1);
    // console.log(responseTimeColorsContainer2);
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
