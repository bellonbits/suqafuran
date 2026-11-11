"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, Download, AlertCircle, CheckCircle2, X, Loader2,
  FileSpreadsheet, ChevronRight, Info, AlertTriangle, FileText, Check,
  Store, Users, ShieldCheck, FileUp
} from 'lucide-react';
import api from '@/services/api';

interface ParsedRow {
  name: string;
  price: string;
  stock: string;
  category: string;
  description: string;
  images: string;
  _valid: boolean;
  _errors: string[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

const SAMPLE_CSV = `Name,Price,Stock,Category,Description,Images
Wireless Earbuds Pro,2500,50,Electronics,High-quality wireless earbuds with noise cancellation,https://images.unsplash.com/photo-1505740420928-5e560c06d30e
Leather Handbag,3800,20,Fashion,Premium genuine leather handbag in brown,https://images.unsplash.com/photo-1523275335684-37898b6baf30
Smart Fitness Watch,2900,35,Electronics,Full touch OLED fitness smartwatch with heart rate sensor,
`;

const COLUMN_DESCRIPTIONS = [
  { col: 'Name', required: true, example: 'Wireless Earbuds Pro' },
  { col: 'Price', required: true, example: '2500 (KSh, numbers only)' },
  { col: 'Stock', required: false, example: '50' },
  { col: 'Category', required: false, example: 'Electronics' },
  { col: 'Description', required: false, example: 'Product description details' },
  { col: 'Images', required: false, example: 'https://... (URL)' },
];

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    const errors: string[] = [];
    if (!row['name']) errors.push('Name is required');
    if (!row['price']) errors.push('Price is required');
    if (row['price'] && isNaN(Number(row['price']))) errors.push('Price must be a number');
    if (row['stock'] && isNaN(Number(row['stock']))) errors.push('Stock must be a number');
    return {
      name: row['name'] || '',
      price: row['price'] || '',
      stock: row['stock'] || '',
      category: row['category'] || '',
      description: row['description'] || '',
      images: row['images'] || '',
      _valid: errors.length === 0,
      _errors: errors,
    };
  });
}

