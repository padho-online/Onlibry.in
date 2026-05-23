// src/pages/admin/HomeEditor.jsx - D1 Database Version
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getAllQuickAccessAdminFromD1,
  addQuickAccessButtonToD1,
  updateQuickAccessButtonInD1,
  deleteQuickAccessButtonFromD1,
  reorderQuickAccessButtonsInD1,
  getAllCategoriesAdminFromD1,
  addCategoryToD1,
  updateCategoryInD1,
  deleteCategoryFromD1,
  getAllNotificationsAdminFromD1,
  createNotificationInD1,
  updateNotificationInD1,
  deleteNotificationFromD1,
  getAllSliderCardsAdminFromD1,
  addSliderCardToD1,
  updateSliderCardInD1,
  deleteSliderCardFromD1,
  reorderSliderCardsInD1
} from '../../services/d1Service';
import * as Icons from 'lucide-react';
import IconPicker, { AVAILABLE_ICONS, CATEGORY_ICONS, getIconComponent } from '../../components/IconPicker';

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'djnwoi3hk';
const CLOUDINARY_UPLOAD_PRESET = 'onlibry_blog';

// Get admin key from env
const ADMIN_KEY = import.meta.env.VITE_NOTIFICATION_ADMIN_KEY || 'HabibulAdmin@2025';

