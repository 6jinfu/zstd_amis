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
  type JsonRecord,
} from "./shared.js";

const root = document.querySelector<HTMLElement>("#app")!;
const app = createApp("关键岗位分析");
const toolName = "key-position-analysis";
const scene = "key_position_analysis";
const stepNames = ["创建项目", "分析范围", "选择视角", "视角配置", "生成"];

let step = 0;
let state: JsonRecord = {};
let uploadedFiles: JsonRecord[] = [];
let uploadMessage = "";

const artGroups = {
  思考: [["innovation", "创新"], ["decision", "决策"], ["problem", "问题"]],
  关系: [["collaboration", "协同"], ["team", "团队"], ["negotiation", "谈判"]],
  行动: [["technology", "技术"], ["environment", "环境"], ["professional", "专业"]],
};

function shell(content: string): string {
  return `<div class="shell">
    <header class="topbar"><div><div class="eyebrow">Talent Intelligence</div><h1>关键岗位分析</h1><p class="sub">从经济 E 与能力 A 视角识别关键岗位候选，最终标记由管理员确认。</p></div><span class="badge">建议态</span></header>
    <nav class="steps" style="--step-count:${stepNames.length}" aria-label="分析步骤">${stepNames.map((name, index) => `<div class="step ${index === step ? "active" : index < step ? "done" : ""}">${index + 1}. ${name}</div>`).join("")}</nav>
    <section class="panel"><form id="wizard-form">${content}<footer class="footer"><div class="footer-group"><button class="btn secondary" type="button" id="prev" ${step === 0 ? "disabled" : ""}>上一步</button><button class="btn ghost" type="button" id="save">保存当前配置</button></div><button class="btn primary" type="submit" id="next">${step === stepNames.length - 1 ? "开始分析" : "下一步"}</button></footer></form></section>
  </div>`;
}

function textInput(name: string, label: string, required = false, type = "text", attrs = ""): string {
  return `<div class="field"><label for="${name}">${label}${required ? ' <span class="req">*</span>' : ""}</label><input class="input" id="${name}" name="${name}" type="${type}" value="${escapeHtml(state[name])}" ${required ? "required" : ""} ${attrs} autocomplete="off" spellcheck="false"></div>`;
}

function textarea(name: string, label: string, required = false): string {
  return `<div class="field"><label for="${name}">${label}${required ? ' <span class="req">*</span>' : ""}</label><textarea class="input" id="${name}" name="${name}" ${required ? "required" : ""} spellcheck="false">${escapeHtml(state[name])}</textarea></div>`;
}

function checkRow(name: string, label: string): string {
  return `<label class="check-row"><input type="checkbox" name="${name}" ${state[name] ? "checked" : ""}><span>${label}</span></label>`;
}

function viewCard(name: string, title: string, desc: string, meta: string, disabled = false): string {
  return `<label class="choice-card"><input type="checkbox" name="${name}" ${state[name] ? "checked" : ""} ${disabled ? "disabled" : ""}><span><span class="choice-title">${title}</span><span class="choice-desc">${desc}</span><span class="choice-meta">${meta}</span></span></label>`;
}

function renderProject(): string {
  return `<div class="panel-body"><div class="section-head"><h2>创建分析项目</h2><p>关键岗位分析必须引用一个已生效的组织结构版本。</p></div>
    <div class="grid two">${textInput("project_name", "项目名称", true)}${textInput("org_version", "引用组织结构版本", true)}</div>
    <div style="margin-top:14px">${textarea("analysis_goal", "分析目标")}</div>
  </div>`;
}

