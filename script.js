document.addEventListener("DOMContentLoaded", function () {
  const apiUrl = "https://api.bitget.com/api/v2/mix/market/tickers?productType=USDT-FUTURES";
  let updateTimeoutId = null;
  let currentInterval = 10000;

  // 更新日期和时间
  function updateDateTime() {
    try {
      const now = new Date();
      const dateString = now.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const timeString = now.toLocaleTimeString("zh-CN", {
        hour12: false,
      });

      const dateElement = document.getElementById("current-date");
      const timeElement = document.getElementById("current-time");

      if (dateElement) dateElement.textContent = dateString;
      if (timeElement) timeElement.textContent = timeString;
    } catch (error) {
      console.error("Error updating date/time:", error);
    }
  }

  // 每秒更新一次时间
  setInterval(updateDateTime, 1000); // 改为1000毫秒(1秒)
  updateDateTime(); // 初始化显示

  // 更新时间
  function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("zh-CN", { hour12: false });
    const timeElement = document.getElementById("current-time");
    if (timeElement) timeElement.textContent = timeString;
  }

  setInterval(updateTime, 1000);
  updateTime();

  function renderSummary(coins) {
    const sortedByFundingRate = coins
      .filter(c => c.fundingRate && parseFloat(c.fundingRate) !== 0) // 过滤掉无效或0费率
      .map(c => ({ ...c, fundingRate: parseFloat(c.fundingRate) }))
      .sort((a, b) => b.fundingRate - a.fundingRate);
      
    const top5 = sortedByFundingRate.slice(0, 5);
    const bottom5 = sortedByFundingRate.slice(-5).sort((a,b) => b.fundingRate - a.fundingRate); // 从大到小排序

    if (sortedByFundingRate.length > 0) {
      const maxRate = sortedByFundingRate[0].fundingRate;
      const minRate = sortedByFundingRate[sortedByFundingRate.length - 1].fundingRate;
      document.title = `${(maxRate * 100).toFixed(4)}%、${(minRate * 100).toFixed(4)}%`;
    }

    const summaryContainer = document.getElementById("funding-rate-summary");
    let html = `
      <div class="summary-grid">
        <div class="grid-header">Highest</div>
        <div class="grid-header">Rate</div>
        <div class="grid-header">Lowest</div>
        <div class="grid-header">Rate</div>
    `;

    for (let i = 0; i < 5; i++) {
      html += `
        <div class="grid-cell">${top5[i] ? top5[i].symbol.replace("USDT", "") : '-'}</div>
        <div class="grid-cell rate-positive">${top5[i] ? (top5[i].fundingRate * 100).toFixed(4) + '%' : '-'}</div>
        <div class="grid-cell">${bottom5[i] ? bottom5[i].symbol.replace("USDT", "") : '-'}</div>
        <div class="grid-cell rate-negative">${bottom5[i] ? (bottom5[i].fundingRate * 100).toFixed(4) + '%' : '-'}</div>
      `;
    }

    html += `</div>`;
    summaryContainer.innerHTML = html;
  }

  async function updatePrices() {
    try {
      const response = await fetch(apiUrl);
      const result = await response.json();

      if (result.code === "00000" && Array.isArray(result.data)) {
        const coinsData = result.data;
        
        renderSummary(coinsData);

      } else {
        console.error("Error fetching prices or data is not in expected format:", result);
      }
    } catch (error) {
      console.error("Error updating prices:", error);
    } finally {
      // 无论成功失败都继续轮询
      if (updateTimeoutId) {
        clearTimeout(updateTimeoutId);
      }
      updateTimeoutId = setTimeout(updatePrices, currentInterval);
    }
  }

  function setupIntervalControls() {
    const intervalInput = document.getElementById('interval-input');
    const intervalButton = document.getElementById('interval-button');

    intervalInput.value = currentInterval;

    intervalButton.addEventListener('click', () => {
      const newInterval = parseInt(intervalInput.value, 10);
      if (!isNaN(newInterval) && newInterval >= 1000) { // 最小间隔1秒
        currentInterval = newInterval;
        if (updateTimeoutId) {
          clearTimeout(updateTimeoutId);
        }
        updatePrices(); // 立即执行一次
      } else {
        alert('请输入一个大于或等于1000的有效毫秒数。');
        intervalInput.value = currentInterval;
      }
    });
  }

  updatePrices();
  setupIntervalControls();
}); 
