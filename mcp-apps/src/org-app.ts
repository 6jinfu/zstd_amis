import {
  asArray,
  asRecord,
  checked,
  createApp,
  escapeHtml,
  fileToBase64,
  formValue,
  numberValue,
  readStructuredContent,
  setButtonLoading,
  splitNames,
  type JsonRecord,
} from "./shared.js";

const root = document.querySelector<HTMLElement>("#app")!;
const app = createApp("组织结构分析");
const toolName = "organization-structure-analysis";
const scene = "organization_structure_analysis";
const stepNames = ["组织范围", "说明材料", "分析方法", "维度配置", "宫格设置", "生成"];

let step = 0;
let state: JsonRecord = {};
let uploadedFiles: JsonRecord[] = [];
let uploadMessage = "";
let activeRunId = "";
let pollTimer: number | undefined;

function shell(content: string, footer = ""): string {
  return `<div class="shell">
    <header class="topbar">
      <div><div class="eyebrow">Talent Intelligence</div><h1>组织结构分析</h1><p class="sub">配置分析范围与方法，生成序列 × 层级岗位族矩阵草稿。</p></div>
      <span class="badge">AI 建议 · 人工确认</span>
    </header>
    <nav class="steps" style="--step-count:${stepNames.length}" aria-label="分析步骤">
      ${stepNames.map((name, index) => `<div class="step ${index === step ? "active" : index < step ? "done" : ""}">${index + 1}. ${name}</div>`).join("")}
    </nav>
    <section class="panel"><form id="wizard-form">${content}${footer}</form></section>
  </div>`;
}

function textInput(name: string, label: string, required = false, type = "text"): string {
  return `<div class="field"><label for="${name}">${label}${required ? ' <span class="req">*</span>' : ""}</label><input class="input" id="${name}" name="${name}" type="${type}" value="${escapeHtml(state[name])}" ${required ? "required" : ""} autocomplete="off" spellcheck="false"></div>`;
}

function textarea(name: string, label: string, required = false): string {
  return `<div class="field"><label for="${name}">${label}${required ? ' <span class="req">*</span>' : ""}</label><textarea class="input" id="${name}" name="${name}" ${required ? "required" : ""} spellcheck="false">${escapeHtml(state[name])}</textarea></div>`;
}

function checkbox(name: string, label: string): string {
  return `<label class="check-row"><input type="checkbox" name="${name}" ${state[name] ? "checked" : ""}><span>${label}</span></label>`;
}

function card(name: string, title: string, desc: string, meta: string): string {
  return `<label class="choice-card"><input type="checkbox" name="${name}" ${state[name] ? "checked" : ""}><span><span class="choice-title">${title}</span><span class="choice-desc">${desc}</span><span class="choice-meta">${meta}</span></span></label>`;
}

function footer(final = false): string {
  return `<footer class="footer"><div class="footer-group"><button class="btn secondary" type="button" id="prev" ${step === 0 ? "disabled" : ""}>上一步</button><button class="btn ghost" type="button" id="save">保存当前配置</button></div><button class="btn primary" type="submit" id="next">${final ? "提交分析" : "下一步"}</button></footer>`;
}

function renderScope(): string {
  return `<div class="panel-body"><div class="section-head"><h2>选择组织范围</h2><p>可使用部门、岗位族或岗位名称，也可以填写业务系统中的 ID。</p></div>
    <div class="grid two">${textInput("project_name", "版本名称", true)}
      <div class="field"><label for="scope_mode">范围方式 <span class="req">*</span></label><select class="input" id="scope_mode" name="scope_mode">
        ${["全公司", "指定部门", "指定岗位或岗位族", "指定部门与岗位"].map((item) => `<option ${state.scope_mode === item ? "selected" : ""}>${item}</option>`).join("")}
      </select></div></div>
    <div style="margin-top:14px">${textarea("scope_selection", "已选部门与岗位", true)}</div>
    <div style="margin-top:14px">${textarea("analysis_goal", "分析目标或版本说明")}</div>
  </div>`;
}