export default function BulkImportPage() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setProgress(0);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
    };
    reader.readAsText(f);
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) handleFile(f);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suqafuran_product_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!file || rows.length === 0) return;
    setImporting(true);
    setProgress(0);

    const validRows = rows.filter((r) => r._valid);
    let success = 0;
    const errors: { row: number; message: string }[] = [];

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/listings/bulk-import', formData).catch(async () => {
        // Fallback: import row by row
        for (let i = 0; i < validRows.length; i++) {
          const row = validRows[i];
          try {
            await api.post('/listings/me', {
              title_en: row.name,
              price: Number(row.price),
              quantity: row.stock ? Number(row.stock) : 1,
              description_en: row.description,
            });
            success++;
          } catch (err: any) {
            errors.push({ row: i + 2, message: err?.response?.data?.detail || 'Import error' });
          }
          setProgress(Math.round(((i + 1) / validRows.length) * 100));
        }
        return null;
      });

      if (res?.data) {
        success = res.data.success || validRows.length;
        setProgress(100);
      }

      setResult({
        success,
        failed: errors.length + (rows.length - validRows.length),
        errors,
      });
    } catch (err: any) {
      console.error('Import failed:', err);
    } finally {
      setImporting(false);
    }
  };

  const validCount = rows.filter((r) => r._valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto px-1 md:px-0">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bulk Import
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Upload hundreds of products simultaneously with a CSV or Excel file
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 text-xs font-bold text-slate-700 dark:text-neutral-200 shadow-sm hover:bg-slate-50 transition-colors active:scale-95"
        >
          <Download className="w-4 h-4 text-sky-500" />
          <span>Download Template (.csv)</span>
        </button>
      </div>

      {/* ── Shop Management Sub-sections Navigation Pills ── */}
      <div className="bg-slate-100/80 dark:bg-neutral-900/80 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar border border-slate-200/50 dark:border-neutral-800/60 shadow-xs">
        <Link
          to="/seller-dashboard/shop"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/50 transition-colors whitespace-nowrap"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Shop Profile</span>
        </Link>

        <Link
          to="/seller-dashboard/settings/staff"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/50 transition-colors whitespace-nowrap"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff Accounts</span>
        </Link>

        <Link
          to="/seller-dashboard/verification"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/50 transition-colors whitespace-nowrap"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verification</span>
        </Link>

        <Link
          to="/seller-dashboard/products/bulk-import"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-white dark:bg-neutral-800 text-sky-600 dark:text-sky-400 shadow-xs whitespace-nowrap"
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>Bulk Import</span>
        </Link>
      </div>

      {/* ── CSV Column Format Guide (Redesigned) ── */}
      <div className="bg-sky-50/70 dark:bg-sky-950/30 rounded-3xl p-5 border border-sky-100 dark:border-sky-900/40 space-y-3">
        <div className="flex items-center gap-2 text-sky-900 dark:text-sky-300">
          <Info className="w-4 h-4 text-sky-500 flex-shrink-0" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider">
            CSV Column Header Format
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {COLUMN_DESCRIPTIONS.map((col) => (
            <div
              key={col.col}
              className="bg-white/90 dark:bg-neutral-900/90 rounded-2xl p-3 border border-sky-100/60 dark:border-neutral-800 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">{col.col}</span>
                {col.required ? (
                  <span className="text-[9px] font-black text-rose-500 uppercase bg-rose-50 dark:bg-rose-950/40 px-1 py-0.2 rounded">
                    Req
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 uppercase">Opt</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-1">{col.example}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Drag & Drop Upload Zone (Modernized) ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-3xl border-2 border-dashed p-8 md:p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 scale-[1.01]'
            : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 hover:border-sky-400'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500 flex items-center justify-center mx-auto mb-3 shadow-sm">
          <FileSpreadsheet className="w-7 h-7" />
        </div>
        
        <h3 className="font-extrabold text-sm md:text-base text-slate-800 dark:text-white">
          {file ? file.name : 'Drop your CSV file here'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          {file ? `${(file.size / 1024).toFixed(1)} KB · Click to replace file` : 'or click to browse from device (.csv, .xlsx up to 5MB)'}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={onFileInput}
          className="hidden"
        />
      </div>

      {/* ── Parsed Rows Preview ── */}
      {rows.length > 0 && (
        <div className="bg-white dark:bg-neutral-900/90 rounded-3xl border border-slate-100 dark:border-neutral-800 p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Preview ({rows.length} items detected)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="text-emerald-600 font-bold">{validCount} valid</span>
                {invalidCount > 0 && <span className="text-rose-500 font-bold ml-2">• {invalidCount} with formatting errors</span>}
              </p>
            </div>

            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{importing ? `Importing (${progress}%)` : `Import ${validCount} Products`}</span>
            </button>
          </div>

          {importing && (
            <div className="w-full bg-slate-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Table preview */}
          <div className="overflow-x-auto max-h-72 divide-y divide-slate-100 dark:divide-neutral-800 text-xs">
            {rows.slice(0, 10).map((row, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    row._valid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {row._valid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  </div>
                  <div className="min-w-0 flex-1 truncate">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{row.name || 'Untitled'}</p>
                    <p className="text-[10px] text-slate-400">{row.category || 'General'} · Stock: {row.stock || '1'}</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-black text-slate-900 dark:text-white">KSh {row.price || '0'}</p>
                  {!row._valid && (
                    <p className="text-[10px] text-rose-500 font-bold">{row._errors.join(', ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {result && (
            <div className={`p-4 rounded-2xl text-xs font-bold ${
              result.failed === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
            }`}>
              Import complete: {result.success} products created, {result.failed} skipped.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
