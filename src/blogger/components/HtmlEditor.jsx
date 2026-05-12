// src/blogger/components/HtmlEditor.jsx
// ✅ FINAL FIX: Apply & Preview working 100%

import React, { useState, useRef, useEffect } from 'react';
import ImageUploader from './ImageUploader';
import ImageEditorModal from './ImageEditorModal';
import ColorPicker from './ColorPicker';

const HtmlEditor = ({ content, onChange, placeholder = "Write your blog post here..." }) => {
  const editorRef = useRef(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState('text');
  const [currentColor, setCurrentColor] = useState('#000000');

  // Store editor reference
  const editorElementRef = useRef(null);

  // Initialize editor content
  useEffect(() => {
    if (editorElementRef.current && !isHtmlMode) {
      const currentContent = editorElementRef.current.innerHTML;
      if (currentContent !== (content || '')) {
        editorElementRef.current.innerHTML = content || '';
      }
    }
  }, [content, isHtmlMode]);

  // Focus editor on mount
  useEffect(() => {
    if (editorElementRef.current && !isHtmlMode) {
      editorElementRef.current.focus();
    }
  }, [isHtmlMode]);

  const setEditorRef = (el) => {
    editorElementRef.current = el;
    editorRef.current = el;
  };

  const execCommand = (command, value = null) => {
    if (!editorElementRef.current) return;
    editorElementRef.current.focus();
    document.execCommand(command, false, value);
    if (onChange) {
      onChange(editorElementRef.current.innerHTML);
    }
  };

  const formatBlock = (tag) => {
    if (!editorElementRef.current) return;
    editorElementRef.current.focus();
    document.execCommand('formatBlock', false, tag);
    if (onChange) {
      onChange(editorElementRef.current.innerHTML);
    }
  };

  const insertHtml = (html) => {
    if (!editorElementRef.current) return;
    editorElementRef.current.focus();
    document.execCommand('insertHTML', false, html);
    if (onChange) {
      onChange(editorElementRef.current.innerHTML);
    }
  };

  const insertTable = () => {
    const rows = prompt('Enter number of rows:', '4');
    const cols = prompt('Enter number of columns:', '4');
    if (rows && cols) {
      const numRows = parseInt(rows);
      const numCols = parseInt(cols);
      if (numRows > 0 && numCols > 0) {
        let tableHtml = `
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 16px 0; background: white;">
            <thead>
              <tr>
                ${Array(numCols).fill('<th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5; font-weight: bold;">Header</th>').join('')}
              </tr>
            </thead>
            <tbody>
              ${Array(numRows).fill(`
                <tr>
                  ${Array(numCols).fill('<td style="border: 1px solid #ddd; padding: 8px;"><br></td>').join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        insertHtml(tableHtml);
      }
    }
  };

  const insertImageFromUrl = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      setEditingImageUrl(url);
      setShowImageEditor(true);
    }
  };

  const openImageEditor = (url) => {
    setEditingImageUrl(url);
    setShowImageEditor(true);
  };

  const insertEditedImage = (imgHtml) => {
    insertHtml(imgHtml);
  };

  const handleInput = () => {
    if (editorElementRef.current && onChange) {
      onChange(editorElementRef.current.innerHTML);
    }
  };

  const toggleHtmlMode = () => {
    if (!editorElementRef.current) return;
    if (!isHtmlMode) {
      setHtmlContent(editorElementRef.current.innerHTML);
      setIsHtmlMode(true);
    } else {
      setIsHtmlMode(false);
    }
  };

  const handleHtmlChange = (e) => {
    setHtmlContent(e.target.value);
  };

  // ✅ SIMPLE FIX: Apply HTML without complex logic
  const applyHtml = () => {
    // Editor reference exists in HTML mode because we added ref to textarea
    if (!editorElementRef.current) {
      console.error('❌ Editor ref is null');
      return;
    }
    
    try {
      // Update content
      editorElementRef.current.innerHTML = htmlContent;
      
      // Exit HTML mode
      setIsHtmlMode(false);
      
      // Notify parent
      if (onChange) {
        onChange(htmlContent);
      }
      
      console.log('✅ HTML applied successfully');
      
    } catch (error) {
      console.error('❌ Apply HTML error:', error);
      alert('Invalid HTML detected. Please check your code.');
    }
  };

  const cancelHtmlMode = () => {
    setIsHtmlMode(false);
  };

  const insertImageFromUpload = (imageUrl) => {
    openImageEditor(imageUrl);
  };

  const openColorPicker = (type) => {
    setColorPickerType(type);
    setShowColorPicker(true);
  };

  const handleColorSelect = (color) => {
    setCurrentColor(color);
    if (colorPickerType === 'text') {
      document.execCommand('foreColor', false, color);
    } else if (colorPickerType === 'background') {
      document.execCommand('hiliteColor', false, color);
    }
    if (onChange && editorElementRef.current) {
      onChange(editorElementRef.current.innerHTML);
    }
  };

  const ToolbarButton = ({ onClick, icon, title, isActive = false }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition ${
        isActive ? 'bg-green-100 text-green-600' : 'text-gray-600 hover:bg-gray-100'
      }`}
      title={title}
      type="button"
    >
      {icon}
    </button>
  );

  const checkActive = (command) => {
    try {
      return document.queryCommandState(command);
    } catch (e) {
      return false;
    }
  };

  const checkFormatBlock = (tag) => {
    try {
      return document.queryCommandValue('formatBlock') === tag;
    } catch (e) {
      return false;
    }
  };

  // ✅ HTML Mode View with ref
  if (isHtmlMode) {
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
          <button 
            onClick={cancelHtmlMode}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            title="Back to Editor"
          >
            📝
          </button>
          <span className="text-sm text-gray-500 ml-2">HTML Mode - Edit raw HTML</span>
          
          <button
            onClick={applyHtml}
            className="ml-auto px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
          >
            ✅ Apply & Preview
          </button>
        </div>
        <textarea
          ref={setEditorRef} // ✅ IMPORTANT: Reference store karo
          value={htmlContent}
          onChange={handleHtmlChange}
          className="w-full h-[500px] p-4 font-mono text-sm border-none outline-none resize-none"
          placeholder="Enter HTML directly..."
        />
        <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          💡 Click <strong>"Apply & Preview"</strong> to see changes in the editor.
        </div>
      </div>
    );
  }

  // WYSIWYG Editor View
  return (
    <>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-white sticky top-0 z-10">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <ToolbarButton onClick={() => execCommand('bold')} icon="<b>B</b>" title="Bold (Ctrl+B)" isActive={checkActive('bold')} />
            <ToolbarButton onClick={() => execCommand('italic')} icon="<i>I</i>" title="Italic (Ctrl+I)" isActive={checkActive('italic')} />
            <ToolbarButton onClick={() => execCommand('underline')} icon="<u>U</u>" title="Underline" isActive={checkActive('underline')} />
            <ToolbarButton onClick={() => execCommand('strikeThrough')} icon="<s>S</s>" title="Strikethrough" />
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <ToolbarButton 
              onClick={() => openColorPicker('text')} 
              icon={<span style={{ color: currentColor }}>A</span>} 
              title="Text Color" 
            />
            <ToolbarButton 
              onClick={() => openColorPicker('background')} 
              icon={<span style={{ backgroundColor: currentColor, padding: '0 4px' }}>A</span>} 
              title="Background Color" 
            />
          </div>

          {/* Headings */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <ToolbarButton onClick={() => formatBlock('H1')} icon="H1" title="Heading 1" isActive={checkFormatBlock('H1')} />
            <ToolbarButton onClick={() => formatBlock('H2')} icon="H2" title="Heading 2" isActive={checkFormatBlock('H2')} />
            <ToolbarButton onClick={() => formatBlock('H3')} icon="H3" title="Heading 3" isActive={checkFormatBlock('H3')} />
            <ToolbarButton onClick={() => formatBlock('P')} icon="P" title="Paragraph" isActive={checkFormatBlock('P')} />
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon="• List" title="Bullet List" />
            <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon="1. List" title="Numbered List" />
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <ToolbarButton onClick={() => execCommand('justifyLeft')} icon="⬅️" title="Align Left" />
            <ToolbarButton onClick={() => execCommand('justifyCenter')} icon="⬌" title="Align Center" />
            <ToolbarButton onClick={() => execCommand('justifyRight')} icon="➡️" title="Align Right" />
            <ToolbarButton onClick={() => execCommand('justifyFull')} icon="☰" title="Justify" />
          </div>

          {/* Indent */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <ToolbarButton onClick={() => execCommand('indent')} icon="→ Indent" title="Indent" />
            <ToolbarButton onClick={() => execCommand('outdent')} icon="← Outdent" title="Outdent" />
          </div>

          {/* Links & Images */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <ToolbarButton
              onClick={() => {
                const url = prompt('Enter URL:');
                if (url) execCommand('createLink', url);
              }}
              icon="🔗"
              title="Insert Link"
            />
            <ToolbarButton onClick={insertImageFromUrl} icon="🖼️" title="Insert Image from URL" />
            <ToolbarButton onClick={() => setShowImageUploader(true)} icon="📤" title="Upload & Edit Image" />
          </div>

          {/* Table */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <ToolbarButton onClick={insertTable} icon="⊞ Table" title="Insert Table" />
          </div>

          {/* Code & Quote */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
            <ToolbarButton onClick={() => formatBlock('PRE')} icon="&lt;/&gt;" title="Code Block" />
            <ToolbarButton onClick={() => formatBlock('BLOCKQUOTE')} icon="“ ”" title="Quote" />
            <ToolbarButton onClick={() => insertHtml('<hr style="margin: 20px 0;" />')} icon="—" title="Horizontal Line" />
          </div>

          {/* Undo/Redo & HTML */}
          <div className="flex items-center gap-1 ml-auto">
            <ToolbarButton onClick={() => execCommand('undo')} icon="↩️" title="Undo (Ctrl+Z)" />
            <ToolbarButton onClick={() => execCommand('redo')} icon="↪️" title="Redo (Ctrl+Y)" />
            <ToolbarButton onClick={toggleHtmlMode} icon="&lt;&gt;" title="HTML View" />
          </div>
        </div>

        {/* Editor Area */}
        <div
          ref={setEditorRef}
          contentEditable
          onInput={handleInput}
          className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none focus:outline-none min-h-[500px] p-6"
          data-placeholder={placeholder}
          style={{ outline: 'none' }}
        />
        
        <div className="text-xs text-gray-400 border-t border-gray-100 px-4 py-2 bg-gray-50 flex justify-between items-center">
          <span>💡 Ctrl+B (Bold) | Ctrl+I (Italic) | Ctrl+Z (Undo) | Ctrl+Y (Redo)</span>
          <span>✅ MS Word Style Color Picker | Custom table | Image Editor</span>
        </div>
      </div>

      {/* Image Uploader Modal */}
      {showImageUploader && (
        <ImageUploader 
          onUpload={openImageEditor} 
          onClose={() => setShowImageUploader(false)} 
        />
      )}

      {/* Image Editor Modal */}
      {showImageEditor && (
        <ImageEditorModal
          imageUrl={editingImageUrl}
          onSave={insertEditedImage}
          onClose={() => setShowImageEditor(false)}
        />
      )}

      {/* Color Picker Modal */}
      {showColorPicker && (
        <ColorPicker
          type={colorPickerType}
          initialColor={currentColor}
          onSelect={handleColorSelect}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </>
  );
};

export default HtmlEditor;