function renderMaterials(): string {
  const files = uploadedFiles.map((file) => `<div class="file"><strong>${escapeHtml(file.name)}</strong><span>已上传</span></div>`).join("");
  return `<div class="panel-body"><div class="section-head"><h2>添加说明材料</h2><p>支持岗位说明书、组织架构、编制及人岗数据。文件会先上传到对应的 Dify 应用。</p></div>
    <div class="upload"><label for="material_files" class="label">选择本地文件</label><input id="material_files" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md"><p class="hint">单个文件建议不超过 20 MB；上传动作可能触发宿主授权确认。</p></div>
    ${uploadMessage ? `<p class="notice ${uploadMessage.startsWith("失败") ? "error" : ""}">${escapeHtml(uploadMessage)}</p>` : ""}
    <div class="file-list">${files}</div>
    <div class="section-title">或者使用材料链接</div>
    ${textarea("material_urls", "每行一个可访问文件 URL")}
  </div>`;
}

function renderMethods(): string {
  return `<div class="panel-body"><div class="section-head"><h2>选择分析方法</h2><p>至少选择一种。多种方法结论冲突时会保留差异并进入人工校准。</p></div>
    <div class="cards">
      ${card("method_job_evaluation", "岗位评价法", "职责与能力，24 个指标、5 级锚定。", "定层级主力")}
      ${card("method_structure_analysis", "结构分析法", "核心度、岗位等级和职能位置。", "3 个指标组")}
      ${card("method_structure_design", "结构设计法", "纵向分权与横向分工。", "4 维度 8 变量")}
      ${card("method_job_definition", "岗位定义法", "从结果责任到过程任务。", "责—任模型")}
      ${card("method_efficiency", "人效分析法", "宏观、中观、微观三层人效。", "人 × 钱 × 存量")}
    </div>
    <div class="field" style="margin-top:16px"><label for="method_priority">多方法整合优先级</label><select class="input" id="method_priority" name="method_priority">
      ${["平等循证整合", "岗位评价法优先", "结构分析法优先", "组织形态优先"].map((item) => `<option ${state.method_priority === item ? "selected" : ""}>${item}</option>`).join("")}
    </select></div>
  </div>`;
}

const dimensions = [
  ["task", "任务"], ["power", "权力"], ["environment", "环境"],
  ["professional", "专业"], ["interpersonal", "人际"], ["thinking", "思维"],
];

function renderDimensions(): string {
  const total = dimensions.reduce((sum, [id]) => sum + numberValue(state[`weight_${id}`]), 0);
  return `<div class="panel-body"><div class="section-head"><h2>配置维度与权重</h2><p>只有启用岗位评价法时使用以下六类维度；权重合计应为 100%。</p></div>
    <div class="grid two"><div><div class="section-title" style="margin-top:0">岗位评价维度</div><div class="check-list">${dimensions.map(([id, label]) => checkbox(`dim_${id}`, label)).join("")}</div></div>
    <div><div class="section-title" style="margin-top:0">维度权重</div><div class="weights">
      ${dimensions.map(([id, label]) => `<div class="weight"><label for="weight_${id}">${label}</label><input type="range" min="0" max="100" value="${numberValue(state[`weight_${id}`])}" data-range="weight_${id}"><input class="input" id="weight_${id}" name="weight_${id}" type="number" min="0" max="100" value="${numberValue(state[`weight_${id}`])}"></div>`).join("")}
      <div class="sum ${total === 100 ? "" : "invalid"}" id="weight-sum">权重和 <strong>${total}%</strong></div>
    </div></div></div>
    <div class="section-title">结构分析指标组</div><div class="check-list">${checkbox("structure_position", "岗位配置：人数、岗位数、人岗比、空岗率")}${checkbox("structure_people", "人力资源：年龄、年限、学历、绩效、薪酬")}${checkbox("structure_form", "组织形态：分工、分权、分配、发展")}</div>
    <div style="margin-top:14px">${textarea("other_method_config", "其他方法的指标补充")}</div>
  </div>`;
}

