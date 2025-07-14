import React from 'react';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: 'Điều khiển Audio',
      items: [
        { key: '2', description: 'Play/Pause audio' },
        { key: '1', description: 'Lùi 3 giây' },
        { key: '3', description: 'Tiến 3 giây' },
      ]
    },
    {
      category: 'Điều hướng',
      items: [
        { key: 'Ctrl + ↑', description: 'Chuyển lên câu trước' },
        { key: 'Ctrl + ↓', description: 'Chuyển xuống câu tiếp theo' },
        { key: '←', description: 'Focus vào ô input đầu tiên' },
        { key: '→', description: 'Focus vào ô input cuối cùng' },
      ]
    },
    {
      category: 'Nhập liệu',
      items: [
        { key: 'Enter', description: 'Kiểm tra đáp án và chuyển ô tiếp theo' },
        { key: 'Tab', description: 'Chuyển đến ô input tiếp theo' },
        { key: 'Shift + Tab', description: 'Chuyển về ô input trước' },
        { key: '0-9', description: 'Bị vô hiệu để dành cho điều khiển audio' },
      ]
    }
  ];

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2>Phím tắt</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="help-content">
          {shortcuts.map((category, index) => (
            <div key={index} className="shortcut-category">
              <h3>{category.category}</h3>
              <div className="shortcut-list">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="shortcut-item">
                    <kbd className="shortcut-key">{item.key}</kbd>
                    <span className="shortcut-description">{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div className="help-tips">
            <h3>Mẹo sử dụng</h3>
            <ul>
              <li>Nhập từ vào ô trống và nhấn <strong>Enter</strong> để kiểm tra đáp án</li>
              <li>Ô đúng sẽ tô xanh, ô sai sẽ tô đỏ và hiển thị đáp án đúng</li>
              <li>Số 1, 2, 3 được dành riêng cho điều khiển audio</li>
              <li>Click vào sidebar để nhanh chóng chuyển đến câu hỏi khác</li>
              <li>Thống kê độ chính xác được cập nhật khi bạn kiểm tra đáp án</li>
            </ul>
          </div>
        </div>
        
        <div className="help-footer">
          <button className="help-close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
