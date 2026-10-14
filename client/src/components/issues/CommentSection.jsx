import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { MessageSquare, Trash2, Send } from 'lucide-react';

export const CommentSection = ({ issueId }) => {
  const { user } = useAuth();
  const { isAdmin } = useProject();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/issues/${issueId}/comments`);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) {
      fetchComments();
    }
  }, [issueId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/issues/${issueId}/comments`, {
        body: commentText.trim(),
      });
      setComments((prev) => [...prev, res.data.data]);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/issues/${issueId}/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Comment Input */}
      <form onSubmit={handleAddComment} className="flex gap-3 items-start">
        <Avatar user={user} size="sm" />
        <div className="flex-1">
          <textarea
            rows={2}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment or update to the discussion..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
          <div className="flex justify-end mt-1.5">
            <Button
              type="submit"
              size="sm"
              disabled={!commentText.trim()}
              loading={submitting}
              icon={Send}
            >
              Comment
            </Button>
          </div>
        </div>
      </form>

      {/* Comment List */}
      <div className="space-y-3 pt-2">
        {loading ? (
          <div className="text-center py-4 text-xs text-slate-400">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 flex flex-col items-center gap-1">
            <MessageSquare className="w-5 h-5 text-slate-300" />
            No comments yet. Start the conversation!
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthor =
              comment.author?._id === user?._id || comment.author === user?._id;
            const canDelete = isAuthor || isAdmin;

            return (
              <div
                key={comment._id}
                className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 group transition hover:border-slate-200"
              >
                <Avatar user={comment.author} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {comment.author?.name || 'User'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition p-1"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">
                    {comment.body}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
