import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

type Scene = "organization_structure_analysis" | "key_position_analysis";
type JsonRecord = Record<string, unknown>;
type RunStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

type AnalysisRun = {
  runId: string;
  scene: Scene;
  status: RunStatus;
  progress: number;
  stage: string;
  createdAt: string;
  updatedAt: string;
  controller: AbortController;
  output?: JsonRecord;
  message?: string;
};

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const ORG_RESOURCE_URI = "ui://talent-analysis/organization-structure.html";
const KEY_RESOURCE_URI = "ui://talent-analysis/key-position.html";
const analysisRuns = new Map<string, AnalysisRun>();

const sceneConfig: Record<
  Scene,
  { appKey: () => string | undefined; toolName: string; resourceUri: string; title: string }
> = {
  organization_structure_analysis: {
    appKey: () => process.env.DIFY_ORG_APP_KEY,
    toolName: "organization-structure-analysis",
    resourceUri: ORG_RESOURCE_URI,
    title: "组织结构分析",
  },
  key_position_analysis: {
    appKey: () => process.env.DIFY_KEY_POSITION_APP_KEY,
    toolName: "key-position-analysis",
    resourceUri: KEY_RESOURCE_URI,
    title: "关键岗位分析",
  },
};

function defaultsFor(scene: Scene): JsonRecord {
  if (scene === "organization_structure_analysis") {
    return {
      project_name: "组织结构分析新版本",
      scope_mode: "指定部门与岗位",
      scope_selection: "研发中心、销售中心、职能中台",
      analysis_goal: "形成序列×层级岗位族矩阵草稿",
      method_job_evaluation: true,
      method_structure_analysis: true,
      method_structure_design: false,
      method_job_definition: false,
      method_efficiency: false,
      method_priority: "平等循证整合",
      dim_task: true,
      dim_power: true,
      dim_environment: true,
      dim_professional: true,
      dim_interpersonal: true,
      dim_thinking: true,
      weight_task: 18,
      weight_power: 22,
      weight_environment: 10,
      weight_professional: 20,
      weight_interpersonal: 12,
      weight_thinking: 18,
      structure_position: true,
      structure_people: true,
      structure_form: false,
      other_method_config: "",
      sequence_count: 3,
      level_count: 3,
      sequence_names: "研发、销售、职能",
      level_names: "基层、骨干、负责人",
      classify_mode: "AI 自动归类",
      analysis_files: [],
    };
  }

  return {
    project_name: "年度关键岗位分析",
    analysis_goal: "识别需要优先培养和配置的关键岗位",
    org_version: "V2 · 当前生效组织结构",
    granularity: "岗位族分析并标记到具体岗位",
    scope_selection: "研发序列、销售序列",
    view_economic: true,
    view_ability: true,
    economic_config: "需求：编制、缺口与业务权重；供给：内部与市场人才供给",
    art_innovation: true,
    art_decision: true,
    art_problem: true,
    art_collaboration: true,
    art_team: true,
    art_negotiation: false,
    art_technology: true,
    art_environment: false,
    art_professional: true,
    weight_think: 40,
    weight_relationship: 35,
    weight_action: 25,
    weight_economic: 50,
    weight_ability: 50,
    key_threshold: 0.75,
    analysis_files: [],
  };
}

function extractResult(answer: string): JsonRecord | null {
  const match = answer.match(/<!--\s*RESULT_JSON\s*([\s\S]*?)-->/i);
  if (!match) return null;
  const candidate = match[1].trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const parsed: unknown = JSON.parse(candidate);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonRecord)
      : { value: parsed };
  } catch {
    return { parse_error: true, raw: candidate };
  }
}

function visibleAnswer(answer: string): string {
  return answer.replace(/<!--\s*RESULT_JSON[\s\S]*?-->/gi, "").trim();
}

function apiBase(): string {
  return (process.env.DIFY_BASE_URL || "https://api.dify.ai").replace(/\/$/, "");
}