function HomeEditor() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('buttons');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const fileInputRef = useRef(null);
  const [currentUploadTarget, setCurrentUploadTarget] = useState(null);
  
  // Quick Access Buttons State
  const [buttons, setButtons] = useState([]);
  const [editingButton, setEditingButton] = useState(null);
  
  // Categories State
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [editingNotification, setEditingNotification] = useState(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  
  // Slider Cards State
  const [sliderCards, setSliderCards] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  
  // Form States
  const [buttonForm, setButtonForm] = useState({ label: '', icon: 'Folder', path: '', order: 0 });
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', color: 'gray', icon: 'Bell', order: 0 });
  const [notificationForm, setNotificationForm] = useState({ 
    title: '', content: '', category_id: '', link: '', image_url: '', is_pinned: 0, status: 'published' 
  });
  const [cardForm, setCardForm] = useState({ 
  title: '', description: '', image_url: '', link: '', 
  button_text: '',  // ✅ Empty by default
  order: 0 
});

  // Upload image to Cloudinary
  const uploadImage = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'onlibry-notifications');
    
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      }
      throw new Error('Upload failed');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Image upload failed. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      if (currentUploadTarget === 'notification') {
        setNotificationForm({ ...notificationForm, image_url: imageUrl });
      } else if (currentUploadTarget === 'slider') {
        setCardForm({ ...cardForm, image_url: imageUrl });
      }
    }
    fileInputRef.current.value = '';
  };

  const openImageUpload = (target) => {
    setCurrentUploadTarget(target);
    fileInputRef.current.click();
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadButtons(),
      loadCategories(),
      loadNotifications(),
      loadSliderCards()
    ]);
    setLoading(false);
  };

  const loadButtons = async () => {
    const data = await getAllQuickAccessAdminFromD1(ADMIN_KEY);
    setButtons(data);
  };

  const loadCategories = async () => {
    const data = await getAllCategoriesAdminFromD1(ADMIN_KEY);
    setCategories(data);
  };

  const loadNotifications = async () => {
    const data = await getAllNotificationsAdminFromD1(ADMIN_KEY);
    setNotifications(data);
  };

  const loadSliderCards = async () => {
    const data = await getAllSliderCardsAdminFromD1(ADMIN_KEY);
    setSliderCards(data);
  };

  // ============================================
  // QUICK ACCESS BUTTONS CRUD
  // ============================================
  
  const handleSaveButton = async () => {
    if (editingButton) {
      await updateQuickAccessButtonInD1(editingButton.id, buttonForm, ADMIN_KEY);
    } else {
      await addQuickAccessButtonToD1(buttonForm, ADMIN_KEY);
    }
    setEditingButton(null);
    setButtonForm({ label: '', icon: 'Folder', path: '', order: 0 });
    await loadButtons();
  };

  const handleDeleteButton = async (id) => {
    if (window.confirm('Delete this button?')) {
      await deleteQuickAccessButtonFromD1(id, ADMIN_KEY);
      await loadButtons();
    }
  };

  const handleEditButton = (button) => {
    setEditingButton(button);
    setButtonForm({
      label: button.label,
      icon: button.icon,
      path: button.path,
      order: button.order
    });
  };

  // Move button up (decrease order)
  const moveButtonUp = async (index) => {
    if (index === 0) return;
    
    const newButtons = [...buttons];
    const temp = newButtons[index];
    newButtons[index] = newButtons[index - 1];
    newButtons[index - 1] = temp;
    
    const updatedButtons = newButtons.map((btn, idx) => ({ ...btn, order: idx + 1 }));
    setButtons(updatedButtons);
    
    setReordering(true);
    await reorderQuickAccessButtonsInD1(updatedButtons, ADMIN_KEY);
    setReordering(false);
  };

  const moveButtonDown = async (index) => {
    if (index === buttons.length - 1) return;
    
    const newButtons = [...buttons];
    const temp = newButtons[index];
    newButtons[index] = newButtons[index + 1];
    newButtons[index + 1] = temp;
    
    const updatedButtons = newButtons.map((btn, idx) => ({ ...btn, order: idx + 1 }));
    setButtons(updatedButtons);
    
    setReordering(true);
    await reorderQuickAccessButtonsInD1(updatedButtons, ADMIN_KEY);
    setReordering(false);
  };

  // ============================================
  // CATEGORIES CRUD
  // ============================================
  
  const handleSaveCategory = async () => {
    if (editingCategory) {
      await updateCategoryInD1(editingCategory.id, categoryForm, ADMIN_KEY);
    } else {
      await addCategoryToD1(categoryForm, ADMIN_KEY);
    }
    setEditingCategory(null);
    setCategoryForm({ name: '', slug: '', color: 'gray', icon: 'Bell', order: 0 });
    await loadCategories();
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Delete this category? All notifications in this category will be affected.')) {
      await deleteCategoryFromD1(id, ADMIN_KEY);
      await loadCategories();
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      color: category.color,
      icon: category.icon,
      order: category.order
    });
  };

  // ============================================
  // NOTIFICATIONS CRUD
  // ============================================
  
  const handleSaveNotification = async () => {
    if (editingNotification) {
      await updateNotificationInD1(editingNotification.id, notificationForm, ADMIN_KEY);
    } else {
      await createNotificationInD1(notificationForm, ADMIN_KEY);
    }
    setEditingNotification(null);
    setShowNotifModal(false);
    setNotificationForm({ title: '', content: '', category_id: '', link: '', image_url: '', is_pinned: 0, status: 'published' });
    await loadNotifications();
  };

  const handleDeleteNotification = async (id) => {
    if (window.confirm('Delete this notification?')) {
      await deleteNotificationFromD1(id, ADMIN_KEY);
      await loadNotifications();
    }
  };

  const handleEditNotification = (notification) => {
    setEditingNotification(notification);
    setNotificationForm({
      title: notification.title,
      content: notification.content,
      category_id: notification.category_id,
      link: notification.link || '',
      image_url: notification.image_url || '',
      is_pinned: notification.is_pinned || 0,
      status: notification.status || 'published'
    });
    setShowNotifModal(true);
  };

  // ============================================
  // SLIDER CARDS CRUD
  // ============================================
  
  const handleSaveCard = async () => {
    if (editingCard) {
      await updateSliderCardInD1(editingCard.id, cardForm, ADMIN_KEY);
    } else {
      await addSliderCardToD1(cardForm, ADMIN_KEY);
    }
    setEditingCard(null);
    setShowCardModal(false);
    setCardForm({ title: '', description: '', image_url: '', link: '', button_text: 'View More', order: 0 });
    await loadSliderCards();
  };

  const handleDeleteCard = async (id) => {
    if (window.confirm('Delete this slider card?')) {
      await deleteSliderCardFromD1(id, ADMIN_KEY);
      await loadSliderCards();
    }
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setCardForm({
      title: card.title,
      description: card.description || '',
      image_url: card.image_url,
      link: card.link || '',
      button_text: card.button_text || 'View More',
      order: card.order
    });
    setShowCardModal(true);
  };

  const handleReorderCards = async (draggedId, targetId) => {
    const draggedIndex = sliderCards.findIndex(c => c.id === draggedId);
    const targetIndex = sliderCards.findIndex(c => c.id === targetId);
    if (draggedIndex === targetIndex) return;
    
    const newCards = [...sliderCards];
    const [removed] = newCards.splice(draggedIndex, 1);
    newCards.splice(targetIndex, 0, removed);
    
    const updatedCards = newCards.map((card, idx) => ({ ...card, order: idx + 1 }));
    setSliderCards(updatedCards);
    await reorderSliderCardsInD1(updatedCards, ADMIN_KEY);
  };

  // Color options for categories
  const colorOptions = [
    { value: 'red', label: '🔴 Red' },
    { value: 'blue', label: '🔵 Blue' },
    { value: 'green', label: '🟢 Green' },
    { value: 'yellow', label: '🟡 Yellow' },
    { value: 'purple', label: '🟣 Purple' },
    { value: 'pink', label: '🌸 Pink' },
    { value: 'orange', label: '🟠 Orange' },
    { value: 'gray', label: '⚪ Gray' }
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Hidden file input for image upload */}
      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

      {/* Tabs - Horizontal Scrollable for Mobile */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto scrollbar-thin">
        <button onClick={() => setActiveTab('buttons')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === 'buttons' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          🔘 Quick Access Buttons
        </button>
        <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === 'categories' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          🏷️ Categories
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === 'notifications' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          📢 Notifications
        </button>
        <button onClick={() => setActiveTab('slider')} className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === 'slider' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          🎠 Slider Cards
        </button>
      </div>

      {/* ============================================ */}
      {/* QUICK ACCESS BUTTONS TAB */}
      {/* ============================================ */}
      {activeTab === 'buttons' && (
        <div>
          {reordering && (
            <div className="mb-4 p-2 bg-blue-100 text-blue-700 rounded-lg text-sm text-center">
              ⏳ Saving order...
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">
              {editingButton ? '✏️ Edit Button' : '➕ Add New Button'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Label (e.g., Files)"
                value={buttonForm.label}
                onChange={(e) => setButtonForm({ ...buttonForm, label: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              
              <IconPicker
                value={buttonForm.icon}
                onChange={(iconName) => setButtonForm({ ...buttonForm, icon: iconName })}
                placeholder="Select Icon"
                iconSize={20}
                iconColor="text-green-600"
                pickerWidth="w-96"
                pickerColumns={6}
                iconsList={AVAILABLE_ICONS}
              />
              
              <input
                type="text"
                placeholder="Path (e.g., /files)"
                value={buttonForm.path}
                onChange={(e) => setButtonForm({ ...buttonForm, path: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleSaveButton} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                {editingButton ? 'Update' : 'Add'}
              </button>
              {editingButton && (
                <button onClick={() => { setEditingButton(null); setButtonForm({ label: '', icon: 'Folder', path: '', order: 0 }); }} className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600">
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Order</th>
                  <th className="p-3 text-left">Icon</th>
                  <th className="p-3 text-left">Label</th>
                  <th className="p-3 text-left">Path</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buttons.map((btn, idx) => {
                  const IconComponent = getIconComponent(btn.icon);
                  return (
                    <tr key={btn.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 w-8">{btn.order}</span>
                          <div className="flex flex-col">
                            <button
                              onClick={() => moveButtonUp(idx)}
                              disabled={idx === 0 || reordering}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              title="Move Up"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => moveButtonDown(idx)}
                              disabled={idx === buttons.length - 1 || reordering}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                              title="Move Down"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {IconComponent ? <IconComponent size={20} className="text-green-600" /> : <Icons.Folder size={20} className="text-green-600" />}
                      </td>
                      <td className="p-3 font-medium">{btn.label}</td>
                      <td className="p-3 text-gray-500">{btn.path}</td>
                      <td className="p-3">
                        <button onClick={() => handleEditButton(btn)} className="text-blue-600 mr-3 hover:text-blue-800">✏️</button>
                        <button onClick={() => handleDeleteButton(btn.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {buttons.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No buttons added yet. Click "Add New Button" to create one.
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* CATEGORIES TAB */}
      {/* ============================================ */}
      {activeTab === 'categories' && (
        <div>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">
              {editingCategory ? '✏️ Edit Category' : '➕ Add New Category'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Name (e.g., Exam Notification)"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Slug (e.g., exam)"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {colorOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              
              <IconPicker
                value={categoryForm.icon}
                onChange={(iconName) => setCategoryForm({ ...categoryForm, icon: iconName })}
                placeholder="Select Category Icon"
                iconSize={18}
                iconColor={`text-${categoryForm.color}-600`}
                pickerWidth="w-80"
                pickerColumns={4}
                iconsList={CATEGORY_ICONS}
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleSaveCategory} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                {editingCategory ? 'Update' : 'Add'}
              </button>
              {editingCategory && (
                <button onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', slug: '', color: 'gray', icon: 'Bell', order: 0 }); }} className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600">
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Icon</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Slug</th>
                  <th className="p-3 text-left">Color</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const IconComponent = getIconComponent(cat.icon);
                  return (
                    <tr key={cat.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3">
                        {IconComponent ? <IconComponent size={18} className={`text-${cat.color}-600`} /> : <Icons.Bell size={18} className={`text-${cat.color}-600`} />}
                      </td>
                      <td className="p-3 font-medium">{cat.name}</td>
                      <td className="p-3 text-gray-500">{cat.slug}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs bg-${cat.color}-100 text-${cat.color}-700`}>
                          {cat.color}
                        </span>
                      </td>
                      <td className="p-3">
                        <button onClick={() => handleEditCategory(cat)} className="text-blue-600 mr-3 hover:text-blue-800">✏️</button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* NOTIFICATIONS TAB */}
      {/* ============================================ */}
      {activeTab === 'notifications' && (
        <div>
          <button onClick={() => { setEditingNotification(null); setNotificationForm({ title: '', content: '', category_id: '', link: '', image_url: '', is_pinned: 0, status: 'published' }); setShowNotifModal(true); }} className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            + Create New Notification
          </button>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Pinned</th>
                  <th className="p-3 text-left">Views</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => {
                  const category = categories.find(c => c.id === notif.category_id);
                  const IconComponent = category ? getIconComponent(category.icon) : Icons.Bell;
                  return (
                    <tr key={notif.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3 font-medium max-w-[200px] truncate">{notif.title}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-1">
                          {IconComponent ? <IconComponent size={14} /> : <Icons.Bell size={14} />} {category?.name}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${notif.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {notif.status}
                        </span>
                      </td>
                      <td className="p-3">{notif.is_pinned === 1 ? '📌 Yes' : 'No'}</td>
                      <td className="p-3">{notif.views || 0}</td>
                      <td className="p-3">
                        <button onClick={() => handleEditNotification(notif)} className="text-blue-600 mr-3 hover:text-blue-800">✏️</button>
                        <button onClick={() => handleDeleteNotification(notif.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SLIDER CARDS TAB */}
      {/* ============================================ */}
      {activeTab === 'slider' && (
        <div>
          <button onClick={() => { setEditingCard(null); setCardForm({ title: '', description: '', image_url: '', link: '', button_text: 'View More', order: 0 }); setShowCardModal(true); }} className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
            + Add New Slider Card
          </button>

          <div className="space-y-3">
            {sliderCards.map((card, idx) => (
              <div key={card.id} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-8">#{idx + 1}</span>
                  <div className="cursor-move text-gray-400 text-2xl">⋮⋮</div>
                </div>
                {card.image_url ? (
                  <img src={card.image_url} alt={card.title} className="w-20 h-16 object-cover rounded-lg" />
                ) : (
                  <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Icons.Image size={24} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{card.title}</h4>
                  <p className="text-sm text-gray-500 truncate">{card.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditCard(card)} className="text-blue-600 hover:text-blue-800">✏️</button>
                  <button onClick={() => handleDeleteCard(card.id)} className="text-red-600 hover:text-red-800">🗑️</button>
                  {idx > 0 && (
                    <button onClick={() => handleReorderCards(card.id, sliderCards[idx-1].id)} className="text-gray-500 hover:text-gray-700">⬆️</button>
                  )}
                  {idx < sliderCards.length - 1 && (
                    <button onClick={() => handleReorderCards(card.id, sliderCards[idx+1].id)} className="text-gray-500 hover:text-gray-700">⬇️</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingNotification ? '✏️ Edit Notification' : '➕ Create Notification'}</h3>
              <button onClick={() => setShowNotifModal(false)} className="text-gray-500 text-2xl hover:text-gray-700">×</button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <select
                value={notificationForm.category_id}
                onChange={(e) => setNotificationForm({ ...notificationForm, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              
              <textarea
                placeholder="Content (in less than 12 words)"
                value={notificationForm.content}
                onChange={(e) => setNotificationForm({ ...notificationForm, content: e.target.value })}
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <input
                type="text"
                placeholder="Link (optional)"
                value={notificationForm.link}
                onChange={(e) => setNotificationForm({ ...notificationForm, link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Image URL"
                  value={notificationForm.image_url}
                  onChange={(e) => setNotificationForm({ ...notificationForm, image_url: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => openImageUpload('notification')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  disabled={uploading}
                >
                  {uploading ? '⏳ Uploading...' : '📤 Upload'}
                </button>
              </div>
              
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notificationForm.is_pinned === 1}
                    onChange={(e) => setNotificationForm({ ...notificationForm, is_pinned: e.target.checked ? 1 : 0 })}
                  />
                  Pin this notification
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notificationForm.status === 'published'}
                    onChange={(e) => setNotificationForm({ ...notificationForm, status: e.target.checked ? 'published' : 'draft' })}
                  />
                  Publish now
                </label>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button onClick={handleSaveNotification} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  {editingNotification ? 'Update' : 'Create'}
                </button>
                <button onClick={() => setShowNotifModal(false)} className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slider Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingCard ? '✏️ Edit Slider Card' : '➕ Add Slider Card'}</h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-500 text-2xl hover:text-gray-700">×</button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={cardForm.title}
                onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <textarea
                placeholder="Description"
                value={cardForm.description}
                onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Image URL"
                  value={cardForm.image_url}
                  onChange={(e) => setCardForm({ ...cardForm, image_url: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={() => openImageUpload('slider')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  disabled={uploading}
                >
                  {uploading ? '⏳' : '📤 Upload'}
                </button>
              </div>
              
              {cardForm.image_url && (
                <img src={cardForm.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
              )}
              
              <input
                type="text"
                placeholder="Link (e.g., /files or https://...)"
                value={cardForm.link}
                onChange={(e) => setCardForm({ ...cardForm, link: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <input
                type="text"
                placeholder="Button Text (e.g., Explore Now)"
                value={cardForm.button_text}
                onChange={(e) => setCardForm({ ...cardForm, button_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              
              <div className="flex gap-3 pt-4">
                <button onClick={handleSaveCard} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  {editingCard ? 'Update' : 'Create'}
                </button>
                <button onClick={() => setShowCardModal(false)} className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomeEditor;