#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const flowDir = path.join(root, "deliverables", "drawio-flowcharts");
const files = [
  "00-overall.drawio",
  "01-standard.drawio",
  "02-assessment.drawio",
  "03-review.drawio",
  "04-development.drawio",
  "05-talent.drawio",
  "06-settings.drawio",
];

const START_X = 80;
const START_Y = 80;
const COLUMN_GAP = 100;
const ROW_GAP = 110;
const X_CLUSTER_TOLERANCE = 70;
const Y_CLUSTER_TOLERANCE = 45;
const PAGE_PADDING = 120;
const MAX_COLUMNS_PER_BAND = 10;

function getAttr(source, name) {
  return source.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
}

function setAttr(source, name, value) {
  const pattern = new RegExp(`((?:^|\\s)${name}=")[^"]*(")`);
  if (pattern.test(source)) {
    return source.replace(pattern, `$1${value}$2`);
  }
  return `${source.replace(/\s*$/, "")} ${name}="${value}"`;
}

function cluster(values, tolerance) {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const groups = [];

  for (const value of sorted) {
    const current = groups.at(-1);
    if (!current || value - current.at(-1) > tolerance) {
      groups.push([value]);
    } else {
      current.push(value);
    }
  }

  return groups.map((items) => ({
    items,
    center: items.reduce((sum, value) => sum + value, 0) / items.length,
  }));
}

function nearestCluster(value, groups) {
  let best = 0;
  let distance = Infinity;
  groups.forEach((group, index) => {
    const nextDistance = Math.abs(value - group.center);
    if (nextDistance < distance) {
      best = index;
      distance = nextDistance;
    }
  });
  return best;
}

function normalizeEdgeStyle(style = "") {
  const declarations = new Map();
  for (const part of style.split(";")) {
    if (!part) continue;
    const separator = part.indexOf("=");
    if (separator === -1) {
      declarations.set(part, "");
    } else {
      declarations.set(part.slice(0, separator), part.slice(separator + 1));
    }
  }

  declarations.set("edgeStyle", "orthogonalEdgeStyle");
  declarations.set("rounded", "0");
  declarations.set("orthogonalLoop", "1");
  declarations.set("jettySize", "auto");
  declarations.set("exitPerimeter", "1");
  declarations.set("entryPerimeter", "1");
  declarations.set("labelBackgroundColor", "#FFFFFF");

  return [...declarations]
    .map(([key, value]) => (value === "" ? key : `${key}=${value}`))
    .join(";") + ";";
}