function renderGrid(): string {
  const seq = Math.min(6, Math.max(2, numberValue(state.sequence_count, 3)));
  const lvl = Math.min(6, Math.max(2, numberValue(state.level_count, 3)));
  const sequenceNames = splitNames(state.sequence_names);
  const levelNames = splitNames(state.level_names);
  const cells = Array.from({ length: seq * lvl }, (_, index) => {
    const row = Math.floor(index / seq);
    const col = index % seq;
    return `<div class="matrix-cell"><strong>${escapeHtml(levelNames[row] || `层级 ${row + 1}`)}</strong>${escapeHtml(sequenceNames[col] || `序列 ${col + 1}`)}</div>`;
  }).join("");
  return `<div class="panel-body"><div class="section-head"><h2>设置岗位族宫格</h2><p>设置横向序列与纵向层级，AI 只能在该宫格规格内提出归类建议。</p></div>
    <div class="grid two"><div class="grid two">${textInput("sequence_count", "序列数（2～6）", true, "number")}${textInput("level_count", "层级数（2～6）", true, "number")}${textarea("sequence_names", "序列名称")}${textarea("level_names", "层级名称")}
      <div class="field"><label for="classify_mode">归类模式</label><select class="input" id="classify_mode" name="classify_mode"><option ${state.classify_mode === "AI 自动归类" ? "selected" : ""}>AI 自动归类</option><option ${state.classify_mode === "纯手动" ? "selected" : ""}>纯手动</option></select></div>
    </div><div><div class="section-title" style="margin-top:0">${seq} 序列 × ${lvl} 层级</div><div class="matrix" style="grid-template-columns:repeat(${seq},minmax(0,1fr))">${cells}</div></div></div>
  </div>`;
}

function materialCount(): number {
  return uploadedFiles.length + String(state.material_urls || "").split(/\n/).filter((url) => url.trim()).length;
}

function renderSummary(): string {
  const methods = [
    ["method_job_evaluation", "岗位评价法"], ["method_structure_analysis", "结构分析法"],
    ["method_structure_design", "结构设计法"], ["method_job_definition", "岗位定义法"], ["method_efficiency", "人效分析法"],
  ].filter(([id]) => state[id]).map(([, label]) => label).join("、");
  return `<div class="panel-body"><div class="section-head"><h2>确认并生成</h2><p>本次生成的是分析草稿，不会直接替换当前生效版本。</p></div>
    <div class="summary">
      <div class="summary-row"><span>版本名称</span><strong>${escapeHtml(state.project_name)}</strong></div>
      <div class="summary-row"><span>组织范围</span><strong>${escapeHtml(state.scope_selection)}</strong></div>
      <div class="summary-row"><span>说明材料</span><strong>${materialCount()} 个文件或链接</strong></div>
      <div class="summary-row"><span>分析方法</span><strong>${escapeHtml(methods)}</strong></div>
      <div class="summary-row"><span>宫格规格</span><strong>${numberValue(state.sequence_count)} 序列 × ${numberValue(state.level_count)} 层级 · ${escapeHtml(state.classify_mode)}</strong></div>
    </div>
  </div>`;
}

function render(): void {
  clearPollTimer();
  const views = [renderScope, renderMaterials, renderMethods, renderDimensions, renderGrid, renderSummary];
  root.innerHTML = shell(views[step](), footer(step === stepNames.length - 1));
  bind();
}

