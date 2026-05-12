// src/blogger/components/Toolbar.jsx
// Updated with image upload button

import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Image,
  Link as LinkIcon,
  Code2,
} from 'lucide-react';
import ImageUploader from './ImageUploader';

const Toolbar = ({ editor }) => {
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showHtml, setShowHtml] = useState(false);

  if (!editor) return null;

  const Button = ({ onClick, isActive = false, icon: Icon, title }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition ${
        isActive ? 'bg-green-100 text-green-600' : 'text-gray-600 hover:bg-gray-100'
      }`}
      title={title}
      type="button"
    >
      <Icon size={18} />
    </button>
  );

  const setLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const insertImageFromUrl = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      const imgHtml = `<img src="${url}" alt="Image" class="max-w-full my-4 rounded-lg shadow-md" />`;
      editor.commands.insertContent(imgHtml);
    }
  };

  const insertImageFromUpload = (imgHtml) => {
    editor.commands.insertContent(imgHtml);
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
      textarea.style.padding = '16px';
      textarea.style.fontFamily = 'monospace';
      textarea.style.fontSize = '14px';
      textarea.id = 'html-editor';
      document.body.appendChild(textarea);
      textarea.focus();

      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save HTML';
      saveBtn.className =
        'fixed bottom-10 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-green-600 text-white rounded-lg z-[1001]';
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
    <>
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-white sticky top-0 z-10">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <Button
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            icon={Bold}
            title="Bold"
          />
          <Button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            icon={Italic}
            title="Italic"
          />
          <Button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            icon={Strikethrough}
            title="Strikethrough"
          />
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            icon={Heading1}
            title="Heading 1"
          />
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            icon={Heading2}
            title="Heading 2"
          />
          <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            icon={Heading3}
            title="Heading 3"
          />
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <Button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            icon={List}
            title="Bullet List"
          />
          <Button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            icon={ListOrdered}
            title="Numbered List"
          />
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <Button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            icon={AlignLeft}
            title="Align Left"
          />
          <Button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            icon={AlignCenter}
            title="Align Center"
          />
          <Button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            icon={AlignRight}
            title="Align Right"
          />
        </div>

        {/* Images & Links */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <Button onClick={() => setShowImageUploader(true)} icon={Image} title="Upload Image" />
          <Button onClick={insertImageFromUrl} icon={Image} title="Insert Image from URL" />
          <Button onClick={setLink} icon={LinkIcon} title="Insert Link" />
        </div>

        {/* Code & Quote */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
          <Button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            icon={Code}
            title="Code Block"
          />
          <Button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            icon={Quote}
            title="Quote"
          />
        </div>

        {/* Undo/Redo & HTML */}
        <div className="flex items-center gap-1 ml-auto">
          <Button onClick={() => editor.chain().focus().undo().run()} icon={Undo} title="Undo" />
          <Button onClick={() => editor.chain().focus().redo().run()} icon={Redo} title="Redo" />
          <Button onClick={toggleHtmlView} isActive={showHtml} icon={Code2} title="HTML View" />
        </div>
      </div>

      {/* Image Uploader Modal */}
      {showImageUploader && <ImageUploader onUpload={insertImageFromUpload} onClose={() => setShowImageUploader(false)} />}
    </>
  );
};

export default Toolbar;