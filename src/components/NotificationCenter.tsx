import React, { useState } from 'react';
import { AppNotification, Teacher, UserRole } from '../types';
import {
  Bell,
  Send,
  CheckCheck,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface NotificationCenterProps {
  notifications: AppNotification[];
  teachers: Teacher[];
  currentRole: UserRole;
  onMarkAsRead: (id: string) => void;
  onSendNotification: (notif: Omit<AppNotification, 'id' | 'createdAt'>) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  teachers,
  currentRole,
  onMarkAsRead,
  onSendNotification,
}) => {
  const [recipient, setRecipient] = useState<string>('all');
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [type, setType] = useState<AppNotification['type']>('schedule_change');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo.');
      return;
    }

    onSendNotification({
      targetTeacherId: recipient,
      title: title.trim(),
      message: message.trim(),
      type: type,
      isRead: false,
    });

    setTitle('');
    setMessage('');
    alert('Đã phát thông báo trực tuyến đến ' + (recipient === 'all' ? 'toàn thể giáo viên!' : 'giáo viên được chọn!'));
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'schedule_change':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      case 'conflict_alert':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'report_reminder':
        return <FileText className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Trung Tâm Thông Báo & Cảnh Báo Điều Chỉnh Giảng Dạy
            </h2>
            <p className="text-xs text-slate-500">
              Đồng bộ thời gian thực • Gửi thông báo trực tuyến đến từng giáo viên qua ứng dụng
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Tổng số: <strong className="text-slate-900">{notifications.length}</strong> thông báo
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Notification Feed (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Hộp Thư Thông Báo Trực Tuyến
              </span>
              <span className="text-xs text-slate-500">
                Tự động đẩy thông báo khi có thay đổi tiết
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <CheckCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Chưa có thông báo nào được ghi nhận.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 transition-colors hover:bg-slate-50 ${
                      !notif.isRead ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs mt-0.5">
                          {getIcon(notif.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(notif.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })} - {new Date(notif.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                            <span>• Gửi tới: {notif.targetTeacherId === 'all' ? 'Toàn trường' : notif.targetTeacherId}</span>
                          </div>
                        </div>
                      </div>

                      {!notif.isRead && (
                        <button
                          onClick={() => onMarkAsRead(notif.id)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold shrink-0"
                          title="Đánh dấu đã đọc"
                        >
                          Đã đọc
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Dispatch Announcement (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
              <Send className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Phát Thông Báo Mới Tới Giáo Viên
              </h3>
            </div>

            {currentRole === 'teacher' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                Chỉ <strong>Phó hiệu trưởng chuyên môn</strong> hoặc <strong>Tổ trưởng chuyên môn</strong> mới có quyền phát thông báo toàn trường hoặc gửi lệnh điều động tiết dạy.
              </div>
            ) : (
              <form onSubmit={handleSend} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Người nhận thông báo:
                  </label>
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                  >
                    <option value="all">Toàn bộ Giáo viên (3 Điểm trường)</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.code}] {t.fullName} - {t.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phân loại thông báo:
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  >
                    <option value="schedule_change">Thay đổi Thời khóa biểu</option>
                    <option value="report_reminder">Nhắc nộp Sổ báo giảng điện tử</option>
                    <option value="conflict_alert">Cảnh báo trùng tiết / Phòng học</option>
                    <option value="general">Thông báo chung</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tiêu đề thông báo:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Điều chỉnh tiết KHTN Tuần 2..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nội dung chi tiết:
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Nhập nội dung thông báo gửi đến ứng dụng của giáo viên..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi Thông Báo Tức Thì</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
