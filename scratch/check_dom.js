const wsUrl = process.argv[2];
if (!wsUrl) {
  console.error("Please provide WebSocket URL.");
  process.exit(1);
}

const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log("Connected to browser session.");
  ws.send(JSON.stringify({ id: 1, method: "Runtime.enable" }));
  ws.send(JSON.stringify({ id: 2, method: "Page.enable" }));

  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 10,
      method: "Runtime.evaluate",
      params: { expression: "document.body.innerHTML" }
    }));
  }, 1000);

  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 11,
      method: "Page.captureScreenshot",
      params: { format: "png" }
    }));
  }, 2000);

  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 3000);
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id === 10) {
    console.log("[Current DOM Content]:");
    console.log(data.result?.result?.value);
  }
  if (data.id === 11) {
    const base64Data = data.result?.data;
    if (base64Data) {
      const fs = require('fs');
      const path = require('path');
      const targetPath = path.join(__dirname, 'current_screenshot.png');
      fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));
      console.log("Current screenshot saved successfully to " + targetPath + "!");
    }
  }
};
