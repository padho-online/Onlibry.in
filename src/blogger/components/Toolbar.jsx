// src/blogger/components/Toolbar.jsx

import React, { useState } from 'react';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Code, Quote, AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Image, Eye, Code2
} from 'lucide-react';

const Toolbar = ({ editor, onImageUpload }) => {
  const [showHtml, setShowHtml] = useState(false);
  
  if (!editor) return null;

  const Button = ({ onClick, isActive = false, icon: Icon, title }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition ${
        isActive 
          ? 'bg-green-100 text-green-600' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
      title={title}
    >
      <Icon size={18} />
    </button>
  );

  const toggleHeading = (level) => {
    if (editor.isActive('heading', { level })) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setHeading({ level }).run();
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const toggleHtmlView = () => {
    setShowHtml(!showHtml);
    if (!showHtml) {
      const html = editor.getHTML();
      const textarea = document.createElement('textarea');
      textarea.value = html;
      textarea.style.position = 'fixed';
      textarea.style.top = '50%';
      textarea.style.left = '50%';
      textarea.style.transform = 'translate(-50%, -50%)';
      textarea.style.width = '80%';
      textarea.style.height = '60%';
      textarea.style.zIndex = '1000';
      textarea.className = 'p-4 border rounded-lg font-mono text-sm';
      textarea.id = 'html-editor';
      document.body.appendChild(textarea);
      textarea.focus();
      
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save HTML';
      saveBtn.className = 'fixed bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-green-600 text-white rounded-lg z-[1001]';
      saveBtn.onclick = () => {
        editor.commands.setContent(textarea.value);
        document.body.removeChild(textarea);
        document.body.removeChild(saveBtn);
        setShowHtml(false);
      };
      document.body.appendChild(saveBtn);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-white sticky top-0 z-10">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        <Button onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold" />
        <Button onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Italic" />
        <Button onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={Strikethrough} title="Strikethrough" />
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        <Button onClick={() => toggleHeading(1)} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} title="Heading 1" />
        <Button onClick={() => toggleHeading(2)} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
        <Button onClick={() => toggleHeading(3)} isActive={editor.isActive('heading', { level: 3 })} icon={Heading3} title="Heading 3" />
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        <Button onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullet List" />
        <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Numbered List" />
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
        <Button onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Align Left" />
        <Button onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Align Center" />
        <Button onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={AlignRight} title="Align Right" />
      </div>

      {/* Special */}
      <div className="flex items-center gap-1">
        <Button onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={Code} title="Code Block" />
        <Button onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} title="Quote" />
        <Button onClick={insertImage} icon={Image} title="Insert Image" />
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 ml-auto">
        <Button onClick={() => editor.chain().focus().undo().run()} icon={Undo} title="Undo" />
        <Button onClick={() => editor.chain().focus().redo().run()} icon={Redo} title="Redo" />
        <Button onClick={toggleHtmlView} isActive={showHtml} icon={Code2} title="HTML View" />
      </div>
    </div>
  );
};

export default Toolbar;