function renderScope(): string {
  const files = uploadedFiles.map((file) => `<div class="file"><strong>${escapeHtml(file.name)}</strong><span>已上传</span></div>`).join("");
  return `<div class="panel-body"><div class="section-head"><h2>选择分析范围</h2><p>可以按岗位族分析，但所有关键候选都会下钻到具体岗位。</p></div>
    <div class="field"><label for="granularity">分析颗粒度</label><select class="input" id="granularity" name="granularity">${["岗位族", "具体岗位", "岗位族分析并标记到具体岗位"].map((item) => `<option ${state.granularity === item ? "selected" : ""}>${item}</option>`).join("")}</select></div>
    <div style="margin-top:14px">${textarea("scope_selection", "已选岗位族或具体岗位", true)}</div>
    <div class="section-title">岗位与供需材料</div>
    <div class="upload"><label for="material_files" class="label">选择本地文件</label><input id="material_files" type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md"><p class="hint">建议包含岗位职责、编制缺口、人才供给和培养周期数据。</p></div>
    ${uploadMessage ? `<p class="notice ${uploadMessage.startsWith("失败") ? "error" : ""}">${escapeHtml(uploadMessage)}</p>` : ""}<div class="file-list">${files}</div>
    <div style="margin-top:14px">${textarea("material_urls", "或者填写材料 URL（每行一个）")}</div>
  </div>`;
}

function renderViews(): string {
  return `<div class="panel-body"><div class="section-head"><h2>选择分析视角</h2><p>经济 E 和能力 A 可以单独执行，也可以按权重综合；至少选择一个。</p></div>
    <div class="cards">
      ${viewCard("view_economic", "经济 E", "需求 N × 供给 S：需求高且供给少。", "供需模型")}
      ${viewCard("view_ability", "能力 A", "ART 能力 × 培养时间成本。", "9 个变量")}
      ${viewCard("view_business", "业务 B", "价值链 × DID。", "即将上线", true)}
      ${viewCard("view_change", "变革 R", "3Cha 变革视角。", "即将上线", true)}
      ${viewCard("view_strategy", "战略 S", "战略解码视角。", "即将上线", true)}
    </div>
  </div>`;
}

function weightRow(name: string, label: string): string {
  const value = numberValue(state[name]);
  return `<div class="weight"><label for="${name}">${label}</label><input type="range" min="0" max="100" value="${value}" data-range="${name}"><input class="input" id="${name}" name="${name}" type="number" min="0" max="100" value="${value}"></div>`;
}

function renderConfig(): string {
  const artTotal = numberValue(state.weight_think) + numberValue(state.weight_relationship) + numberValue(state.weight_action);
  const viewTotal = (state.view_economic ? numberValue(state.weight_economic) : 0) + (state.view_ability ? numberValue(state.weight_ability) : 0);
  const artSections = Object.entries(artGroups).map(([group, variables]) => `<div><div class="section-title">${group}</div><div class="check-list">${variables.map(([id, label]) => checkRow(`art_${id}`, label)).join("")}</div></div>`).join("");
  return `<div class="panel-body"><div class="section-head"><h2>配置分析视角</h2><p>只会执行已选择的视角；禁用视角不会进入模型。</p></div>
    ${state.view_economic ? `<div class="section-title" style="margin-top:0">经济 E 数据来源</div>${textarea("economic_config", "需求与供给口径说明")}` : ""}
    ${state.view_ability ? `<div class="section-title">能力 A · ART 九变量</div><div class="grid three">${artSections}</div><div class="grid two" style="margin-top:18px"><div><div class="section-title" style="margin-top:0">ART 分组权重</div><div class="weights">${weightRow("weight_think", "思考")}${weightRow("weight_relationship", "关系")}${weightRow("weight_action", "行动")}<div class="sum ${artTotal === 100 ? "" : "invalid"}">权重和 <strong>${artTotal}%</strong></div></div></div><div>${textInput("key_threshold", "关键系数建议阈值（0～1）", true, "number", 'min="0" max="1" step="0.05"')}</div></div>` : ""}
    ${state.view_economic && state.view_ability ? `<div class="section-title">多视角综合权重</div><div class="weights">${weightRow("weight_economic", "经济 E")}${weightRow("weight_ability", "能力 A")}<div class="sum ${viewTotal === 100 ? "" : "invalid"}">权重和 <strong>${viewTotal}%</strong></div></div>` : ""}
  </div>`;
}

function materialCount(): number {
  return uploadedFiles.length + String(state.material_urls || "").split(/\n/).filter((url) => url.trim()).length;
}