function reflowDiagram(xml, filename) {
  const vertexPattern =
    /<mxCell\b([^>]*\bvertex="1"[^>]*)><mxGeometry\b([^>]*)\/?><\/mxCell>/g;
  const vertices = [...xml.matchAll(vertexPattern)].map((match) => ({
    id: getAttr(match[1], "id"),
    x: Number(getAttr(match[2], "x") ?? 0),
    y: Number(getAttr(match[2], "y") ?? 0),
    width: Number(getAttr(match[2], "width") ?? 160),
    height: Number(getAttr(match[2], "height") ?? 64),
  }));

  if (vertices.length === 0) {
    throw new Error(`${filename}: no vertices found`);
  }

  const xGroups = cluster(
    vertices.map((vertex) => vertex.x),
    X_CLUSTER_TOLERANCE,
  );
  const yGroups = cluster(
    vertices.map((vertex) => vertex.y),
    Y_CLUSTER_TOLERANCE,
  );

  const columnWidths = xGroups.map((_, index) =>
    Math.max(
      ...vertices
        .filter((vertex) => nearestCluster(vertex.x, xGroups) === index)
        .map((vertex) => vertex.width),
    ),
  );
  const rowHeights = yGroups.map((_, index) =>
    Math.max(
      ...vertices
        .filter((vertex) => nearestCluster(vertex.y, yGroups) === index)
        .map((vertex) => vertex.height),
    ),
  );

  const rowY = [];
  let nextY = START_Y;
  for (const height of rowHeights) {
    rowY.push(nextY);
    nextY += height + ROW_GAP;
  }
  const bandHeight = nextY - START_Y + ROW_GAP;
  const fixedColumnWidth = Math.max(...columnWidths);
  const columnPitch = fixedColumnWidth + COLUMN_GAP;

  const positions = new Map();
  for (const vertex of vertices) {
    const column = nearestCluster(vertex.x, xGroups);
    const row = nearestCluster(vertex.y, yGroups);
    const band = Math.floor(column / MAX_COLUMNS_PER_BAND);
    const localColumn = column % MAX_COLUMNS_PER_BAND;
    const visualColumn =
      band % 2 === 0
        ? localColumn
        : MAX_COLUMNS_PER_BAND - 1 - localColumn;
    positions.set(vertex.id, {
      x: Math.round(
        START_X +
          visualColumn * columnPitch +
          (fixedColumnWidth - vertex.width) / 2,
      ),
      y: Math.round(
        rowY[row] +
          band * bandHeight +
          (rowHeights[row] - vertex.height) / 2,
      ),
      width: vertex.width,
      height: vertex.height,
    });
  }

  let output = xml.replace(vertexPattern, (whole, cellAttrs, geometryAttrs) => {
    const id = getAttr(cellAttrs, "id");
    const position = positions.get(id);
    if (!position) return whole;

    let geometry = geometryAttrs.replace(/\/\s*$/, "");
    geometry = setAttr(geometry, "x", position.x);
    geometry = setAttr(geometry, "y", position.y);
    return `<mxCell${cellAttrs}><mxGeometry${geometry}/></mxCell>`;
  });

  output = output.replace(
    /<mxCell\b([^>]*\bedge="1"[^>]*)>/g,
    (whole, attrs) => {
      const style = normalizeEdgeStyle(getAttr(attrs, "style"));
      return `<mxCell${setAttr(attrs, "style", style)}>`;
    },
  );

  const maxX = Math.max(
    ...[...positions.values()].map((position) => position.x + position.width),
  );
  const maxY = Math.max(
    ...[...positions.values()].map((position) => position.y + position.height),
  );
  const pageWidth = Math.ceil((maxX + PAGE_PADDING) / 100) * 100;
  const pageHeight = Math.ceil((maxY + PAGE_PADDING) / 100) * 100;

  output = output.replace(/<mxGraphModel\b([^>]*)>/, (whole, attrs) => {
    let nextAttrs = setAttr(attrs, "pageWidth", pageWidth);
    nextAttrs = setAttr(nextAttrs, "pageHeight", pageHeight);
    nextAttrs = setAttr(nextAttrs, "dx", Math.min(pageWidth, 2400));
    nextAttrs = setAttr(nextAttrs, "dy", Math.min(pageHeight, 1600));
    return `<mxGraphModel${nextAttrs}>`;
  });

  return {
    xml: output,
    pageWidth,
    pageHeight,
    vertices: [...positions.entries()].map(([id, position]) => ({
      id,
      ...position,
    })),
  };
}

function findOverlaps(vertices) {
  const overlaps = [];
  for (let left = 0; left < vertices.length; left += 1) {
    for (let right = left + 1; right < vertices.length; right += 1) {
      const a = vertices[left];
      const b = vertices[right];
      const intersects =
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
      if (intersects) overlaps.push([a.id, b.id]);
    }
  }
  return overlaps;
}

const diagrams = [];
for (const filename of files) {
  const filePath = path.join(flowDir, filename);
  const original = fs.readFileSync(filePath, "utf8");
  const result = reflowDiagram(original, filename);
  const overlaps = findOverlaps(result.vertices);
  if (overlaps.length > 0) {
    throw new Error(
      `${filename}: ${overlaps.length} overlaps after reflow: ${JSON.stringify(overlaps)}`,
    );
  }

  fs.writeFileSync(filePath, result.xml);
  const diagram = result.xml.match(/<diagram\b[\s\S]*?<\/diagram>/)?.[0];
  if (!diagram) throw new Error(`${filename}: diagram element not found`);
  diagrams.push(diagram);
  console.log(
    `${filename}: ${result.vertices.length} nodes, page ${result.pageWidth}×${result.pageHeight}, overlaps 0`,
  );
}

const combinedPath = path.join(flowDir, "人才发展系统-全部流程图.drawio");
const combined =
  `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" ` +
  `agent="Codex" version="24.7.17" type="device" compressed="false">` +
  diagrams.join("") +
  "</mxfile>";
fs.writeFileSync(combinedPath, combined);
console.log(`combined: ${diagrams.length} pages`);
