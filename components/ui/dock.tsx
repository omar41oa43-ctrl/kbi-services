'use client'; 
 
import { ReactNode } from 'react'; 
import './dock.css'; 
 
interface DockItemProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  baseItemSize: number;
}

function DockItem({ children, className = '', onClick, baseItemSize }: DockItemProps) { 
  return ( 
    <div 
      style={{ 
        width: baseItemSize, 
        height: baseItemSize 
      }} 
      onClick={onClick} 
      className={`dock-item ${className}`} 
      tabIndex={0} 
      role="button" 
    > 
      {children} 
    </div> 
  ); 
} 
 
interface DockIconProps {
  children: ReactNode;
  className?: string;
}

function DockIcon({ children, className = '' }: DockIconProps) { 
  return <div className={`dock-icon ${className}`}>{children}</div>; 
} 
 
export interface DockItemData {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

interface DockProps {
  items: DockItemData[];
  className?: string;
  panelHeight?: number;
  baseItemSize?: number;
}

export default function Dock({ 
  items, 
  className = '', 
  panelHeight = 68, 
  baseItemSize = 50 
}: DockProps) { 
  return ( 
    <div style={{ height: panelHeight }} className="dock-outer"> 
      <div 
        className={`dock-panel ${className}`} 
        style={{ height: panelHeight }} 
        role="toolbar" 
        aria-label="Application dock" 
      > 
        {items.map((item, index) => ( 
          <DockItem 
            key={index} 
            onClick={item.onClick} 
            className={item.className} 
            baseItemSize={baseItemSize} 
          > 
            <DockIcon>{item.icon}</DockIcon> 
          </DockItem> 
        ))} 
      </div> 
    </div> 
  ); 
} 