function sync(form: HTMLFormElement): void {
  const data = new FormData(form);
  for (const [key, value] of data.entries()) state[key] = value;
  const checkboxes = [
    "method_job_evaluation", "method_structure_analysis", "method_structure_design", "method_job_definition", "method_efficiency",
    ...dimensions.map(([id]) => `dim_${id}`), "structure_position", "structure_people", "structure_form",
  ];
  for (const name of checkboxes) if (form.elements.namedItem(name)) state[name] = checked(form, name);
  for (const name of ["sequence_count", "level_count", ...dimensions.map(([id]) => `weight_${id}`)]) {
    if (form.elements.namedItem(name)) state[name] = numberValue(formValue(form, name), numberValue(state[name]));
  }
}

function validateStep(form: HTMLFormElement): boolean {
  if (!form.reportValidity()) return false;
  if (step === 1 && materialCount() === 0) {
    uploadMessage = "失败：请上传至少一个文件，或填写一个材料 URL。";
    render();
    return false;
  }
  if (step === 2) {
    const selected = ["method_job_evaluation", "method_structure_analysis", "method_structure_design", "method_job_definition", "method_efficiency"].some((name) => Boolean(state[name]));
    if (!selected) {
      window.alert("请至少选择一种分析方法。");
      return false;
    }
  }
  if (step === 3 && state.method_job_evaluation) {
    const total = dimensions.reduce((sum, [id]) => sum + numberValue(state[`weight_${id}`]), 0);
    if (total !== 100) {
      window.alert("岗位评价维度权重合计必须为 100%。");
      return false;
    }
  }
  return true;
}

async function uploadSelectedFiles(input: HTMLInputElement): Promise<void> {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  input.disabled = true;
  uploadMessage = `正在上传 ${files.length} 个文件…`;
  render();
  try {
    for (const file of files) {
      const result = await app.callServerTool({
        name: "upload-analysis-file",
        arguments: { scene, name: file.name, mimeType: file.type, base64: await fileToBase64(file) },
      });
      const uploaded = readStructuredContent(result);
      if (!uploaded.id) throw new Error("未获得文件 ID");
      uploadedFiles.push(uploaded);
    }
    uploadMessage = `已上传 ${files.length} 个文件。`;
  } catch (error) {
    uploadMessage = `失败：${error instanceof Error ? error.message : "文件上传失败"}`;
  }
  render();
}

function buildDifyConfig(): JsonRecord {
  const config = { ...state };
  delete config.material_urls;
  const remoteFiles = String(state.material_urls || "").split(/\n/).map((url) => url.trim()).filter(Boolean).map((url) => ({ type: "document", transfer_method: "remote_url", url }));
  config.analysis_files = [...uploadedFiles.map((file) => file.dify_file), ...remoteFiles];
  return config;
}

async function analyze(button: HTMLButtonElement): Promise<void> {
  setButtonLoading(button, true, "正在提交");
  try {
    const result = await app.callServerTool({ name: toolName, arguments: { action: "analyze", config: buildDifyConfig() } });
    renderProgress(readStructuredContent(result));
  } catch (error) {
    renderError(error instanceof Error ? error.message : "分析执行失败");
  }
}

function clearPollTimer(): void {
  if (pollTimer !== undefined) window.clearTimeout(pollTimer);
  pollTimer = undefined;
}

function rememberRun(runId: string): void {
  activeRunId = runId;
  try { window.localStorage.setItem("talent-org-analysis-active-run", runId); } catch { /* sandbox may disable storage */ }
}

function clearRun(): void {
  clearPollTimer();
  activeRunId = "";
  try { window.localStorage.removeItem("talent-org-analysis-active-run"); } catch { /* sandbox may disable storage */ }
}

function schedulePoll(): void {
  clearPollTimer();
  pollTimer = window.setTimeout(() => void refreshRun(), document.hidden ? 8000 : 2000);
}

