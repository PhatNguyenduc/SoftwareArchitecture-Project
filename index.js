const socket = io("http://localhost:5000");

const apiCtx = document.getElementById("apiStatusChart").getContext("2d");
const apiStatusChart = new Chart(apiCtx, {
  type: "bar",
  data: {
    labels: ["Gold Price", "Exchange Rate"],
    datasets: [
      {
        label: "API Status",
        data: [1, 1], // default status "up"
        backgroundColor: ["rgba(75, 192, 192, 0.2)", "rgba(255, 99, 132, 0.2)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 1,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value === 0 ? "Down" : "Up";
          },
        },
      },
    },
  },
});

const containerCtx = document
  .getElementById("containerStatusChart")
  .getContext("2d");
const containerStatusChart = new Chart(containerCtx, {
  type: "bar",
  data: {
    labels: ["Gold Price Container", "Exchange Rate Container"],
    datasets: [
      {
        label: "Container Status",
        data: [1, 1], // default status "up"
        backgroundColor: ["rgba(75, 192, 192, 0.2)", "rgba(255, 99, 132, 0.2)"],
        borderColor: ["rgba(75, 192, 192, 1)", "rgba(255, 99, 132, 1)"],
        borderWidth: 1,
      },
    ],
  },
  options: {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value === 0 ? "Down" : "Up";
          },
        },
      },
    },
  },
});

// Nhận dữ liệu từ server
socket.on("apiStatus", (data) => {
  apiStatusChart.data.datasets[0].data[0] = data.goldPrice === "up" ? 1 : 0;
  apiStatusChart.data.datasets[0].data[1] = data.exchangeRate === "up" ? 1 : 0;

  containerStatusChart.data.datasets[0].data[0] =
    data.goldPriceContainer === "up" ? 1 : 0;
  containerStatusChart.data.datasets[0].data[1] =
    data.exchangeRateContainer === "up" ? 1 : 0;

  // Cập nhật tài nguyên hệ thống
  document.getElementById("systemResources").innerHTML = `
                <p>CPU Usage: ${data.systemResources.cpu.toFixed(2)}%</p>
                <p>Memory Usage: ${data.systemResources.mem.toFixed(2)}%</p>
                <p>Network Bandwidth (RX): ${data.systemResources.net.toFixed(
                  2
                )} bytes/sec</p>
            `;

  apiStatusChart.update();
  containerStatusChart.update();
});