function renderSummary(): string {
  const economicWeight = state.view_economic && !state.view_ability ? 100 : state.weight_economic;
  const abilityWeight = state.view_ability && !state.view_economic ? 100 : state.weight_ability;
  const views = [state.view_economic ? `经济 E（${economicWeight}%）` : "", state.view_ability ? `能力 A（${abilityWeight}%）` : ""].filter(Boolean).join(" + ");
  return `<div class="panel-body"><div class="section-head"><h2>确认并生成</h2><p>分析只生成关键岗位候选，不会自动修改业务系统中的关键标记。</p></div>
    <div class="summary"><div class="summary-row"><span>项目名称</span><strong>${escapeHtml(state.project_name)}</strong></div><div class="summary-row"><span>组织版本</span><strong>${escapeHtml(state.org_version)}</strong></div><div class="summary-row"><span>分析范围</span><strong>${escapeHtml(state.scope_selection)} · ${escapeHtml(state.granularity)}</strong></div><div class="summary-row"><span>说明材料</span><strong>${materialCount()} 个文件或链接</strong></div><div class="summary-row"><span>分析视角</span><strong>${escapeHtml(views)}</strong></div><div class="summary-row"><span>关键阈值</span><strong>关键系数 ≥ ${escapeHtml(state.key_threshold)}</strong></div></div>
  </div>`;
}

function render(): void {
  const pages = [renderProject, renderScope, renderViews, renderConfig, renderSummary];
  root.innerHTML = shell(pages[step]());
  bind();
}

function sync(form: HTMLFormElement): void {
  const data = new FormData(form);
  for (const [key, value] of data.entries()) state[key] = value;
  const checks = ["view_economic", "view_ability", ...Object.values(artGroups).flat().map(([id]) => `art_${id}`)];
  for (const name of checks) if (form.elements.namedItem(name)) state[name] = checked(form, name);
  for (const name of ["weight_think", "weight_relationship", "weight_action", "weight_economic", "weight_ability", "key_threshold"]) {
    if (form.elements.namedItem(name)) state[name] = numberValue(formValue(form, name), numberValue(state[name]));
  }
}

function validate(form: HTMLFormElement): boolean {
  if (!form.reportValidity()) return false;
  if (step === 1 && materialCount() === 0) {
    uploadMessage = "失败：请上传至少一个岗位材料，或填写一个材料 URL。";
    render();
    return false;
  }
  if (step === 2 && !state.view_economic && !state.view_ability) {
    window.alert("请至少选择经济 E 或能力 A 中的一个视角。");
    return false;
  }
  if (step === 3 && state.view_ability) {
    const artTotal = numberValue(state.weight_think) + numberValue(state.weight_relationship) + numberValue(state.weight_action);
    if (artTotal !== 100) { window.alert("ART 分组权重合计必须为 100%。"); return false; }
  }
  if (step === 3 && state.view_economic && state.view_ability) {
    const total = numberValue(state.weight_economic) + numberValue(state.weight_ability);
    if (total !== 100) { window.alert("多视角权重合计必须为 100%。"); return false; }
  }
  return true;
}