function renderProgress(payload: JsonRecord): void {
  const runId = String(payload.run_id || activeRunId);
  if (!runId) { renderError("未获得分析任务 ID"); return; }
  rememberRun(runId);
  const progress = Math.min(100, Math.max(0, numberValue(payload.progress)));
  const queued = payload.status === "queued";
  root.innerHTML = `<div class="shell"><section class="panel"><div class="panel-body run-panel">
    <div class="eyebrow">Background analysis</div><h2>${queued ? "分析任务已提交" : "组织结构分析正在后台运行"}</h2>
    <p class="sub">耗时分析已转为后台任务。你可以离开或刷新页面，稍后仍可继续查看进度。</p>
    <div class="run-meta"><span class="badge">${escapeHtml(queued ? "排队中" : "分析中")}</span><span>${escapeHtml(payload.stage || "等待执行")}</span><strong>${progress}%</strong></div>
    <div class="run-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><i style="width:${progress}%"></i></div>
    <div class="run-actions"><button class="btn secondary" id="refresh-run">刷新进度</button><button class="btn ghost" id="cancel-run">取消任务</button></div>
  </div></section></div>`;
  document.querySelector<HTMLButtonElement>("#refresh-run")?.addEventListener("click", () => void refreshRun());
  document.querySelector<HTMLButtonElement>("#cancel-run")?.addEventListener("click", () => void cancelRun());
  schedulePoll();
}

async function refreshRun(): Promise<void> {
  if (!activeRunId) return;
  clearPollTimer();
  try {
    const response = await app.callServerTool({ name: toolName, arguments: { action: "status", run_id: activeRunId } });
    const payload = readStructuredContent(response);
    if (payload.status === "succeeded") {
      const result = await app.callServerTool({ name: toolName, arguments: { action: "result", run_id: activeRunId } });
      renderResult(readStructuredContent(result));
    } else if (payload.status === "failed" || payload.status === "cancelled") {
      clearRun();
      renderError(String(payload.message || (payload.status === "cancelled" ? "分析任务已取消" : "分析执行失败")));
    } else {
      renderProgress(payload);
    }
  } catch (error) {
    renderRunError(error instanceof Error ? error.message : "进度查询失败");
  }
}

async function cancelRun(): Promise<void> {
  if (!activeRunId) return;
  clearPollTimer();
  try {
    const response = await app.callServerTool({ name: toolName, arguments: { action: "cancel", run_id: activeRunId } });
    const payload = readStructuredContent(response);
    clearRun();
    renderError(String(payload.message || "分析任务已取消"));
  } catch (error) {
    renderRunError(error instanceof Error ? error.message : "取消任务失败");
  }
}

function renderRunError(message: string): void {
  clearPollTimer();
  root.innerHTML = `<div class="shell"><section class="panel"><div class="panel-body"><div class="notice error">${escapeHtml(message)}</div><p class="sub" style="margin-top:10px">任务仍在后台运行，可以重试查询。</p><div class="run-actions"><button class="btn primary" id="retry-run">重试查询</button><button class="btn secondary" id="back">返回配置</button></div></div></section></div>`;
  document.querySelector<HTMLButtonElement>("#retry-run")?.addEventListener("click", () => void refreshRun());
  document.querySelector<HTMLButtonElement>("#back")?.addEventListener("click", render);
}

function bind(): void {
  const form = document.querySelector<HTMLFormElement>("#wizard-form")!;
  document.querySelector<HTMLButtonElement>("#prev")?.addEventListener("click", () => { sync(form); step = Math.max(0, step - 1); render(); });
  document.querySelector<HTMLButtonElement>("#save")?.addEventListener("click", () => {
    sync(form);
    try { window.localStorage.setItem("talent-org-analysis-draft", JSON.stringify(state)); } catch { /* sandbox may disable storage */ }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sync(form);
    if (!validateStep(form)) return;
    if (step < stepNames.length - 1) { step += 1; render(); return; }
    void analyze(document.querySelector<HTMLButtonElement>("#next")!);
  });
  document.querySelector<HTMLInputElement>("#material_files")?.addEventListener("change", (event) => void uploadSelectedFiles(event.currentTarget as HTMLInputElement));
  document.querySelectorAll<HTMLInputElement>("[data-range]").forEach((range) => range.addEventListener("input", () => {
    const target = document.querySelector<HTMLInputElement>(`#${range.dataset.range}`);
    if (target) target.value = range.value;
  }));
  if (step === 4) form.addEventListener("change", () => { sync(form); render(); });
}

