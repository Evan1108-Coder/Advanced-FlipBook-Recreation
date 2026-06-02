"use client";

import { useMemo } from "react";
import { clsx } from "clsx";
import type { CanvasObject, Connection, ProjectSettings } from "@/lib/types";

export type ConnectorLayerProps = {
  objects: CanvasObject[];
  connections: Connection[];
  settings: Pick<ProjectSettings, "connectorStyle" | "connectorLabels">;
  width?: number;
  height?: number;
};

type Point = {
  x: number;
  y: number;
};

const fallbackSize = {
  width: 2600,
  height: 1600
};

export function ConnectorLayer({ objects, connections, settings, width = fallbackSize.width, height = fallbackSize.height }: ConnectorLayerProps) {
  const objectMap = useMemo(() => new Map(objects.map((object) => [object.id, object])), [objects]);

  return (
    <svg className="connector-layer" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      {connections.map((connection) => {
        const from = objectMap.get(connection.fromId);
        const to = objectMap.get(connection.toId);
        if (!from || !to) return null;

        const start = getAnchor(from, to);
        const end = getAnchor(to, from);
        const path = getConnectorPath(start, end, settings.connectorStyle);

        return (
          <g key={connection.id} className={clsx("connector", `connector-${settings.connectorStyle}`)}>
            <path className="connector-path" d={path} />
            {settings.connectorLabels !== false && connection.label ? (
              <text className="connector-label" x={(start.x + end.x) / 2} y={(start.y + end.y) / 2 - 8}>
                {connection.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function getAnchor(object: CanvasObject, other: CanvasObject): Point {
  const objectCenter = getCenter(object);
  const otherCenter = getCenter(other);
  const horizontal = Math.abs(otherCenter.x - objectCenter.x) >= Math.abs(otherCenter.y - objectCenter.y);

  if (horizontal) {
    return {
      x: otherCenter.x >= objectCenter.x ? object.x + object.width : object.x,
      y: objectCenter.y
    };
  }

  return {
    x: objectCenter.x,
    y: otherCenter.y >= objectCenter.y ? object.y + object.height : object.y
  };
}

function getCenter(object: CanvasObject): Point {
  return {
    x: object.x + object.width / 2,
    y: object.y + object.height / 2
  };
}

function getConnectorPath(start: Point, end: Point, style: ProjectSettings["connectorStyle"]) {
  if (style === "direct") return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;

  if (style === "stepped") {
    const midX = start.x + (end.x - start.x) / 2;
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
  }

  const gap = Math.max(80, Math.abs(end.x - start.x) * 0.42, Math.abs(end.y - start.y) * 0.24);
  const xDirection = end.x >= start.x ? 1 : -1;
  return `M ${start.x} ${start.y} C ${start.x + gap * xDirection} ${start.y}, ${end.x - gap * xDirection} ${end.y}, ${end.x} ${end.y}`;
}
