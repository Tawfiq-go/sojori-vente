"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PHONE_DIAL_ROWS } from '@/lib/phoneDialCodesData';

function stripDiac(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type Props = {
  dial: string;
  iso: string;
  onSelect: (dial: string, iso: string) => void;
  inputStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  /** Libellés i18n (namespace demo.step1 côté page). */
  dialLabel: string;
  dialSearchPlaceholder: string;
  dialNoResults: string;
};

export function PhoneDialSelect({
  dial,
  iso,
  onSelect,
  inputStyle,
  labelStyle,
  dialLabel,
  dialSearchPlaceholder,
  dialNoResults,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const filtered = useMemo(() => {
    const t = stripDiac(q.trim().toLowerCase().replace(/\s+/g, ""));
    if (!t) return PHONE_DIAL_ROWS;
    return PHONE_DIAL_ROWS.filter((r) => {
      const name = stripDiac(r.nameFr.toLowerCase());
      const d = r.dial.replace("+", "");
      return (
        name.includes(t) ||
        r.dial.toLowerCase().includes(t) ||
        d.includes(t) ||
        r.iso.toLowerCase().includes(t)
      );
    });
  }, [q]);

  const current =
    PHONE_DIAL_ROWS.find((r) => r.dial === dial && r.iso === iso) ||
    PHONE_DIAL_ROWS.find((r) => r.dial === dial) ||
    PHONE_DIAL_ROWS[0];

  const panelStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    top: "calc(100% + 6px)",
    zIndex: 40,
    borderRadius: 10,
    border: '1px solid var(--b)',
    background: 'var(--card)',
    boxShadow: '0 12px 36px rgba(26, 20, 8, 0.12)',
    maxHeight: 320,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const rowBtn: React.CSSProperties = {
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    border: "none",
    borderBottom: '1px solid var(--b)',
    background: "transparent",
    color: 'var(--ink)',
    fontSize: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <label style={labelStyle}>{dialLabel}</label>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setQ("");
        }}
        style={{
          ...inputStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
          <span aria-hidden>{current.emoji}</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {current.nameFr} <span style={{ opacity: 0.75 }}>{current.dial}</span>
          </span>
        </span>
        <span style={{ opacity: 0.5, fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={panelStyle} role="listbox">
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={dialSearchPlaceholder}
            style={{
              ...inputStyle,
              borderRadius: 0,
              border: "none",
              borderBottom: '1px solid var(--b)',
            }}
          />
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 14, fontSize: 13, color: 'var(--ink3)' }}>{dialNoResults}</div>
            ) : (
              filtered.map((r) => {
                const active = r.dial === dial && r.iso === iso;
                return (
                  <button
                    key={`${r.iso}-${r.dial}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onSelect(r.dial, r.iso);
                      setOpen(false);
                      setQ("");
                    }}
                    style={{
                      ...rowBtn,
                      background: active ? "rgba(244, 207, 94, 0.12)" : "transparent",
                    }}
                  >
                    <span aria-hidden>{r.emoji}</span>
                    <span style={{ flex: 1 }}>{r.nameFr}</span>
                    <span style={{ opacity: 0.85, fontVariantNumeric: "tabular-nums" }}>{r.dial}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