function renderResult(payload: JsonRecord): void {
  clearRun();
  if (payload.status === "error") { renderError(String(payload.message || "分析执行失败")); return; }
  const result = asRecord(payload.result);
  const groups = asArray(result.groups);
  const unassigned = asArray(result.unassigned_positions);
  const calibrations = asArray(result.calibration_items);
  const groupCards = groups.slice(0, 18).map((group) => `<article class="result-card"><h3>${escapeHtml(group.group_name || group.name || group.group_code || "岗位族")}</h3><p>${escapeHtml(group.sequence_name || group.sequence_code || "")} · ${escapeHtml(group.level_name || group.level_code || "")}</p><p>岗位：${escapeHtml(Array.isArray(group.positions) ? group.positions.join("、") : group.position_count || "待确认")}</p></article>`).join("");
  root.innerHTML = `<div class="shell"><section class="panel"><div class="panel-body">
    <div class="result-head"><div><div class="eyebrow">Analysis complete</div><h2>组织结构草稿已生成</h2><p class="sub">请重点检查冲突岗位和待人工归类项。</p></div><button class="btn secondary" id="restart">重新配置</button></div>
    <div class="result-grid"><div class="metric"><div class="value">${groups.length}</div><div class="label">岗位族建议</div></div><div class="metric"><div class="value">${unassigned.length}</div><div class="label">待人工归类</div></div><div class="metric"><div class="value">${calibrations.length}</div><div class="label">建议校准</div></div></div>
    ${groupCards ? `<div class="section-title">岗位族矩阵结果</div><div class="result-list">${groupCards}</div>` : '<div class="notice">结构化结果为空，请参考下方分析说明。</div>'}
    ${payload.answer ? `<div class="section-title">分析说明</div><div class="answer">${escapeHtml(payload.answer)}</div>` : ""}
  </div></section></div>`;
  document.querySelector<HTMLButtonElement>("#restart")?.addEventListener("click", () => { step = 0; render(); });
}

function renderError(message: string): void {
  root.innerHTML = `<div class="shell"><section class="panel"><div class="panel-body"><div class="notice error">${escapeHtml(message)}</div><button class="btn secondary" id="back" style="margin-top:14px">返回配置</button></div></section></div>`;
  document.querySelector<HTMLButtonElement>("#back")?.addEventListener("click", render);
}

app.ontoolresult = (result) => {
  const payload = readStructuredContent(result);
  if (payload.status === "configure") {
    let stored: JsonRecord = {};
    try { stored = asRecord(JSON.parse(window.localStorage.getItem("talent-org-analysis-draft") || "{}")); } catch { /* sandbox may disable storage */ }
    state = { ...asRecord(payload.defaults), ...stored };
    try { activeRunId = window.localStorage.getItem("talent-org-analysis-active-run") || ""; } catch { /* sandbox may disable storage */ }
    if (activeRunId) void refreshRun(); else render();
  } else if (payload.status === "queued" || payload.status === "running") {
    renderProgress(payload);
  } else if (payload.status === "succeeded" && payload.run_id) {
    rememberRun(String(payload.run_id));
    void refreshRun();
  } else if (payload.status === "completed") {
    renderResult(payload);
  } else if (payload.status === "error") {
    renderError(String(payload.message || "加载失败"));
  }
};

root.innerHTML = `<div class="shell"><section class="panel loading"><div><div class="spinner"></div><p class="sub">正在加载组织结构分析…</p></div></section></div>`;
void app.connect();
