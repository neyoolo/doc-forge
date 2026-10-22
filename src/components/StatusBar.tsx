import type { EditorStats } from '../types';

interface StatusBarProps {
  stats: EditorStats;
  zoom: number;
  aiQuota: number;
  onZoomChange: (zoom: number) => void;
}

export default function StatusBar({ stats, zoom, aiQuota, onZoomChange }: StatusBarProps) {
  return (
    <footer className="status-bar no-print">
      <div className="status-stats">
        <span>{stats.words.toLocaleString()} words</span><span className="status-separator">|</span>
        <span>{stats.characters.toLocaleString()} characters</span><span className="status-separator">|</span>
        <span>{stats.readingMinutes} min read</span>
      </div>
      <div className="status-tools">
        <div className="quota-chip"><span><i className="fa-solid fa-arrow-right-arrow-left" /> 18/20 conversions</span><span className="status-separator">|</span><span><i className="fa-solid fa-wand-magic-sparkles" /> <b>{aiQuota}/10</b> AI actions</span></div>
        <label className="zoom-control"><i className="fa-solid fa-magnifying-glass-minus" /><input aria-label="Zoom" type="range" min="70" max="150" value={zoom} onChange={(event) => onZoomChange(Number(event.target.value))} /><span>{zoom}%</span></label>
      </div>
    </footer>
  );
}
