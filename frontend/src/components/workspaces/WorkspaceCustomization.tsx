import React, { FC, useState } from 'react';
import { Workspace, WorkspaceCustomization as CustomizationModel, WorkspaceWidget } from '../../models/workspace/Workspace';

interface WorkspaceCustomizationProps {
  workspace: Workspace;
  onSave: (customization: CustomizationModel) => void;
}

/**
 * Component for customizing workspace layout and widgets
 */
const WorkspaceCustomization: FC<WorkspaceCustomizationProps> = ({ 
  workspace, 
  onSave 
}) => {
  const [customization, setCustomization] = useState<CustomizationModel>(workspace.customization);
  const [isDragging, setIsDragging] = useState(false);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  
  // Available themes
  const availableThemes = [
    { value: 'light', label: 'Light Theme' },
    { value: 'dark', label: 'Dark Theme' },
    { value: 'color', label: 'Colorful Theme' },
    { value: 'minimal', label: 'Minimal Theme' }
  ];
  
  // Available layouts
  const availableLayouts = [
    { value: 'default', label: 'Default Layout' },
    { value: 'compact', label: 'Compact Layout' },
    { value: 'wide', label: 'Wide Layout' },
    { value: 'focused', label: 'Focused Layout' }
  ];
  
  // Available widgets
  const availableWidgets = [
    { type: 'calendar', name: 'Calendar' },
    { type: 'tasks', name: 'Task List' },
    { type: 'notes', name: 'Quick Notes' },
    { type: 'activity', name: 'Activity Feed' },
    { type: 'chart', name: 'Charts' },
    { type: 'map', name: 'Living Map' }
  ];
  
  // Handle theme change
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCustomization({
      ...customization,
      theme: e.target.value
    });
  };
  
  // Handle layout change
  const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCustomization({
      ...customization,
      layout: e.target.value
    });
  };
  
  // Add a widget to the workspace
  const addWidget = (type: string) => {
    const newWidget: WorkspaceWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      config: {},
      position: {
        x: 0,
        y: 0,
        width: 2,
        height: 2
      }
    };
    
    setCustomization({
      ...customization,
      widgets: [...customization.widgets, newWidget]
    });
  };
  
  // Remove a widget from the workspace
  const removeWidget = (widgetId: string) => {
    setCustomization({
      ...customization,
      widgets: customization.widgets.filter(widget => widget.id !== widgetId)
    });
  };
  
  // Update widget position (simulated)
  const updateWidgetPosition = (widgetId: string, x: number, y: number) => {
    setCustomization({
      ...customization,
      widgets: customization.widgets.map(widget => {
        if (widget.id === widgetId) {
          return {
            ...widget,
            position: {
              ...widget.position,
              x,
              y
            }
          };
        }
        return widget;
      })
    });
  };
  
  // Handle widget drag start
  const handleDragStart = (widgetId: string) => {
    setIsDragging(true);
    setActiveWidget(widgetId);
  };
  
  // Handle widget drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setActiveWidget(null);
  };
  
  // Handle saving customization
  const handleSave = () => {
    onSave(customization);
  };
  
  // Reset customization to workspace defaults
  const handleReset = () => {
    setCustomization(workspace.customization);
  };
  
  return (
    <div className="workspace-customization">
      <h2>Customize Workspace</h2>
      
      <div className="customization-section">
        <h3>Appearance</h3>
        
        <div className="customization-control">
          <label htmlFor="theme">Theme</label>
          <select 
            id="theme" 
            value={customization.theme} 
            onChange={handleThemeChange}
          >
            {availableThemes.map(theme => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="customization-control">
          <label htmlFor="layout">Layout</label>
          <select 
            id="layout" 
            value={customization.layout} 
            onChange={handleLayoutChange}
          >
            {availableLayouts.map(layout => (
              <option key={layout.value} value={layout.value}>
                {layout.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="customization-section">
        <h3>Widgets</h3>
        
        <div className="widget-list">
          {customization.widgets.map(widget => {
            // Find the friendly name for this widget type
            const widgetInfo = availableWidgets.find(w => w.type === widget.type);
            
            return (
              <div 
                key={widget.id} 
                className={`widget-item ${activeWidget === widget.id ? 'dragging' : ''}`}
                draggable={true}
                onDragStart={() => handleDragStart(widget.id)}
                onDragEnd={handleDragEnd}
              >
                <span className="widget-name">{widgetInfo?.name || widget.type}</span>
                <button 
                  className="widget-remove" 
                  onClick={() => removeWidget(widget.id)}
                  aria-label={`Remove ${widgetInfo?.name || widget.type} widget`}
                >
                  ×
                </button>
              </div>
            );
          })}
          
          {customization.widgets.length === 0 && (
            <p className="no-widgets">No widgets added yet</p>
          )}
        </div>
        
        <div className="widget-actions">
          <div className="widget-add">
            <select 
              id="add-widget"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  addWidget(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="" disabled>Add widget...</option>
              {availableWidgets.map(widget => (
                <option key={widget.type} value={widget.type}>
                  {widget.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="workspace-preview">
        <h3>Layout Preview</h3>
        <div className={`preview-container layout-${customization.layout} theme-${customization.theme}`}>
          {customization.widgets.map(widget => {
            const widgetInfo = availableWidgets.find(w => w.type === widget.type);
            
            return (
              <div 
                key={widget.id}
                className="preview-widget"
                style={{
                  left: `${widget.position.x * 10}%`,
                  top: `${widget.position.y * 10}%`,
                  width: `${widget.position.width * 10}%`,
                  height: `${widget.position.height * 10}%`,
                }}
              >
                {widgetInfo?.name || widget.type}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="customization-actions">
        <button 
          className="reset-button" 
          onClick={handleReset}
        >
          Reset
        </button>
        <button 
          className="save-button" 
          onClick={handleSave}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default WorkspaceCustomization;