async function uploadFiles(input: HTMLInputElement): Promise<void> {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  uploadMessage = `正在上传 ${files.length} 个文件…`;
  render();
  try {
    for (const file of files) {
      const result = await app.callServerTool({ name: "upload-analysis-file", arguments: { scene, name: file.name, mimeType: file.type, base64: await fileToBase64(file) } });
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

function buildConfig(): JsonRecord {
  const config = { ...state };
  delete config.material_urls;
  const remoteFiles = String(state.material_urls || "").split(/\n/).map((url) => url.trim()).filter(Boolean).map((url) => ({ type: "document", transfer_method: "remote_url", url }));
  config.analysis_files = [...uploadedFiles.map((file) => file.dify_file), ...remoteFiles];
  config.weight_economic = state.view_economic ? (state.view_ability ? numberValue(state.weight_economic) : 100) : 0;
  config.weight_ability = state.view_ability ? (state.view_economic ? numberValue(state.weight_ability) : 100) : 0;
  return config;
}

async function analyze(button: HTMLButtonElement): Promise<void> {
  setButtonLoading(button, true, "开始分析");
  root.innerHTML = `<div class="shell"><section class="panel loading"><div><div class="spinner" aria-hidden="true"></div><h2>正在计算关键岗位候选</h2><p class="sub">AI 正在执行所选视角并核对证据与数据缺口。</p></div></section></div>`;
  try {
    const result = await app.callServerTool({ name: toolName, arguments: { action: "analyze", config: buildConfig() } });
    renderResult(readStructuredContent(result));
  } catch (error) {
    renderError(error instanceof Error ? error.message : "分析执行失败");
  }
}

function bind(): void {
  const form = document.querySelector<HTMLFormElement>("#wizard-form")!;
  document.querySelector<HTMLButtonElement>("#prev")?.addEventListener("click", () => { sync(form); step = Math.max(0, step - 1); render(); });
  document.querySelector<HTMLButtonElement>("#save")?.addEventListener("click", () => { sync(form); try { window.localStorage.setItem("talent-key-analysis-draft", JSON.stringify(state)); } catch { /* sandbox may disable storage */ } });
  form.addEventListener("submit", (event) => {
    event.preventDefault(); sync(form); if (!validate(form)) return;
    if (step < stepNames.length - 1) { step += 1; render(); return; }
    void analyze(document.querySelector<HTMLButtonElement>("#next")!);
  });
  document.querySelector<HTMLInputElement>("#material_files")?.addEventListener("change", (event) => void uploadFiles(event.currentTarget as HTMLInputElement));
  document.querySelectorAll<HTMLInputElement>("[data-range]").forEach((range) => range.addEventListener("input", () => { const target = document.querySelector<HTMLInputElement>(`#${range.dataset.range}`); if (target) target.value = range.value; }));
}

function renderResult(payload: JsonRecord): void {
  if (payload.status === "error") { renderError(String(payload.message || "分析执行失败")); return; }
  const result = asRecord(payload.result);
  const combined = asArray(result.combined_results);
  const economic = asArray(result.economic_results);
  const ability = asArray(result.ability_results);
  const calibrations = asArray(result.calibration_items);
  const source = combined.length ? combined : (economic.length ? economic : ability);
  const candidates = source.filter((item) => item.is_key_suggested === true || numberValue(item.key_coefficient) >= numberValue(state.key_threshold, .75));
  const cards = source.slice(0, 24).map((item) => `<article class="result-card"><h3>${escapeHtml(item.position_name || item.position || item.position_source_id || "岗位")}</h3><p>关键系数：${escapeHtml(item.key_coefficient ?? "—")} · 置信度：${escapeHtml(item.confidence ?? "—")}</p><p>${escapeHtml(Array.isArray(item.reasons) ? item.reasons.join("；") : item.reason || item.evidence || "等待人工核对")}</p></article>`).join("");
  root.innerHTML = `<div class="shell"><section class="panel"><div class="panel-body"><div class="result-head"><div><div class="eyebrow">Analysis complete</div><h2>关键岗位候选已生成</h2><p class="sub">建议结合证据和校准项后再确认关键标记。</p></div><button class="btn secondary" id="restart">重新配置</button></div>
    <div class="result-grid"><div class="metric"><div class="value">${source.length}</div><div class="label">已分析岗位</div></div><div class="metric"><div class="value">${candidates.length}</div><div class="label">关键候选</div></div><div class="metric"><div class="value">${calibrations.length}</div><div class="label">建议校准</div></div></div>
    ${cards ? `<div class="section-title">岗位分析卡片</div><div class="result-list">${cards}</div>` : '<div class="notice">结构化岗位结果为空，请参考下方分析说明。</div>'}
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
    try { stored = asRecord(JSON.parse(window.localStorage.getItem("talent-key-analysis-draft") || "{}")); } catch { /* sandbox may disable storage */ }
    state = { ...asRecord(payload.defaults), ...stored };
    render();
  } else if (payload.status === "completed") renderResult(payload);
  else if (payload.status === "error") renderError(String(payload.message || "加载失败"));
};

root.innerHTML = `<div class="shell"><section class="panel loading"><div><div class="spinner"></div><p class="sub">正在加载关键岗位分析…</p></div></section></div>`;
void app.connect();
