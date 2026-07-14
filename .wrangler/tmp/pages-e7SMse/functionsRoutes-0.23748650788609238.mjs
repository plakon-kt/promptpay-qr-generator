import { onRequestGet as __api_generate_ts_onRequestGet } from "E:\\ItsMe\\promptpay-qr-generator\\functions\\api\\generate.ts"
import { onRequestPost as __api_generate_ts_onRequestPost } from "E:\\ItsMe\\promptpay-qr-generator\\functions\\api\\generate.ts"

export const routes = [
    {
      routePath: "/api/generate",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_generate_ts_onRequestGet],
    },
  {
      routePath: "/api/generate",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_ts_onRequestPost],
    },
  ]