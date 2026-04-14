if (typeof globalThis.global === "undefined") {
  globalThis.global = globalThis;
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/public.css";
import "./styles/landing.css";
import "./styles/console.css";
import "./styles/chat.css";
import "./styles/responsive.css";
import "./styles/transport-status.css";

function loadKakaoMapScript() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      'script[data-kakao-map="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (!window.kakao || !window.kakao.maps) {
          reject(new Error("카카오 지도 SDK가 로드되지 않았습니다."));
          return;
        }

        window.kakao.maps.load(() => {
          if (!window.kakao.maps.services) {
            reject(
              new Error(
                "카카오 지도 services 라이브러리가 로드되지 않았습니다.",
              ),
            );
            return;
          }

          resolve();
        });
      });

      existingScript.addEventListener("error", () => {
        reject(new Error("카카오 지도 스크립트 로드 실패"));
      });

      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_APP_KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.dataset.kakaoMap = "true";

    script.onload = () => {
      if (!window.kakao || !window.kakao.maps) {
        reject(new Error("카카오 지도 SDK가 로드되지 않았습니다."));
        return;
      }

      window.kakao.maps.load(() => {
        if (!window.kakao.maps.services) {
          reject(
            new Error("카카오 지도 services 라이브러리가 로드되지 않았습니다."),
          );
          return;
        }

        resolve();
      });
    };

    script.onerror = () => {
      reject(new Error("카카오 지도 스크립트 로드 실패"));
    };

    document.head.appendChild(script);
  });
}

async function bootstrap() {
  try {
    await loadKakaoMapScript();
    console.log("카카오 지도 SDK 로드 완료");
  } catch (error) {
    console.error("카카오 지도 SDK 초기화 실패:", error);
  }

  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
