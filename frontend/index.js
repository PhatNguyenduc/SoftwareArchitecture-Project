// Mảng để lưu trữ thời gian phản hồi (response time) cho biểu đồ
const responseTimeData = [];
const responseTimeLabels = [];
const responseTimeChartContext = document
  .getElementById("trafficChart")
  .getContext("2d");

// Tạo biểu đồ thời gian phản hồi
const responseTimeChart = new Chart(responseTimeChartContext, {
  type: "line",
  data: {
    labels: responseTimeLabels,
    datasets: [
      {
        label: "Response Time (ms)",
        data: responseTimeData,
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

async function fetchContainerData() {
  try {
    const containerData = await $.get("http://localhost:5000/api/containers");

    $("#container-status").html(
      containerData
        .map(
          (container) =>
            `<p>Container ${container.name} (ID: ${container.id}): ${container.status}</p>`
        )
        .join("")
    );

    $("#resources").html(
      containerData
        .map(
          (container) =>
            `<p><strong>${container.name}</strong> - CPU: ${container.cpu}% - Memory: ${container.memory} - Response Time: ${container.responseTime}</p>`
        )
        .join("")
    );

    const currentTime = new Date().toLocaleTimeString();
    containerData.forEach((container) => {
      if (container.status === "up") {
        responseTimeData.push(parseFloat(container.responseTime));
        responseTimeLabels.push(currentTime);
      }
    });

    if (responseTimeData.length > 20) {
      responseTimeData.shift();
      responseTimeLabels.shift();
    }
    responseTimeChart.update();
  } catch (error) {
    console.error("Error fetching container data:", error);
  }
}

setInterval(fetchContainerData, 10000);
fetchContainerData();
