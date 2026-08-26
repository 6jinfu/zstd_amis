import { App } from "@modelcontextprotocol/ext-apps";
import "./styles.css";

export type JsonRecord = Record<string, unknown>;

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

export function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

export function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function readStructuredContent(result: unknown): JsonRecord {
  const record = asRecord(result);
  return asRecord(record.structuredContent);
}

export function createApp(name: string): App {
  return new App({ name, version: "1.0.0" });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("文件读取失败"));
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.readAsDataURL(file);
  });
}

export function splitNames(value: unknown): string[] {
  return String(value || "")
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function setButtonLoading(button: HTMLButtonElement, loading: boolean, label: string): void {
  button.disabled = loading;
  button.textContent = loading ? "处理中…" : label;
}

export function formValue(form: HTMLFormElement, name: string): FormDataEntryValue | null {
  return new FormData(form).get(name);
}

export function checked(form: HTMLFormElement, name: string): boolean {
  return new FormData(form).has(name);
}

export function valueList(form: HTMLFormElement, name: string): string[] {
  return new FormData(form).getAll(name).map(String);
}
