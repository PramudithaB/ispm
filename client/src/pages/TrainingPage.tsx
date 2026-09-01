import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { trainingService } from '../services/api';
import { ITrainingModule, TrainingCategory } from '../types';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Search,
  Filter,
  Plus,
  FileText,
  FileUp,
  Trash2,
  Edit3,
  HelpCircle,
  X,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const TrainingPage: React.FC = () => {
  const { user, isAdminOrSecurity } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState<ITrainingModule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingModule, setEditingModule] = useState<ITrainingModule | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Patient Data Confidentiality');
  const [formDuration, setFormDuration] = useState<number>(15);
  const [formPassingScore, setFormPassingScore] = useState<number>(70);
  const [formStatus, setFormStatus] = useState<'Published' | 'Draft' | 'Archived'>('Published');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const categories = [
    'Patient Data Confidentiality',
    'Phishing Awareness',
    'Password Hygiene',
    'Device Security',
    'Social Engineering',
    'Physical Security',
  ];

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;

      const res = await trainingService.getTrainings(params);
      if (res.data.success) {
        setModules(res.data.trainings);
      }
    } catch (err) {
      console.error('Failed to fetch training modules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [searchTerm, selectedCategory]);

  const handleOpenCreateModal = () => {
    setEditingModule(null);
    setFormTitle('');
    setFormDescription('');
    setFormContent('');
    setFormCategory('Patient Data Confidentiality');
    setFormDuration(15);
    setFormPassingScore(70);
    setFormStatus('Published');
    setPdfFile(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mod: ITrainingModule) => {
    setEditingModule(mod);
    setFormTitle(mod.title);
    setFormDescription(mod.description);
    // Extract text content
    let textContent = '';
    if (typeof mod.content === 'string') {
      textContent = mod.content;
    } else if (mod.content?.introduction) {
      const sectionsText = mod.content.sections?.map((s) => `${s.title}:\n${s.body}`).join('\n\n') || '';
      textContent = `${mod.content.introduction}\n\n${sectionsText}`;
    }
    setFormContent(textContent);
    setFormCategory(mod.category);
    setFormDuration(mod.durationMinutes || 15);
    setFormPassingScore(mod.passingScore || 70);
    setFormStatus(mod.status || 'Published');
    setPdfFile(null);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim() || !formDescription.trim()) {
      setFormError('Module title and description are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', formTitle.trim());
      formData.append('description', formDescription.trim());
      formData.append('content', formContent.trim() || formDescription.trim());
      formData.append('category', formCategory);
      formData.append('durationMinutes', String(formDuration));
      formData.append('passingScore', String(formPassingScore));
      formData.append('status', formStatus);

      if (pdfFile) {
        formData.append('pdf', pdfFile);
      }

      if (editingModule) {
        await trainingService.updateTraining(editingModule._id, formData);
      } else {
        await trainingService.createTraining(formData);
      }

      setIsModalOpen(false);
      await fetchModules();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save training module.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModule = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete the training module "${title}" and its associated quiz?`)) {
      return;
    }

    try {
      await trainingService.deleteTraining(id);
      await fetchModules();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete training module.');
    }
  };

  const getStatusBadge = (status?: string, score?: number) => {
    switch (status) {
      case 'Completed':
        return (
          <Badge variant="success" size="sm" dot>
            Completed ({score}%)
          </Badge>
        );
      case 'In Progress':
        return (
          <Badge variant="warning" size="sm">
            In Progress
          </Badge>
        );
      case 'Not Completed':
        return (
          <Badge variant="danger" size="sm">
            Not Completed
          </Badge>
        );
      case 'Overdue':
        return (
          <Badge variant="danger" size="sm">
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            Not Started
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Security Awareness Training & Quizzes
            </h1>
            <Badge variant="purple" size="sm">
              {modules.length} Modules
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Information security training modules for hospital staff with interactive knowledge quizzes and PDF study guides.
          </p>
        </div>

        {isAdminOrSecurity && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Training Module</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search modules by title or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Modules Grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading training modules..." />
      ) : modules.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Training Modules Found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {isAdminOrSecurity ? 'Click "Create Training Module" above to add your first module.' : 'No modules match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <div
              key={module._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-6">
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60 truncate">
                    {module.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {module.pdfFilePath && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> PDF
                      </span>
                    )}
                    {getStatusBadge(module.userStatus, module.userScore)}
                  </div>
                </div>

                <Link
                  to={`/training/${module._id}`}
                  className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2"
                >
                  {module.title}
                </Link>

                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {module.description}
                </p>

                {/* Progress bar if in progress or completed */}
                {module.userScore !== undefined && module.userScore > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mb-1">
                      <span>Quiz Score</span>
                      <span className="font-bold text-slate-800">{module.userScore}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          module.userScore >= module.passingScore
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${module.userScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{module.durationMinutes} mins</span>
                  <span className="text-slate-300">•</span>
                  <span>Pass: {module.passingScore}%</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdminOrSecurity ? (
                    <>
                      <Link
                        to={`/training/${module._id}/quiz`}
                        title="Manage Quiz"
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Quiz</span>
                      </Link>
                      <button
                        onClick={() => handleOpenEditModal(module)}
                        title="Edit Module"
                        className="p-1.5 text-slate-600 hover:bg-slate-200/70 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module._id, module.title)}
                        title="Delete Module"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : null}

                  <Link
                    to={`/training/${module._id}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm ${
                      module.userStatus === 'Completed'
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/20'
                    }`}
                  >
                    {module.userStatus === 'Completed' ? (
                      <>
                        <BookOpen className="w-3.5 h-3.5" /> Review
                      </>
                    ) : module.userStatus === 'In Progress' ? (
                      <>
                        <Play className="w-3.5 h-3.5" /> Continue
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Start
                      </>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT TRAINING MODULE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-200/60 flex items-center justify-center text-brand-600">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingModule ? 'Edit Training Module' : 'Create New Training Module'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Hospital Information Security awareness course
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveModule} className="space-y-4">
              {/* Module Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Patient Health Information Security & Privacy"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Short Description *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Brief summary of what clinical staff will learn..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              {/* Category & Duration & Passing Score */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Passing Grade (%)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={formPassingScore}
                    onChange={(e) => setFormPassingScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Module Content */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Module Content / Study Material
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed training guidelines, policies, or learning notes for staff..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none font-mono text-slate-800"
                />
              </div>

              {/* Optional PDF Upload */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileUp className="w-4 h-4 text-brand-600" />
                  <span>Optional PDF Document Upload</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Attach an official security guide, procedure document, or handout (Max 20MB, .pdf).
                </p>

                {editingModule?.pdfFileName && !pdfFile && (
                  <div className="mb-2 p-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate">
                      <FileText className="w-4 h-4 text-rose-500" />
                      <span>Current: <strong>{editingModule.pdfFileName}</strong></span>
                    </span>
                    <span className="text-[10px] text-slate-400">Choose file below to replace</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setPdfFile(e.target.files[0]);
                    }
                  }}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Publication Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white font-medium"
                >
                  <option value="Published">Published (Visible to all staff)</option>
                  <option value="Draft">Draft (Admin only)</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-500/20 transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Module...</span>
                    </>
                  ) : (
                    <span>{editingModule ? 'Update Module' : 'Create Module'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
