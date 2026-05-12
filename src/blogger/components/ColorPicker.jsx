// src/blogger/components/ColorPicker.jsx
// MS Word style Color Picker with preset colors + recent colors + custom color

import React, { useState } from 'react';
import { X } from 'lucide-react';

const ColorPicker = ({ onSelect, onClose, initialColor = '#000000', type = 'text' }) => {
  const [color, setColor] = useState(initialColor);
  const [customColor, setCustomColor] = useState(initialColor);
  const [recentColors, setRecentColors] = useState([
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#008000', '#000080', '#800000', '#808000', '#008080'
  ]);

  const presetColors = [
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
    '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
    '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#CFE2F3', '#D9D9E3', '#D9D9D9', '#D9D9D9',
    '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6FA8DC', '#8E7CC3', '#D9D9D9', '#D9D9D9',
    '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3D85C6', '#674EA7', '#D9D9D9', '#D9D9D9',
    '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#0B5394', '#351C75', '#D9D9D9', '#D9D9D9',
    '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#073763', '#20124D', '#D9D9D9', '#D9D9D9'
  ];

  const handleColorClick = (selectedColor) => {
    setColor(selectedColor);
    setCustomColor(selectedColor);
    setRecentColors(prev => {
      const newRecent = [selectedColor, ...prev.filter(c => c !== selectedColor)];
      return newRecent.slice(0, 15);
    });
    onSelect(selectedColor);
  };

  const handleCustomColorChange = (e) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    setColor(newColor);
    onSelect(newColor);
  };

  const handleCustomColorInput = (e) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    setColor(newColor);
    onSelect(newColor);
  };

  const handleApply = () => {
    onSelect(color);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold">
            {type === 'text' ? 'Text Color' : 'Background Color'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Recent Colors */}
        <div className="p-3 border-b border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Recent Colors</p>
          <div className="flex flex-wrap gap-1">
            {recentColors.map((c, idx) => (
              <button
                key={idx}
                onClick={() => handleColorClick(c)}
                className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Preset Colors */}
        <div className="p-3 border-b border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Theme Colors</p>
          <div className="flex flex-wrap gap-1">
            {presetColors.map((c, idx) => (
              <button
                key={idx}
                onClick={() => handleColorClick(c)}
                className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Custom Color */}
        <div className="p-3 border-b border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Custom Color</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={customColor}
              onChange={handleCustomColorChange}
              className="w-10 h-10 cursor-pointer border-0"
            />
            <input
              type="text"
              value={customColor}
              onChange={handleCustomColorInput}
              className="flex-1 px-3 py-1 border rounded-lg text-sm"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;