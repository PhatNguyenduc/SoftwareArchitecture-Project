const trafficData = []; // Mảng lưu trữ lưu lượng truy cập
const trafficLabels = []; // Mảng lưu trữ nhãn thời gian cho biểu đồ
const trafficChartContext = document
  .getElementById("trafficChart")
  .getContext("2d");

// Tạo biểu đồ lưu lượng truy cập
const trafficChart = new Chart(trafficChartContext, {
  type: "line",
  data: {
    labels: trafficLabels,
    datasets: [
      {
        label: "Traffic",
        data: trafficData,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});

async function fetchData() {
  try {
    const containerStatus = await $.get(
      "http://localhost:5000/api/container-status"
    );
    $("#container-status").html(
      containerStatus.map((c) => `<p>${c.name}: ${c.status}</p>`).join("")
    );

    const endpointStatus = await $.get(
      "http://localhost:5000/api/endpoint-status"
    );
    $("#endpoint-status").html(
      endpointStatus.map((e) => `<p>${e.url}: ${e.status}</p>`).join("")
    );

    const resources = await $.get("http://localhost:5000/api/resources");
    $("#resources").html(`<p>CPU Usage: ${(resources.cpu * 100).toFixed(2)}%</p>
                              <p>Memory Usage: ${
                                (1 - resources.freeMemory) * 100
                              }%</p>
                              <p>Free Memory: ${(
                                resources.freeMemory * 100
                              ).toFixed(2)}%</p>`);

    const traffic = await $.get("http://localhost:5000/api/traffic");
    $("#traffic").html(`<p>Current Traffic: ${traffic.traffic}</p>`);

    // Cập nhật biểu đồ lưu lượng truy cập
    const currentTime = new Date().toLocaleTimeString();
    trafficData.push(traffic.traffic);
    trafficLabels.push(currentTime);
    if (trafficData.length > 10) {
      // Giới hạn số điểm dữ liệu trong biểu đồ
      trafficData.shift();
      trafficLabels.shift();
    }
    trafficChart.update(); // Cập nhật biểu đồ
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

setInterval(fetchData, 5000); // Lấy dữ liệu mỗi 5 giây
fetchData(); // Lần đầu tiên lấy dữ liệu
