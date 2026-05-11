// src/blogger/components/PublishPanel.jsx

import React, { useState } from 'react';
import { Globe, Lock, Eye, Send, Loader2 } from 'lucide-react';

const PublishPanel = ({ post, onPublish, onSaveDraft, isSaving }) => {
  const [status, setStatus] = useState(post?.status || 'draft');
  const [scheduleDate, setScheduleDate] = useState('');

  const handlePublish = () => {
    onPublish({ ...post, status: 'published', publishedAt: new Date().toISOString() });
  };

  const handleSaveDraft = () => {
    onSaveDraft({ ...post, status: 'draft' });
  };

  const handleSchedule = () => {
    if (scheduleDate) {
      onPublish({ ...post, status: 'scheduled', scheduledFor: scheduleDate });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Send size={18} className="text-green-600" />
        Publish
      </h3>

      <div className="space-y-4">
        {/* Status Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={status === 'draft'}
              onChange={(e) => setStatus(e.target.value)}
              className="text-green-600"
            />
            <Lock size={16} className="text-gray-400" />
            <div>
              <div className="text-sm font-medium">Draft</div>
              <div className="text-xs text-gray-400">Not visible to public</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="published"
              checked={status === 'published'}
              onChange={(e) => setStatus(e.target.value)}
              className="text-green-600"
            />
            <Globe size={16} className="text-green-600" />
            <div>
              <div className="text-sm font-medium">Publish Now</div>
              <div className="text-xs text-gray-400">Visible to everyone</div>
            </div>
          </label>
        </div>

        {/* Schedule Option */}
        {status === 'scheduled' && (
          <div>
            <label className="block text-sm font-medium mb-1">Schedule for</label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Draft'}
          </button>
          <button
            onClick={status === 'scheduled' ? handleSchedule : handlePublish}
            disabled={isSaving}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {status === 'scheduled' ? 'Schedule' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishPanel;