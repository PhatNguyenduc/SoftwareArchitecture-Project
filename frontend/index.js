// Mảng để lưu trữ thời gian phản hồi cho mỗi container
const responseTimeDataContainer1 = [];
const responseTimeDataContainer2 = [];
const responseTimeLabelsContainer1 = [];
const responseTimeLabelsContainer2 = [];

// Tạo biểu đồ cho Container 1
const responseTimeChartContext1 = document
  .getElementById("trafficChart1")
  .getContext("2d");

const responseTimeChart1 = new Chart(responseTimeChartContext1, {
  type: "line",
  data: {
    labels: responseTimeLabelsContainer1,
    datasets: [
      {
        label: "Container 1 Response Time (ms)",
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

// Tạo biểu đồ cho Container 2
const responseTimeChartContext2 = document
  .getElementById("trafficChart2")
  .getContext("2d");

const responseTimeChart2 = new Chart(responseTimeChartContext2, {
  type: "line",
  data: {
    labels: responseTimeLabelsContainer2,
    datasets: [
      {
        label: "Container 2 Response Time (ms)",
        data: responseTimeDataContainer2,
        borderColor: "rgba(240, 128, 128, 1)",
        backgroundColor: "rgba(240, 128, 128, 0.2)",
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

// Hàm lấy dữ liệu từ server và cập nhật biểu đồ
async function fetchContainerData() {
  try {
    const containerData = await $.get("http://localhost:5000/api/containers");

    // Hiển thị trạng thái container
    $("#container-status").html(
      containerData
        .map(
          (container) =>
            `<p>Container ${container.name} (ID: ${container.id}): ${container.status}</p>`
        )
        .join("")
    );

    // Hiển thị tài nguyên container
    $("#resources").html(
      containerData
        .map(
          (container) =>
            `<p><strong>${container.name}</strong> - CPU: ${container.cpu}% - Memory: ${container.memory} - Response Time: ${container.responseTime}</p>`
        )
        .join("")
    );

    const currentTime = new Date().toLocaleTimeString();

    // Cập nhật dữ liệu cho từng container
    containerData.forEach((container, index) => {
      if (container.status === "up") {
        if (index === 0) {
          responseTimeDataContainer1.push(parseFloat(container.responseTime));
          responseTimeLabelsContainer1.push(currentTime);

          if (responseTimeDataContainer1.length > 720) {
            responseTimeDataContainer1.shift();
            responseTimeLabelsContainer1.shift();
          }

          responseTimeChart1.update();
        } else if (index === 1) {
          responseTimeDataContainer2.push(parseFloat(container.responseTime));
          responseTimeLabelsContainer2.push(currentTime);

          if (responseTimeDataContainer2.length > 720) {
            responseTimeDataContainer2.shift();
            responseTimeLabelsContainer2.shift();
          }

          responseTimeChart2.update();
        }
      }
    });
  } catch (error) {
    console.error("Error fetching container data:", error);
  }
}

// Hàm lấy trạng thái sức khỏe từ server
async function fetchHealthStatus() {
  try {
    const healthData = await $.get("http://localhost:5000/api/health");

    $("#health-status").html(`
      <h3>API Health</h3>
      <p>Exchange Rate API: ${healthData.exchangeRateApi.status}</p>
      <p>Gold Price API: ${healthData.goldApi.status}</p>
    `);
  } catch (error) {
    console.error("Error fetching health status:", error);
    $("#health-status").html("<p>Error fetching health status.</p>");
  }
}

// Gọi hàm lấy dữ liệu mỗi 10 giây
setInterval(fetchContainerData, 5000);
setInterval(fetchHealthStatus, 5000);

fetchHealthStatus();
fetchContainerData();