function requireAppKey(scene: Scene): string {
  const appKey = sceneConfig[scene].appKey();
  if (!appKey) {
    throw new Error(
      scene === "organization_structure_analysis"
        ? "服务端尚未配置 DIFY_ORG_APP_KEY"
        : "服务端尚未配置 DIFY_KEY_POSITION_APP_KEY",
    );
  }
  return appKey;
}

async function runDify(
  scene: Scene,
  config: JsonRecord,
  signal?: AbortSignal,
): Promise<JsonRecord> {
  const appKey = requireAppKey(scene);

  const response = await fetch(`${apiBase()}/v1/chat-messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: config,
      query: "请按已提交的配置和材料开始分析。",
      response_mode: "blocking",
      user: `mcp-app:${scene}`,
    }),
    signal,
  });

  const payload = (await response.json()) as JsonRecord;
  if (!response.ok) {
    const message = typeof payload.message === "string" ? payload.message : response.statusText;
    throw new Error(`Dify 调用失败：${message}`);
  }

  const answer = typeof payload.answer === "string" ? payload.answer : "";
  return {
    answer: visibleAnswer(answer),
    result: extractResult(answer),
    conversation_id: payload.conversation_id,
    message_id: payload.message_id,
  };
}

function runPayload(run: AnalysisRun): JsonRecord {
  return {
    status: run.status,
    scene: run.scene,
    run_id: run.runId,
    progress: run.progress,
    stage: run.stage,
    result_available: run.status === "succeeded",
    created_at: run.createdAt,
    updated_at: run.updatedAt,
    ...(run.message ? { message: run.message } : {}),
  };
}

function getRun(scene: Scene, runId: string | undefined): AnalysisRun {
  if (!runId) throw new Error("缺少 run_id");
  const run = analysisRuns.get(runId);
  if (!run || run.scene !== scene) throw new Error("分析任务不存在或已失效");
  return run;
}

async function executeAnalysis(run: AnalysisRun, config: JsonRecord): Promise<void> {
  if (run.controller.signal.aborted) return;
  run.status = "running";
  run.progress = 15;
  run.stage = "AI 分析中";
  run.updatedAt = new Date().toISOString();
  try {
    run.output = await runDify(run.scene, config, run.controller.signal);
    if (run.controller.signal.aborted) return;
    run.status = "succeeded";
    run.progress = 100;
    run.stage = "分析完成";
  } catch (error) {
    if (run.controller.signal.aborted) {
      run.status = "cancelled";
      run.stage = "已取消";
      run.message = "分析任务已取消";
    } else {
      run.status = "failed";
      run.stage = "分析失败";
      run.message = error instanceof Error ? error.message : "分析执行失败";
    }
  } finally {
    run.updatedAt = new Date().toISOString();
  }
}

function startAnalysis(scene: Scene, config: JsonRecord): AnalysisRun {
  requireAppKey(scene);
  const now = new Date().toISOString();
  const run: AnalysisRun = {
    runId: randomUUID(),
    scene,
    status: "queued",
    progress: 0,
    stage: "等待执行",
    createdAt: now,
    updatedAt: now,
    controller: new AbortController(),
  };
  analysisRuns.set(run.runId, run);
  setTimeout(() => void executeAnalysis(run, config), 0);
  return run;
}

async function uploadToDify(
  scene: Scene,
  name: string,
  mimeType: string,
  base64: string,
): Promise<JsonRecord> {
  const appKey = sceneConfig[scene].appKey();
  if (!appKey) throw new Error("对应 Dify 应用密钥尚未配置");

  const bytes = Buffer.from(base64, "base64");
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeType || "application/octet-stream" }), name);
  form.append("user", `mcp-app:${scene}`);

  const response = await fetch(`${apiBase()}/v1/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${appKey}` },
    body: form,
  });
  const payload = (await response.json()) as JsonRecord;
  if (!response.ok) {
    const message = typeof payload.message === "string" ? payload.message : response.statusText;
    throw new Error(`文件上传失败：${message}`);
  }

  return {
    id: payload.id,
    name: payload.name || name,
    size: payload.size || bytes.byteLength,
    dify_file: {
      type: "document",
      transfer_method: "local_file",
      upload_file_id: payload.id,
    },
  };
}

function toolResult(scene: Scene, data: JsonRecord) {
  const title = sceneConfig[scene].title;
  const messages: Record<string, string> = {
    queued: `${title}任务已提交，将在后台执行。`,
    running: `${title}正在后台执行。`,
    succeeded: `${title}已完成，可以查看结果。`,
    completed: `${title}已完成。请在交互界面中查看结果并进行人工校准。`,
    failed: `${title}执行失败。`,
    cancelled: `${title}任务已取消。`,
  };
  const text = messages[String(data.status)] || `请在交互界面中完成${title}配置。`;
  return { content: [{ type: "text" as const, text }], structuredContent: data };
}

function registerAnalysisTool(server: McpServer, scene: Scene): void {
  const spec = sceneConfig[scene];
  registerAppTool(
    server,
    spec.toolName,
    {
      title: spec.title,
      description: `打开${spec.title}交互配置；提交后创建后台任务，并支持查询进度、获取结果和取消任务。`,
      inputSchema: {
        action: z.enum(["open", "analyze", "status", "result", "cancel"]).optional(),
        config: z.record(z.string(), z.unknown()).optional(),
        run_id: z.string().optional(),
      },
      _meta: { ui: { resourceUri: spec.resourceUri } },
    },
    async ({ action = "open", config = {}, run_id }) => {
      try {
        if (action === "analyze") {
          return toolResult(scene, runPayload(startAnalysis(scene, config)));
        }
        if (action === "status") {
          return toolResult(scene, runPayload(getRun(scene, run_id)));
        }
        if (action === "result") {
          const run = getRun(scene, run_id);
          if (run.status !== "succeeded" || !run.output) {
            return toolResult(scene, runPayload(run));
          }
          return toolResult(scene, {
            status: "completed",
            scene,
            run_id: run.runId,
            ...run.output,
          });
        }
        if (action === "cancel") {
          const run = getRun(scene, run_id);
          if (run.status === "queued" || run.status === "running") {
            run.controller.abort();
            run.status = "cancelled";
            run.stage = "已取消";
            run.message = "分析任务已取消";
            run.updatedAt = new Date().toISOString();
          }
          return toolResult(scene, runPayload(run));
        }
        return toolResult(scene, {
          status: "configure",
          scene,
          defaults: defaultsFor(scene),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "分析执行失败";
        return {
          isError: true,
          content: [{ type: "text" as const, text: message }],
          structuredContent: { status: "error", scene, message },
        };
      }
    },
  );
}

async function registerUiResource(
  server: McpServer,
  resourceUri: string,
  fileName: string,
): Promise<void> {
  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [
        {
          uri: resourceUri,
          mimeType: RESOURCE_MIME_TYPE,
          text: await readFile(path.join(ROOT, "dist", fileName), "utf8"),
        },
      ],
    }),
  );
}

export async function createServer(): Promise<McpServer> {
  const server = new McpServer({ name: "人才发展分析 MCP Apps", version: "1.0.0" });

  registerAnalysisTool(server, "organization_structure_analysis");
  registerAnalysisTool(server, "key_position_analysis");

  server.registerTool(
    "upload-analysis-file",
    {
      title: "上传分析材料",
      description: "将用户在 MCP App 中选择的分析材料上传到对应的 Dify 应用。",
      inputSchema: {
        scene: z.enum(["organization_structure_analysis", "key_position_analysis"]),
        name: z.string().min(1),
        mimeType: z.string().optional(),
        base64: z.string().min(1),
      },
    },
    async ({ scene, name, mimeType = "application/octet-stream", base64 }) => {
      try {
        const uploaded = await uploadToDify(scene, name, mimeType, base64);
        return {
          content: [{ type: "text" as const, text: `${name} 上传完成` }],
          structuredContent: uploaded,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "文件上传失败";
        return { isError: true, content: [{ type: "text" as const, text: message }] };
      }
    },
  );

  await registerUiResource(server, ORG_RESOURCE_URI, "org-analysis.html");
  await registerUiResource(server, KEY_RESOURCE_URI, "key-position-analysis.html");
  return server;
}
