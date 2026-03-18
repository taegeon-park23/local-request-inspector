const express = require("express");
const path = require("path");
const vm = require("vm");
const fs = require("fs");

const app = express();
const PORT = 5671;

app.use(express.static(path.join(__dirname, "public")));

// [복구 완료] 원본 라우터 코드 들여쓰기 원상 복구
let clients = [];
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  clients.push(res);
  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
  });
});

const captureRawBody = (req, res, buf) => {
  req.rawBody = buf.toString();
};
app.use(express.json({ verify: captureRawBody }));
app.use(express.urlencoded({ extended: true, verify: captureRawBody }));
app.use(express.text({ type: "*/*" }));

let mockConfig = {
  statusCode: 200,
  contentType: "application/json",
  body: '{\n  "message": "Request captured by Local Request Inspector"\n}',
};

app.post("/__inspector/mock", (req, res) => {
  mockConfig = { ...mockConfig, ...req.body };
  res.json({
    success: true,
    message: "Mock config updated",
    currentConfig: mockConfig,
  });
});

const getContentType = (ext) => {
  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".json": "application/json",
    ".csv": "text/csv",
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
  };
  return mimeTypes[ext] || "application/octet-stream"; // 등록되지 않은 확장자는 기본 바이너리 타입 반환
};

app.get("/__inspector/assets", async (req, res) => {
  const assetsPath = path.join(__dirname, "assets");
  try {
    if (!fs.existsSync(assetsPath)) {
      return res.json({ success: true, files: [] });
    }
    const files = await fs.promises.readdir(assetsPath);
    const fileDetails = await Promise.all(
      files.map(async (fileName) => {
        const filePath = path.join(assetsPath, fileName);
        const stat = await fs.promises.stat(filePath);
        const ext = path.extname(fileName).toLowerCase();

        return {
          filename: fileName,
          sizeBytes: stat.size,
          extension: ext,
          contentType: getContentType(ext), // [추가됨] 매핑 함수를 통해 contentType 추출
          isDirectory: stat.isDirectory(),
        };
      }),
    );
    const onlyFiles = fileDetails.filter((f) => !f.isDirectory);
    res.json({ success: true, files: onlyFiles });
  } catch (err) {
    console.error("Assets read error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 동적 콜백 실행 API (헤더, Form 데이터 전송 및 fetch 문제 해결)
app.post("/__inspector/execute", async (req, res) => {
  const { requestConfig, callbackCode } = req.body;
  const logs = [];

  try {
    logs.push(
      `[System] 1차 API 요청 시작: ${requestConfig.method} ${requestConfig.url}`,
    );

    // 1. 프론트엔드에서 넘어온 헤더 매핑
    const fetchOptions = {
      method: requestConfig.method,
      headers: requestConfig.headers || { "Content-Type": "application/json" },
    };

    // 2. 바디 타입에 따른 데이터 변환 (Postman과 동일한 동작 방식)
    if (requestConfig.method !== "GET" && requestConfig.body) {
      if (requestConfig.bodyType === "application/x-www-form-urlencoded") {
        const formParams = new URLSearchParams();
        if (typeof requestConfig.body === "object") {
          for (const key in requestConfig.body) {
            formParams.append(key, requestConfig.body[key]);
          }
        } else {
          formParams.append("data", requestConfig.body);
        }
        fetchOptions.body = formParams;
      } else if (requestConfig.bodyType === "application/json") {
        fetchOptions.body =
          typeof requestConfig.body === "string"
            ? requestConfig.body
            : JSON.stringify(requestConfig.body);
      } else {
        fetchOptions.body = String(requestConfig.body);
      }
    }

    // 3. 글로벌 fetch 호출
    if (typeof global.fetch === "undefined") {
      throw new Error(
        "시스템에 fetch API가 내장되어 있지 않습니다. Node.js 18 이상 버전이 필요합니다.",
      );
    }
    const initialRes = await global.fetch(requestConfig.url, fetchOptions);

    let responseData;
    const resText = await initialRes.text();
    try {
      responseData = JSON.parse(resText);
    } catch (e) {
      responseData = resText;
    }
    logs.push(`[System] 1차 응답 수신 완료 (Status: ${initialRes.status})`);

    // 4. 샌드박스 설정 (콜백 내부에서도 fetch, URLSearchParams 사용 가능하도록 주입)
    const sandbox = {
      fetch: global.fetch,
      URLSearchParams: global.URLSearchParams,
      FormData: global.FormData, // [추가] 샌드박스 내에서 FormData 사용 허용
      Blob: global.Blob, // [추가] 샌드박스 내에서 Blob 사용 허용
      fs: fs.promises,
      path: path,
      __dirname: __dirname,
      response: responseData,
      console: {
        log: (...args) => logs.push(`[Log] ${args.join(" ")}`),
        error: (...args) => logs.push(`[Error] ${args.join(" ")}`),
        warn: (...args) => logs.push(`[Warn] ${args.join(" ")}`),
        info: (...args) => logs.push(`[Info] ${args.join(" ")}`),
      },
    };
    vm.createContext(sandbox);

    const wrappedCode = `(async () => { \n${callbackCode}\n })()`;
    logs.push(`[System] 콜백 코드 실행 시작...`);

    const executionResult = await vm.runInContext(wrappedCode, sandbox);

    logs.push(`[System] 실행 완료`);
    res.json({ success: true, logs, result: executionResult });
  } catch (err) {
    logs.push(`[Error] 시스템/문법 오류: ${err.message}`);
    res.status(500).json({ success: false, error: err.message, logs });
  }
});

// 와일드카드 라우트 (최하단 배치)
app.all(/.*/, (req, res) => {
  if (req.path === "/events" || req.path.startsWith("/__inspector")) return;
  const rawHeadersStr = req.rawHeaders.reduce(
    (acc, current, index) =>
      index % 2 === 0 ? acc + current + ": " : acc + current + "\n",
    "",
  );
  const requestData = {
    id: Date.now(),
    timestamp: new Date().toLocaleTimeString(),
    method: req.method,
    url: req.originalUrl,
    parsedHeaders: req.headers,
    rawHeaders: rawHeadersStr,
    parsedBody: req.body,
    rawBody:
      req.rawBody ||
      (typeof req.body === "string" ? req.body : "No Body or Binary"),
  };
  clients.forEach((client) =>
    client.write(`data: ${JSON.stringify(requestData)}\n\n`),
  );
  res
    .status(Number(mockConfig.statusCode))
    .set("Content-Type", mockConfig.contentType)
    .send(mockConfig.body);
});

app.listen(PORT, () => console.log(`[Ready] http://localhost:${PORT}`));
