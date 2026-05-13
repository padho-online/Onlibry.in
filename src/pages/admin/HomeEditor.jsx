// src/pages/admin/HomeEditor.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getQuickAccessButtons, 
  updateQuickAccessButton,
  addQuickAccessButton,
  deleteQuickAccessButton
} from '../../services/quickAccessService';
import { 
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory
} from '../../services/categoryService';
import {
  getAllNotificationsAdmin,
  createNotification,
  updateNotification,
  deleteNotification
} from '../../services/notificationService';
import {
  getSliderCards,
  updateSliderCard,
  addSliderCard,
  deleteSliderCard,
  reorderSliderCards
} from '../../services/sliderService';

function HomeEditor() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('buttons');
  const [loading, setLoading] = useState(true);
  
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
  
  // Form States
  const [buttonForm, setButtonForm] = useState({ label: '', icon: '📁', path: '', order: 0 });
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', color: 'gray', icon: '📢', order: 0 });
  const [notificationForm, setNotificationForm] = useState({ 
    title: '', content: '', category_id: '', link: '', image_url: '', is_pinned: 0, status: 'published' 
  });
  const [cardForm, setCardForm] = useState({ 
    title: '', description: '', image_url: '', link: '', button_text: 'View More', order: 0 
  });

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
    const data = await getQuickAccessButtons(true); // force refresh
    setButtons(data);
  };

  const loadCategories = async () => {
    const data = await getAllCategories(true);
    setCategories(data);
  };

  const loadNotifications = async () => {
    const data = await getAllNotificationsAdmin();
    setNotifications(data);
  };

  const loadSliderCards = async () => {
    const data = await getSliderCards(true);
    setSliderCards(data);
  };

  // ============================================
  // QUICK ACCESS BUTTONS CRUD
  // ============================================
  
  const handleSaveButton = async () => {
    if (editingButton) {
      await updateQuickAccessButton(editingButton.id, buttonForm);
    } else {
      await addQuickAccessButton(buttonForm);
    }
    setEditingButton(null);
    setButtonForm({ label: '', icon: '📁', path: '', order: 0 });
    await loadButtons();
  };

  const handleDeleteButton = async (id) => {
    if (window.confirm('Delete this button?')) {
      await deleteQuickAccessButton(id);
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

  // ============================================
  // CATEGORIES CRUD
  // ============================================
  
  const handleSaveCategory = async () => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, categoryForm);
    } else {
      await addCategory(categoryForm);
    }
    setEditingCategory(null);
    setCategoryForm({ name: '', slug: '', color: 'gray', icon: '📢', order: 0 });
    await loadCategories();
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Delete this category? All notifications in this category will be affected.')) {
      await deleteCategory(id);
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
      await updateNotification(editingNotification.id, notificationForm);
    } else {
      await createNotification(notificationForm);
    }
    setEditingNotification(null);
    setShowNotifModal(false);
    setNotificationForm({ title: '', content: '', category_id: '', link: '', image_url: '', is_pinned: 0, status: 'published' });
    await loadNotifications();
  };

  const handleDeleteNotification = async (id) => {
    if (window.confirm('Delete this notification?')) {
      await deleteNotification(id);
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
      await updateSliderCard(editingCard.id, cardForm);
    } else {
      await addSliderCard(cardForm);
    }
    setEditingCard(null);
    setCardForm({ title: '', description: '', image_url: '', link: '', button_text: 'View More', order: 0 });
    await loadSliderCards();
  };

  const handleDeleteCard = async (id) => {
    if (window.confirm('Delete this slider card?')) {
      await deleteSliderCard(id);
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
  };

  const handleReorderCards = async (draggedId, targetId) => {
    const draggedIndex = sliderCards.findIndex(c => c.id === draggedId);
    const targetIndex = sliderCards.findIndex(c => c.id === targetId);
    if (draggedIndex === targetIndex) return;
    
    const newCards = [...sliderCards];
    const [removed] = newCards.splice(draggedIndex, 1);
    newCards.splice(targetIndex, 0, removed);
    
    // Update order numbers
    const updatedCards = newCards.map((card, idx) => ({ ...card, order: idx + 1 }));
    setSliderCards(updatedCards);
    await reorderSliderCards(updatedCards);
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
    { value: 'gray', label: '⚪ Gray' },
    { value: 'indigo', label: '🔷 Indigo' }
  ];

  // Icon options
  const iconOptions = ['📢', '📝', '📚', '👑', '🎯', '🔔', '⭐', '💡', '🎓', '📖', '✏️', '🏆'];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('buttons')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'buttons'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🔘 Quick Access Buttons
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'categories'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🏷️ Categories
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'notifications'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📢 Notifications
        </button>
        <button
          onClick={() => setActiveTab('slider')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'slider'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🎠 Slider Cards
        </button>
      </div>

      {/* ============================================ */}
      {/* QUICK ACCESS BUTTONS TAB */}
      {/* ============================================ */}
      {activeTab === 'buttons' && (
        <div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              {editingButton ? '✏️ Edit Button' : '➕ Add New Button'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Label (e.g., Files)"
                value={buttonForm.label}
                onChange={(e) => setButtonForm({ ...buttonForm, label: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Icon (emoji: 📁)"
                value={buttonForm.icon}
                onChange={(e) => setButtonForm({ ...buttonForm, icon: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Path (e.g., /files)"
                value={buttonForm.path}
                onChange={(e) => setButtonForm({ ...buttonForm, path: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveButton}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
                >
                  {editingButton ? 'Update' : 'Add'}
                </button>
                {editingButton && (
                  <button
                    onClick={() => { setEditingButton(null); setButtonForm({ label: '', icon: '📁', path: '', order: 0 }); }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Icon</th>
                  <th className="p-3 text-left">Label</th>
                  <th className="p-3 text-left">Path</th>
                  <th className="p-3 text-left">Order</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buttons.map((btn) => (
                  <tr key={btn.id} className="border-b">
                    <td className="p-3 text-2xl">{btn.icon}</td>
                    <td className="p-3 font-medium">{btn.label}</td>
                    <td className="p-3 text-gray-500">{btn.path}</td>
                    <td className="p-3">{btn.order}</td>
                    <td className="p-3">
                      <button onClick={() => handleEditButton(btn)} className="text-blue-600 mr-3">✏️</button>
                      <button onClick={() => handleDeleteButton(btn.id)} className="text-red-600">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CATEGORIES TAB */}
      {/* ============================================ */}
      {activeTab === 'categories' && (
        <div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              {editingCategory ? '✏️ Edit Category' : '➕ Add New Category'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="text"
                placeholder="Name (e.g., Exam Notification)"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Slug (e.g., exam)"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <select
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              >
                {colorOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={categoryForm.icon}
                onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              >
                {iconOptions.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCategory}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
                >
                  {editingCategory ? 'Update' : 'Add'}
                </button>
                {editingCategory && (
                  <button
                    onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', slug: '', color: 'gray', icon: '📢', order: 0 }); }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Icon</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Slug</th>
                  <th className="p-3 text-left">Color</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b">
                    <td className="p-3 text-2xl">{cat.icon}</td>
                    <td className="p-3 font-medium">{cat.name}</td>
                    <td className="p-3 text-gray-500">{cat.slug}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs bg-${cat.color}-100 text-${cat.color}-700`}>
                        {cat.color}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => handleEditCategory(cat)} className="text-blue-600 mr-3">✏️</button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600">🗑️</button>
                    </td>
                  </tr>
                ))}
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
          <button
            onClick={() => { setEditingNotification(null); setNotificationForm({ title: '', content: '', category_id: '', link: '', image_url: '', is_pinned: 0, status: 'published' }); setShowNotifModal(true); }}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
          >
            + Create New Notification
          </button>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
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
                  return (
                    <tr key={notif.id} className="border-b">
                      <td className="p-3 font-medium max-w-[200px] truncate">{notif.title}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-1">
                          <span>{category?.icon}</span> {category?.name}
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
                        <button onClick={() => handleEditNotification(notif)} className="text-blue-600 mr-3">✏️</button>
                        <button onClick={() => handleDeleteNotification(notif.id)} className="text-red-600">🗑️</button>
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
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              {editingCard ? '✏️ Edit Card' : '➕ Add New Card'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Title"
                value={cardForm.title}
                onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Description"
                value={cardForm.description}
                onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={cardForm.image_url}
                onChange={(e) => setCardForm({ ...cardForm, image_url: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Link (e.g., /files or https://...)"
                value={cardForm.link}
                onChange={(e) => setCardForm({ ...cardForm, link: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Button Text (e.g., Explore Now)"
                value={cardForm.button_text}
                onChange={(e) => setCardForm({ ...cardForm, button_text: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCard}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
                >
                  {editingCard ? 'Update' : 'Add'}
                </button>
                {editingCard && (
                  <button
                    onClick={() => { setEditingCard(null); setCardForm({ title: '', description: '', image_url: '', link: '', button_text: 'View More', order: 0 }); }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {sliderCards.map((card, idx) => (
              <div key={card.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border flex items-center gap-4">
                <div className="cursor-move text-gray-400 text-2xl">⋮⋮</div>
                <img src={card.image_url} alt={card.title} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <h4 className="font-semibold">{card.title}</h4>
                  <p className="text-sm text-gray-500 truncate">{card.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditCard(card)} className="text-blue-600">✏️</button>
                  <button onClick={() => handleDeleteCard(card.id)} className="text-red-600">🗑️</button>
                  {idx > 0 && (
                    <button onClick={() => handleReorderCards(card.id, sliderCards[idx-1].id)} className="text-gray-500">⬆️</button>
                  )}
                  {idx < sliderCards.length - 1 && (
                    <button onClick={() => handleReorderCards(card.id, sliderCards[idx+1].id)} className="text-gray-500">⬇️</button>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {editingNotification ? '✏️ Edit Notification' : '➕ Create Notification'}
              </h3>
              <button onClick={() => setShowNotifModal(false)} className="text-gray-500 text-2xl">×</button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              
              <select
                value={notificationForm.category_id}
                onChange={(e) => setNotificationForm({ ...notificationForm, category_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
              
              <textarea
                placeholder="Content (HTML supported)"
                value={notificationForm.content}
                onChange={(e) => setNotificationForm({ ...notificationForm, content: e.target.value })}
                rows="6"
                className="w-full px-3 py-2 border rounded-lg"
              />
              
              <input
                type="text"
                placeholder="Link (optional)"
                value={notificationForm.link}
                onChange={(e) => setNotificationForm({ ...notificationForm, link: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={notificationForm.image_url}
                onChange={(e) => setNotificationForm({ ...notificationForm, image_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              
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
                <button onClick={handleSaveNotification} className="flex-1 py-2 bg-green-600 text-white rounded-lg">
                  {editingNotification ? 'Update' : 'Create'}
                </button>
                <button onClick={() => setShowNotifModal(false)} className="flex-1 py-2 bg-gray-500 text-white rounded-lg">
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