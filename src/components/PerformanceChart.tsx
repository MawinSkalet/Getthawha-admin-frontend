"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PerformanceReport, ReportBucket, ReportView } from "@/interfaces/IBranchReport";
import { reportLabel, reportMoney } from "@/lib/reportDates";
import styles from "./PerformanceChart.module.css";

export default function PerformanceChart({ report, scopeName, metric, onMetricChange, onDrillDown }: { report: PerformanceReport; scopeName: string; metric: "bookings" | "revenue"; onMetricChange: (metric: "bookings" | "revenue") => void; onDrillDown: (view: ReportView, date: string) => void }) {
  const headingId = useId();
  const [selected, setSelected] = useState<ReportBucket | null>(null);
  const [hovered, setHovered] = useState<ReportBucket | null>(null);
  const [available, setAvailable] = useState(600);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const bins = report.chart;
  const isRevenue = metric === "revenue";
  const valueLabel = (value: number) => isRevenue ? reportMoney(value) : value.toLocaleString("en-US");
  const left = isRevenue ? 78 : 42, right = 16, height = 245, top = 30, bottom = 40;
  const max = Math.max(...bins.map((bin) => bin[metric]), isRevenue ? 100 : 1);
  const rawStep = max / 4, magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = Math.max(isRevenue ? 25 : 1, Math.ceil(rawStep / magnitude) * magnitude);
  const ceiling = step * 4;
  const minColumn = Math.max(62, ...bins.map((bin) => valueLabel(bin[metric]).length * 8 + 22));
  const width = Math.max(available, left + right + minColumn * bins.length);
  const column = (width - left - right) / Math.max(1, bins.length);
  const plotHeight = height - top - bottom;
  const grouping = { day: "Hourly", week: "Daily", month: "Weekly", year: "Monthly" }[report.period.view];
  const readout = hovered || selected;
  const caption = report.period.view === "day" ? "Select an hour to see its exact totals." : `Select a ${report.period.view === "year" ? "month" : report.period.view === "month" ? "week" : "day"} to open its report.`;
  function activate(bin: ReportBucket) {
    if (bin.nextView && bin.nextDate) onDrillDown(bin.nextView, bin.nextDate);
    else setSelected(bin);
  }

  return <section className={`${styles.chart} br-panel br-chart-panel`} aria-labelledby={headingId}>
    <div className="br-panel-head">
      <div><h2 id={headingId}>{grouping} {metric}</h2><p>{reportLabel(report.period)}</p></div>
      <div className="br-segmented" role="group" aria-label="Chart metric">
        {(["bookings", "revenue"] as const).map((item) => <button key={item} type="button" aria-pressed={metric === item} onClick={() => onMetricChange(item)}>{item === "bookings" ? "Bookings" : "Revenue"}</button>)}
      </div>
    </div>
    <div className="br-chart-toolbar"><span>{scopeName} · {report.period.view === "month" ? "Weekly totals within this month" : `${grouping} totals`}</span><span>Bangkok time (UTC+7)</span></div>
    <div className="br-chart-body">
      <p className="br-chart-unit">{isRevenue ? "Revenue (THB)" : "Number of bookings"}</p>
      <div ref={container} className="br-chart-scroll" tabIndex={0} aria-label="Performance chart; scroll horizontally to see all values">
        <svg role="group" aria-label={`${grouping} ${metric} for ${scopeName}`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} onPointerLeave={() => setHovered(null)}>
          {Array.from({ length: 5 }, (_, index) => {
            const y = top + plotHeight - plotHeight * index / 4;
            return <g key={index}><line x1={left} y1={y} x2={width - right} y2={y} stroke="#E0D7C9" /><text className="br-chart-tick" x={left - 10} y={y + 4} textAnchor="end">{(step * index).toLocaleString("en-US")}</text></g>;
          })}
          {bins.map((bin, index) => {
            const barHeight = bin[metric] / ceiling * plotHeight, center = left + (index + .5) * column;
            const y = top + plotHeight - barHeight, barWidth = Math.min(column * .46, 52);
            const label = `${bin.fullLabel}: ${bin.bookings} bookings, ${reportMoney(bin.revenue)} revenue${bin.nextView ? `. View ${bin.nextView} report.` : ""}`;
            return <g key={bin.key || bin.start} className="br-chart-column" role="button" tabIndex={0} aria-label={label} aria-pressed={selected === bin} onClick={() => activate(bin)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(bin); } }} onPointerEnter={() => setHovered(bin)} onFocus={() => setHovered(bin)} onBlur={() => setHovered(null)}>
              <title>{label}</title>
              <rect className="br-chart-hit" x={left + index * column + 3} y={2} width={column - 6} height={height - 4} rx={6} />
              <rect className="br-chart-bar" x={center - barWidth / 2} y={y} width={barWidth} height={Math.max(barHeight, 1)} rx={3} />
              <text className="br-chart-value" x={center} y={y - 9} textAnchor="middle">{valueLabel(bin[metric])}</text>
              <text className="br-chart-tick" x={center} y={height - 12} textAnchor="middle">{bin.label}</text>
            </g>;
          })}
        </svg>
      </div>
      <p className="br-chart-caption">{caption}{width > available + 1 ? " Scroll horizontally to see every value." : ""}</p>
      <div className="br-chart-readout" role="status" aria-live="polite" aria-atomic="true">
        <strong>{readout?.fullLabel || reportLabel(report.period)}</strong>
        <span>{(readout?.bookings ?? report.statistics.bookings).toLocaleString()} bookings</span>
        <span>{reportMoney(readout?.revenue ?? report.statistics.revenue)} revenue</span>
      </div>
    </div>
  </section>;
}
